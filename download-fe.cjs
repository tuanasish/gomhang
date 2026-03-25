const fs = require('fs');
const path = require('path');
const https = require('https');

const token = process.env.VERCEL_TOKEN || 'YOUR_TOKEN_HERE';
const headers = { 'Authorization': `Bearer ${token}` };
const teamId = 'team_h7tQ24E14QYd7VfvVSC1VfwK';
const deploymentId = 'dpl_3Huj2cH54XcEVNbPbTkMQsMc4gvF'; 

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); } catch (e) { reject(e); }
      });
    }).on('error', reject);
  });
}

function downloadFile(fileId, destPath) {
  return new Promise((resolve, reject) => {
    const url = `https://vercel.com/api/v7/deployments/${deploymentId}/files/${fileId}?teamId=${teamId}`;
    https.get(url, { headers }, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          fs.mkdirSync(path.dirname(destPath), { recursive: true });
          fs.writeFileSync(destPath, Buffer.from(json.data, 'base64'));
          resolve();
        } catch(e) { reject(e); }
      });
    }).on('error', reject);
  });
}

const flattenFiles = (nodes, currentPath = '') => {
  let result = [];
  for (const node of nodes) {
    let cleanName = node.name;
    const fullPath = currentPath ? path.join(currentPath, cleanName) : cleanName;
    if (node.type === 'directory' || node.children) {
      result = result.concat(flattenFiles(node.children || [], fullPath));
    } else if (node.type === 'file' || node.uid) {
      result.push({ ...node, file: fullPath });
    }
  }
  return result;
};

async function run() {
  try {
    const filesData = await fetchJson(`https://api.vercel.com/v6/deployments/${deploymentId}/files?teamId=${teamId}`);
    
    let rawList = Array.isArray(filesData) ? filesData : (filesData.files || []);
    let files = flattenFiles(rawList);
    // remove the primary 'src/' prefix caused by API wrapping
    files = files.map(f => {
      f.file = f.file.replace(/^src[\\\/]/, '');
      return f;
    });

    console.log(`Found ${files.length} files. Downloading...`);
    
    for (let i = 0; i < files.length; i += 7) {
      const batch = files.slice(i, i + 7);
      await Promise.all(batch.map(async (f) => {
        if (!f.uid || !f.file) return;
        const dest = path.join(process.cwd(), 'gomhang-frontend-new', f.file);
        await downloadFile(f.uid, dest);
      }));
    }
    console.log(`Download complete! Successfully downloaded ${files.length} files.`);
  } catch(e) {
    console.error('Error:', e);
  }
}

run();
