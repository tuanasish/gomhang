import { readFile } from 'node:fs/promises';
import { createPrivateKey, sign } from 'node:crypto';

const API_BASE = 'https://api.appstoreconnect.apple.com/v1';
const POLL_INTERVAL_MS = 30_000;
const PROCESSING_TIMEOUT_MS = 30 * 60_000;

const requiredEnvironment = [
  'EXPO_ASC_API_KEY_PATH',
  'EXPO_ASC_KEY_ID',
  'EXPO_ASC_ISSUER_ID',
  'ASC_APP_ID',
  'BUILD_NUMBER',
  'EXTERNAL_GROUP_NAME',
];

for (const name of requiredEnvironment) {
  if (!process.env[name]) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
}

const base64Url = value => Buffer.from(value).toString('base64url');

async function createToken() {
  const issuedAt = Math.floor(Date.now() / 1000);
  const header = base64Url(JSON.stringify({
    alg: 'ES256',
    kid: process.env.EXPO_ASC_KEY_ID,
    typ: 'JWT',
  }));
  const payload = base64Url(JSON.stringify({
    iss: process.env.EXPO_ASC_ISSUER_ID,
    iat: issuedAt,
    exp: issuedAt + 600,
    aud: 'appstoreconnect-v1',
  }));
  const signingInput = `${header}.${payload}`;
  const keyContents = await readFile(process.env.EXPO_ASC_API_KEY_PATH, 'utf8');
  const signature = sign('SHA256', Buffer.from(signingInput), {
    key: createPrivateKey(keyContents),
    dsaEncoding: 'ieee-p1363',
  }).toString('base64url');
  return `${signingInput}.${signature}`;
}

async function request(path, { method = 'GET', body, acceptedStatuses = [200] } = {}) {
  const token = await createToken();
  const response = await fetch(`${API_BASE}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });

  if (!acceptedStatuses.includes(response.status)) {
    const responseText = await response.text();
    throw new Error(`${method} ${path} failed (${response.status}): ${responseText}`);
  }

  if (response.status === 204) {
    return null;
  }
  return response.json();
}

async function waitForProcessedBuild() {
  const deadline = Date.now() + PROCESSING_TIMEOUT_MS;
  const query = new URLSearchParams({
    limit: '50',
    'fields[builds]': 'version,processingState,expired',
  });

  while (Date.now() < deadline) {
    const response = await request(`/apps/${process.env.ASC_APP_ID}/builds?${query}`);
    const build = response.data.find(item => item.attributes.version === process.env.BUILD_NUMBER);

    if (!build) {
      console.log(`Build ${process.env.BUILD_NUMBER} has not appeared in App Store Connect yet.`);
    } else if (build.attributes.processingState === 'VALID') {
      console.log(`Build ${process.env.BUILD_NUMBER} is valid in App Store Connect.`);
      return build;
    } else if (build.attributes.processingState === 'FAILED' || build.attributes.processingState === 'INVALID') {
      throw new Error(`Apple processing failed with state: ${build.attributes.processingState}`);
    } else {
      console.log(`Apple is processing build ${process.env.BUILD_NUMBER}: ${build.attributes.processingState}`);
    }

    await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL_MS));
  }

  throw new Error(`Timed out waiting for build ${process.env.BUILD_NUMBER} to finish processing.`);
}

async function findExternalGroup() {
  const query = new URLSearchParams({
    limit: '50',
    'fields[betaGroups]': 'name,isInternalGroup,publicLinkEnabled',
  });
  const response = await request(`/apps/${process.env.ASC_APP_ID}/betaGroups?${query}`);
  const group = response.data.find(item => (
    item.attributes.name === process.env.EXTERNAL_GROUP_NAME
    && item.attributes.isInternalGroup === false
  ));

  if (!group) {
    throw new Error(`External TestFlight group not found: ${process.env.EXTERNAL_GROUP_NAME}`);
  }
  return group;
}

async function distributeBuild(build, group) {
  await request(`/betaGroups/${group.id}/relationships/builds`, {
    method: 'POST',
    acceptedStatuses: [204, 409],
    body: { data: [{ type: 'builds', id: build.id }] },
  });
  console.log(`Build ${process.env.BUILD_NUMBER} was added to external group ${process.env.EXTERNAL_GROUP_NAME}.`);

  const detail = await request(`/builds/${build.id}/buildBetaDetail`);
  const externalState = detail.data.attributes.externalBuildState;
  console.log(`External testing state: ${externalState}`);

  if (externalState === 'READY_FOR_BETA_SUBMISSION') {
    await request('/betaAppReviewSubmissions', {
      method: 'POST',
      acceptedStatuses: [201, 409],
      body: {
        data: {
          type: 'betaAppReviewSubmissions',
          relationships: {
            build: { data: { type: 'builds', id: build.id } },
          },
        },
      },
    });
    console.log(`Build ${process.env.BUILD_NUMBER} was submitted for Beta App Review.`);
  }
}

const build = await waitForProcessedBuild();
const group = await findExternalGroup();
await distributeBuild(build, group);
