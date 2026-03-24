const http = require('http');

const options = {
    hostname: 'localhost',
    port: 5000,
    path: '/api/auth/login',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
};

const req = http.request(options, res => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
        console.log("LOGIN RESPONSE:", data);
    });
});
req.on('error', e => console.error("REQUEST ERROR:", e));
req.write(JSON.stringify({ username: 'admin', password: 'password123' }));
req.end();
