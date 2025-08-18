const http = require('http');
const fs = require('fs');
const path =require('path');
const crypto = require('crypto');
const { URLSearchParams } = require('url');

const port = 3000;
const dbPath = path.join(__dirname, 'db.json');

const mimeTypes = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript' };

// --- Helper Functions ---
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
            res.writeHead(404).end('Not Found');
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
    if (cookies.length > 0) {
        headers['Set-Cookie'] = cookies;
    }
    res.writeHead(302, headers).end();
}


// --- Main Server ---
const server = http.createServer((req, res) => {
    const { method, url } = req;
    const cookies = parseCookies(req);

    let body = '';
    req.on('data', chunk => { body += chunk.toString(); });
    req.on('end', () => {
        const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));

        // --- Public API Routes ---
        if (method === 'POST' && url === '/api/register') {
            const customer = new URLSearchParams(body);
            if (db.customers.find(c => c.email === customer.get('email'))) {
                return jsonResponse(res, 409, { message: 'Email already exists' });
            }
            db.customers.push({ id: Date.now(), name: customer.get('name'), email: customer.get('email'), password: customer.get('password')});
            fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
            return jsonResponse(res, 201, { message: 'Registration successful' });
        }
        if (method === 'POST' && url === '/api/login') {
            const credentials = new URLSearchParams(body);
            const customer = db.customers.find(c => c.email === credentials.get('email') && c.password === credentials.get('password'));
            if (customer) {
                const sessionId = crypto.randomBytes(16).toString('hex');
                db.sessions.push({ sessionId, userId: customer.id, role: 'customer' });
                fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
                return redirect(res, '/profile.html', [`sessionId=${sessionId}; HttpOnly; Path=/`]);
            }
            return jsonResponse(res, 401, { message: 'Invalid credentials' });
        }
        if (method === 'POST' && url === '/api/booking') {
            // ... (booking logic)
            return jsonResponse(res, 200, { message: 'Booking received!' });
        }
        if (method === 'GET' && url === '/api/my-bookings') {
            const session = db.sessions.find(s => s.sessionId === cookies.sessionId);
            if (!session) return jsonResponse(res, 401, { message: 'Unauthorized' });
            // In a real app, filter bookings by session.userId
            return jsonResponse(res, 200, db.bookings);
        }

        // --- Static File Serving ---
        if (method === 'GET') {
            const publicRoutes = ['/', '/index.html', '/register.html', '/login.html'];
            if (publicRoutes.includes(url) || url.startsWith('/css/') || url.startsWith('/js/') || url.startsWith('/images/')) {
                return serveStatic(res, url === '/' ? '/index.html' : url);
            }
            // Protected routes below
            const session = db.sessions.find(s => s.sessionId === cookies.sessionId);
            if (session) {
                if (url === '/profile.html') {
                    return serveStatic(res, url);
                }
            }
            return redirect(res, '/login.html');
        }

        // Fallback for unhandled routes
        res.writeHead(404).end();
    });
});

server.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
