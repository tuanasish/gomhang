const axios = require('axios');

const API_URL = 'https://gomhangprobackend.vercel.app/api';

async function test() {
    try {
        // Step 1: Login to get token
        console.log('Logging in...');
        const loginRes = await axios.post(`${API_URL}/auth/login`, {
            email: 'admin',      // using the known test account
            password: 'admin'
        });
        const token = loginRes.data.data.accessToken;
        console.log('Got token:', token.substring(0, 20) + '...');

        // Step 2: Try to save a fee
        console.log('\nSaving fee...');
        const saveRes = await axios.post(`${API_URL}/customer-fees`, {
            customerId: 'b52cd773-1e09-4130-be81-2deb84293c30',
            date: '2026-03-08',
            phiDongGui: 0,
            isInvoiced: true
        }, {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log('Save response:', saveRes.data);

        // Step 3: Fetch it back
        console.log('\nFetching fee...');
        const getRes = await axios.get(`${API_URL}/customer-fees/b52cd773-1e09-4130-be81-2deb84293c30?date=2026-03-08`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log('Get response:', getRes.data);

    } catch (e) {
        console.error('Error:', e.response?.data || e.message);
    }
}

test();
