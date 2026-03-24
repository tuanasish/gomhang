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
        try {
            const parsed = JSON.parse(data);
            const token = parsed.data.token;
            if (!token) {
                console.log('Login failed:', parsed);
                return;
            }

            // Get orders
            http.get('http://localhost:5000/api/orders', { headers: { Authorization: `Bearer ${token}` } }, res2 => {
                let data2 = '';
                res2.on('data', chunk => data2 += chunk);
                res2.on('end', () => {
                    const parsed2 = JSON.parse(data2);
                    const order = parsed2.data.find(o => o.status === 'pending');
                    if (!order) {
                        console.log('No pending order found');
                        return;
                    }

                    // Approve order
                    const req3 = http.request({
                        hostname: 'localhost',
                        port: 5000,
                        path: `/api/orders/${order.id}`,
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json',
                            Authorization: `Bearer ${token}`
                        }
                    }, res3 => {
                        let data3 = '';
                        res3.on('data', chunk => data3 += chunk);
                        res3.on('end', () => {
                            console.log('Approve response:', data3);
                        });
                    });
                    req3.write(JSON.stringify({ status: 'completed' }));
                    req3.end();
                });
            });
        } catch (e) { console.error('Error parsing:', e); }
    });
});
req.write(JSON.stringify({ username: 'admin', password: 'password123' }));
req.end();
