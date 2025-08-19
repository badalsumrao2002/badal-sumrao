const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { URLSearchParams } = require('url');

const port = 3000;
const dbPath = path.join(__dirname, 'db.json');

const mimeTypes = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.json': 'application/json' };

// --- HELPER FUNCTIONS ---
function parseCookies(req) {
    const list = {};
    const cookieHeader = req.headers?.cookie;
    if (!cookieHeader) return list;
    cookieHeader.split(';').forEach(cookie => {
        let [name, ...rest] = cookie.split('=');
        name = name?.trim(); if (!name) return;
        const value = rest.join('=').trim(); if (!value) return;
        list[name] = decodeURIComponent(value);
    });
    return list;
}

function serveStatic(res, url) {
    const safeUrl = url.split('?')[0];
    const filePath = path.join(__dirname, '..', safeUrl);
    const extname = String(path.extname(filePath)).toLowerCase();
    const contentType = mimeTypes[extname] || 'application/octet-stream';
    fs.readFile(filePath, (error, content) => {
        if (error) {
            res.writeHead(404, { 'Content-Type': 'text/html' }).end('404 Not Found');
        } else {
            res.writeHead(200, { 'Content-Type': contentType }).end(content);
        }
    });
}

function jsonResponse(res, statusCode, data) {
    res.writeHead(statusCode, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(data));
}

function redirect(res, location, cookies = []) {
    const headers = { 'Location': location };
    if (cookies.length > 0) headers['Set-Cookie'] = cookies;
    res.writeHead(302, headers).end();
}

function handleApiRequest(req, res, user) {
    const { method, url } = req;
    const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));

    if (method === 'GET' && url === '/api/my-bookings') {
        // In a real app, we would filter bookings by user.id
        // For now, returning all bookings for demonstration
        const userBookings = db.bookings.filter(b => b.customerId === user.id);
        return jsonResponse(res, 200, userBookings);
    }

    // Fallback for other authenticated API routes
    return jsonResponse(res, 404, { message: 'API endpoint not found' });
}

// --- MAIN SERVER LOGIC ---
const server = http.createServer((req, res) => {
    const { method, url } = req;

    let body = '';
    req.on('data', chunk => { body += chunk.toString(); });
    req.on('end', () => {
        const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
        const cookies = parseCookies(req);
        const session = db.sessions.find(s => s.sessionId === cookies.sessionId);
        const currentUser = session ? { id: session.userId, role: session.role } : null;

        // --- Handle POST requests (Login, Register, Booking) ---
        if (method === 'POST') {
            const params = new URLSearchParams(body);
            switch (url) {
                case '/api/login':
                case '/api/vendor/login':
                case '/api/admin/login':
                    const userType = url.includes('admin') ? 'admin' : (url.includes('vendor') ? 'vendor' : 'customer');
                    const identifier = userType === 'admin' ? 'username' : 'email';
                    const users = db[userType + 's'];
                    const userToLogin = users.find(u => u && u[identifier] === params.get(identifier) && u.password === params.get('password'));
                    if (userToLogin) {
                        const sessionId = crypto.randomBytes(16).toString('hex');
                        db.sessions.push({ sessionId, userId: userToLogin.id, role: userType });
                        fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
                        const destination = userType === 'customer' ? '/profile.html' : `/${userType}/dashboard.html`;
                        res.setHeader('Set-Cookie', `sessionId=${sessionId}; HttpOnly; Path=/`);
                        return jsonResponse(res, 200, { success: true, redirectUrl: destination });
                    }
                    return jsonResponse(res, 401, { success: false, message: 'Invalid credentials' });

                case '/api/register':
                    const newCustomer = new URLSearchParams(body);
                    const email = newCustomer.get('email');
                    if (db.customers.find(c => c.email === email)) {
                        return jsonResponse(res, 409, { message: 'Email already exists' });
                    }
                    const customerData = { id: Date.now(), name: newCustomer.get('name'), email: email, password: newCustomer.get('password') };
                    db.customers.push(customerData);
                    fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
                    return jsonResponse(res, 201, { message: 'Registration successful! Please login.' });

                case '/api/booking':
                    const bookingData = {};
                    for (const [key, value] of params.entries()) { bookingData[key] = value; }
                    bookingData.id = Date.now();
                    bookingData.status = 'Pending';
                    if (currentUser) bookingData.customerId = currentUser.id;
                    db.bookings.push(bookingData);
                    fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
                    return jsonResponse(res, 200, { message: 'Booking successful!' });
            }
        }

        // --- Handle GET requests ---
        if (method === 'GET') {
            // Auth-protected routes
            if (url.startsWith('/admin') || url.startsWith('/api/admin')) {
                if (!currentUser || currentUser.role !== 'admin') return redirect(res, '/admin/login.html');
            }
            if (url.startsWith('/vendor') || url.startsWith('/api/vendor')) {
                 if (!currentUser || currentUser.role !== 'vendor') return redirect(res, '/vendor/login.html');
            }
            if (url.startsWith('/profile') || url.startsWith('/api/my-bookings')) {
                 if (!currentUser || currentUser.role !== 'customer') return redirect(res, '/login.html');
            }

            // API router for GET requests
            if (url.startsWith('/api/')) {
                return handleApiRequest(req, res, currentUser);
            }

            // Static file serving
            return serveStatic(res, url === '/' ? '/index.html' : url);
        }

        // Fallback for other methods
        res.writeHead(405).end();
    });
});

server.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
