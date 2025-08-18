const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { URLSearchParams } = require('url');

const port = 3000;
const dbPath = path.join(__dirname, 'db.json');

const mimeTypes = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.json': 'application/json' };

// --- Server Utility Functions ---
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
    const safeUrl = url.split('?')[0]; // Ignore query params
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

function redirect(res, location) {
    res.writeHead(302, { 'Location': location });
    res.end();
}

// --- Main Server Logic ---
const server = http.createServer((req, res) => {
    const { method, url } = req;
    const cookies = parseCookies(req);

    let body = '';
    req.on('data', chunk => { body += chunk.toString(); });
    req.on('end', () => {
        const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
        const session = db.sessions.find(s => s.sessionId === cookies.sessionId);
        const user = session ? { id: session.userId, role: session.role } : null;

        // --- AUTHENTICATION ROUTES ---
        if (method === 'POST' && (url === '/api/admin/login' || url === '/api/vendor/login')) {
            const userType = url.includes('admin') ? 'admin' : 'vendor';
            const credentials = new URLSearchParams(body);
            const identifier = userType === 'admin' ? 'username' : 'email';
            const users = db[userType === 'admin' ? 'users' : 'vendors'];
            const userToLogin = users.find(u => u && u[identifier] === credentials.get(identifier) && u.password === credentials.get('password'));
            if (userToLogin) {
                const sessionId = crypto.randomBytes(16).toString('hex');
                db.sessions.push({ sessionId, userId: userToLogin.id, role: userType });
                fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
                return redirect(res, `/${userType}/dashboard.html`, { 'Set-Cookie': `sessionId=${sessionId}; HttpOnly; Path=/` });
            }
            return redirect(res, `/${userType}/login.html?error=1`);
        }
        if (url === '/api/logout') {
            db.sessions = db.sessions.filter(s => s.sessionId !== cookies.sessionId);
            fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
            return redirect(res, '/', { 'Set-Cookie': 'sessionId=; HttpOnly; Path=/; Max-Age=0' });
        }

        // --- AUTH MIDDLEWARE ---
        if ((url.startsWith('/admin') || url.startsWith('/api/admin')) && (!user || user.role !== 'admin')) {
            return url.includes('/login.html') ? serveStatic(res, url) : redirect(res, '/admin/login.html');
        }
        if ((url.startsWith('/vendor') || url.startsWith('/api/vendor')) && (!user || user.role !== 'vendor')) {
            return url.includes('/login.html') ? serveStatic(res, url) : redirect(res, '/vendor/login.html');
        }

        // --- API ROUTER ---
        if (url.startsWith('/api/')) {
            const id = parseInt(url.split('/').pop(), 10);

            // --- ADMIN API ---
            if (url.startsWith('/api/admin/')) {
                // PAGES
                if (url.startsWith('/api/admin/pages')) {
                    if (method === 'GET' && url === '/api/admin/pages') return jsonResponse(res, 200, db.pages);
                    if (method === 'GET' && url.match(/^\/api\/admin\/pages\/\d+$/)) return jsonResponse(res, 200, db.pages.find(p => p.id === id));
                    if (method === 'PUT' && url.match(/^\/api\/admin\/pages\/\d+$/)) {
                        const pageIndex = db.pages.findIndex(p => p.id === id);
                        if (pageIndex === -1) return jsonResponse(res, 404, { message: 'Page not found' });
                        db.pages[pageIndex] = { ...db.pages[pageIndex], ...JSON.parse(body) };
                        fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
                        return jsonResponse(res, 200, db.pages[pageIndex]);
                    }
                }
                // REVIEWS
                else if (url.startsWith('/api/admin/reviews')) {
                    if (method === 'GET') return jsonResponse(res, 200, db.reviews);
                    if (method === 'PUT') {
                        const reviewIndex = db.reviews.findIndex(r => r.id === id);
                        if (reviewIndex === -1) return jsonResponse(res, 404, { message: 'Review not found' });
                        db.reviews[reviewIndex].status = JSON.parse(body).status;
                        fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
                        return jsonResponse(res, 200, db.reviews[reviewIndex]);
                    }
                    if (method === 'DELETE') {
                        db.reviews = db.reviews.filter(r => r.id !== id);
                        fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
                        return jsonResponse(res, 200, { message: 'Deleted' });
                    }
                }
                // VENDORS
                else if (url.startsWith('/api/admin/vendors')) {
                    if (method === 'GET') return jsonResponse(res, 200, db.vendors);
                    if (method === 'POST') {
                        const newVendor = JSON.parse(body);
                        newVendor.id = Date.now();
                        newVendor.role = 'vendor';
                        db.vendors.push(newVendor);
                        fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
                        return jsonResponse(res, 201, newVendor);
                    }
                    if (method === 'PUT') {
                         const vendorIndex = db.vendors.findIndex(v => v.id === id);
                         if (vendorIndex === -1) return jsonResponse(res, 404, { message: 'Vendor not found' });
                         db.vendors[vendorIndex] = { ...db.vendors[vendorIndex], ...JSON.parse(body) };
                         fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
                         return jsonResponse(res, 200, db.vendors[vendorIndex]);
                    }
                    if (method === 'DELETE') {
                        db.vendors = db.vendors.filter(v => v.id !== id);
                        fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
                        return jsonResponse(res, 200, { message: 'Deleted' });
                    }
                }
                 else {
                    return jsonResponse(res, 404, { message: 'Admin API endpoint not found' });
                }
            }
            // --- VENDOR API ---
            else if (url.startsWith('/api/vendor/')) {
                if (url === '/api/vendor/bookings' && method === 'GET') {
                    // In a real app, this would filter by vendorId
                    return jsonResponse(res, 200, db.bookings);
                }
                if (url.match(/^\/api\/vendor\/bookings\/\d+$/) && method === 'PUT') {
                    const bookingIndex = db.bookings.findIndex(b => b.id === id);
                    if (bookingIndex === -1) return jsonResponse(res, 404, { message: 'Booking not found' });
                    db.bookings[bookingIndex].status = JSON.parse(body).status;
                    fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
                    return jsonResponse(res, 200, db.bookings[bookingIndex]);
                }
                // PROFILE
                else if (url === '/api/vendor/profile' && method === 'GET') {
                    const vendor = db.vendors.find(v => v.id === user.id);
                    return jsonResponse(res, 200, vendor);
                }
                else if (url === '/api/vendor/profile' && method === 'PUT') {
                    const vendorIndex = db.vendors.findIndex(v => v.id === user.id);
                    if (vendorIndex === -1) return jsonResponse(res, 404, { message: 'Vendor not found' });
                    const updatedData = JSON.parse(body);
                    // Prevent password update if blank
                    if (!updatedData.password) delete updatedData.password;
                    db.vendors[vendorIndex] = { ...db.vendors[vendorIndex], ...updatedData };
                    fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
                    return jsonResponse(res, 200, db.vendors[vendorIndex]);
                }
                 else {
                    return jsonResponse(res, 404, { message: 'Vendor API endpoint not found' });
                }
            }
            // --- PUBLIC API ---
            if (url === '/api/booking' && method === 'POST') {
                const newBooking = new URLSearchParams(body);
                const bookingData = {};
                for (const [key, value] of newBooking.entries()) {
                    bookingData[key] = value;
                }
                bookingData.id = Date.now();
                bookingData.status = 'Pending';
                db.bookings.push(bookingData);
                fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
                // Redirect to a thank you page or show a success message
                return jsonResponse(res, 200, { message: 'Booking successful!' });
            }
            else if (url === '/api/reviews' && method === 'POST') {
                const newReview = new URLSearchParams(body);
                db.reviews.push({ id: Date.now(), name: newReview.get('name'), rating: newReview.get('rating'), review: newReview.get('review'), status: 'pending' });
                fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
                return jsonResponse(res, 200, { message: 'Review submitted!' });
            }
            return jsonResponse(res, 404, { message: 'API endpoint not found' });
        }

        // --- SITEMAP ---
        if (url === '/sitemap.xml') {
            const baseUrl = 'https://your-domain.com'; // Placeholder
            const urls = db.pages.map(p => `<url><loc>${baseUrl}/pages/${p.slug}.html</loc></url>`).join('');
            const sitemap = `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</urlset>`;
            res.writeHead(200, { 'Content-Type': 'application/xml' });
            return res.end(sitemap);
        }

        // --- STATIC FILE SERVER ---
        return serveStatic(res, url === '/' ? '/index.html' : url);
    });
});

// ... (Migration logic can be added here if needed on first run)

server.listen(port, () => console.log(`Server running on port ${port}`));
