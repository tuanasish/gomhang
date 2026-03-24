const fs = require('fs');
const now = new Date();
const timeStr = `[${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}]`;

let sessionPath = '.brain/session.json';
if (fs.existsSync(sessionPath)) {
    let data = JSON.parse(fs.readFileSync(sessionPath, 'utf8'));
    if (data.working_on) {
        data.working_on.status = 'running';
        data.working_on.last_run = now.toISOString();
        data.working_on.last_run_url = 'http://localhost:8081';
    }
    fs.writeFileSync(sessionPath, JSON.stringify(data, null, 4));
}

let logPath = '.brain/session_log.txt';
let logLine = `\n${timeStr} RUN SUCCESS: App running at http://localhost:8081\n`;
if (fs.existsSync(logPath)) {
    fs.appendFileSync(logPath, logLine);
} else {
    fs.writeFileSync(logPath, logLine);
}
