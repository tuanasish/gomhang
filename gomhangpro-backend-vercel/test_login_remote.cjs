const axios = require('axios');

async function testLogin(identifier, password) {
    try {
        const res = await axios.post('https://gomhangprobackend.vercel.app/api/auth/login', {
            [identifier.includes('@') ? 'email' : (identifier.match(/^\d+$/) ? 'phone' : 'username')]: identifier,
            password: password
        });
        console.log(`[SUCCESS] Login for ${identifier}:`);
        console.log(res.data);
    } catch (err) {
        console.log(`[ERROR] Login for ${identifier}:`);
        console.log(err.response ? err.response.data : err.message);
    }
}

async function run() {
    await testLogin('admin', 'password123');
    await testLogin('admin', 'admin123'); // testing another common password
    await testLogin('0987654321', 'password123');
}

run();
