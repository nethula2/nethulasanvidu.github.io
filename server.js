const http = require('http');
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const PORT = process.env.PORT || 3000;

// Load environment variables from .env if present
const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
    const envLines = fs.readFileSync(envPath, 'utf-8').split('\n');
    for (const line of envLines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;
        const eqIdx = trimmed.indexOf('=');
        if (eqIdx !== -1) {
            const key = trimmed.slice(0, eqIdx).trim();
            const val = trimmed.slice(eqIdx + 1).trim();
            if (!process.env[key]) process.env[key] = val;
        }
    }
}

// Global Enterprise Security Headers (OWASP Recommended)
const SECURITY_HEADERS = {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'SAMEORIGIN',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
    'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net https://cdnjs.cloudflare.com https://unpkg.com https://upload-widget.cloudinary.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdn.jsdelivr.net; font-src 'self' https://fonts.gstatic.com https://cdn.jsdelivr.net data:; img-src 'self' data: blob: https://res.cloudinary.com https://images.unsplash.com https://upload-widget.cloudinary.com; media-src 'self' data: blob: https://res.cloudinary.com; connect-src 'self' https://api.cloudinary.com https://res.cloudinary.com https://upload-widget.cloudinary.com https://*.supabase.co https://unpkg.com https://cdnjs.cloudflare.com; frame-src 'self' https://www.youtube.com https://upload-widget.cloudinary.com https://res.cloudinary.com; object-src 'none'; base-uri 'self';"
};

function applyGlobalHeaders(res) {
    for (const [header, value] of Object.entries(SECURITY_HEADERS)) {
        res.setHeader(header, value);
    }
}

const MIME_TYPES = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.webp': 'image/webp',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.pdf': 'application/pdf',
    '.woff2': 'font/woff2',
    '.woff': 'font/woff',
    '.ttf': 'font/ttf'
};

const server = http.createServer(async (req, res) => {
    applyGlobalHeaders(res);

    let reqUrl;
    try {
        reqUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    } catch (e) {
        res.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('400 Bad Request');
        return;
    }

    let reqPath = decodeURIComponent(reqUrl.pathname);

    // Helper: Shim Vercel/Express methods on res
    res.status = function (code) {
        this.statusCode = code;
        return this;
    };
    res.json = function (obj) {
        if (!this.getHeader('Content-Type')) {
            this.setHeader('Content-Type', 'application/json; charset=utf-8');
        }
        this.end(JSON.stringify(obj));
    };
    res.send = function (body) {
        this.end(body);
    };

    // 1. API Route Handler (Vercel Serverless Function compatibility)
    if (reqPath.startsWith('/api/')) {
        // Prevent path traversal in API path
        const normalizedApiPath = path.normalize(reqPath).replace(/^(\.\.[\/\\])+/, '').replace(/\\/g, '/');
        if (normalizedApiPath.includes('..') || normalizedApiPath.startsWith('/api/utils')) {
            res.status(403).json({ error: 'Access Denied' });
            return;
        }

        let apiFile = normalizedApiPath.endsWith('.js') ? normalizedApiPath : normalizedApiPath + '.js';
        let apiFilePath = path.join(__dirname, apiFile);

        if (fs.existsSync(apiFilePath)) {
            let bodyBuffer = [];
            let totalBytes = 0;
            const MAX_PAYLOAD = 10 * 1024 * 1024; // 10MB limit
            let payloadExceeded = false;

            req.on('data', chunk => {
                totalBytes += chunk.length;
                if (totalBytes > MAX_PAYLOAD) {
                    payloadExceeded = true;
                    req.destroy();
                    if (!res.writableEnded) {
                        res.writeHead(413, { 'Content-Type': 'application/json; charset=utf-8' });
                        res.end(JSON.stringify({ error: 'Payload Too Large. Maximum 10MB permitted.' }));
                    }
                } else {
                    bodyBuffer.push(chunk);
                }
            });

            req.on('end', async () => {
                if (payloadExceeded) return;

                const rawBody = Buffer.concat(bodyBuffer).toString('utf-8');
                if (rawBody) {
                    try {
                        req.body = JSON.parse(rawBody);
                    } catch (e) {
                        req.body = rawBody;
                    }
                } else {
                    req.body = {};
                }
                req.query = Object.fromEntries(reqUrl.searchParams.entries());

                try {
                    // Purge api modules from cache during local development
                    Object.keys(require.cache).forEach(key => {
                        if (key.includes('/api/') || key.includes('\\api\\')) {
                            delete require.cache[key];
                        }
                    });
                    const handler = require(apiFilePath);
                    await handler(req, res);
                } catch (apiErr) {
                    console.error(`API Error on ${reqPath}:`, apiErr);
                    if (!res.writableEnded) {
                        res.status(500).json({ error: 'An internal server error occurred.' });
                    }
                }
            });
            return;
        } else {
            res.status(404).json({ error: 'API Endpoint Not Found' });
            return;
        }
    }

    // 2. High-Performance Static File Serving with Traversal Defense, Gzip & Smart Caching
    if (reqPath === '/') reqPath = '/index.html';

    // Anti-Traversal & Sensitive File Shield
    const normalizedReqPath = path.normalize(reqPath).replace(/^(\.\.[\/\\])+/, '').replace(/\\/g, '/');
    const sensitiveExactFiles = [
        '/server.js',
        '/package.json',
        '/package-lock.json',
        '/vercel.json',
        '/mail.php',
        '/readme.md'
    ];
    if (
        normalizedReqPath.includes('..') ||
        /\/\./.test(normalizedReqPath) ||             // Dotfiles (.env, .git, etc.)
        normalizedReqPath.startsWith('/api') ||       // Direct access to backend source
        normalizedReqPath.startsWith('/scratch') ||   // Scratch scripts
        normalizedReqPath.startsWith('/node_modules') || // Node modules
        sensitiveExactFiles.includes(normalizedReqPath.toLowerCase())
    ) {
        res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('403 Forbidden: Access Denied');
        return;
    }

    const rootDir = path.resolve(__dirname);
    const filePath = path.resolve(rootDir, '.' + normalizedReqPath);

    // Boundary check: must be strictly inside root directory
    if (!filePath.startsWith(rootDir)) {
        res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('403 Forbidden: Directory Traversal Prohibited');
        return;
    }

    fs.stat(filePath, (statErr, stat) => {
        if (statErr || !stat.isFile()) {
            res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
            res.end('404 Not Found');
            return;
        }

        const ext = path.extname(filePath).toLowerCase();
        const contentType = MIME_TYPES[ext] || 'application/octet-stream';
        const etag = `W/"${stat.size.toString(16)}-${Math.floor(stat.mtimeMs).toString(16)}"`;

        // Check ETag (304 Not Modified)
        if (req.headers['if-none-match'] === etag) {
            res.writeHead(304, {
                'ETag': etag,
                'Cache-Control': 'no-cache, must-revalidate'
            });
            res.end();
            return;
        }

        fs.readFile(filePath, (readErr, content) => {
            if (readErr) {
                res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
                res.end('500 Internal Server Error');
                return;
            }

            const headers = {
                'Content-Type': contentType,
                'ETag': etag
            };

            // Smart Caching Strategy
            if (['.webp', '.png', '.jpg', '.jpeg', '.gif', '.svg', '.woff2', '.ttf'].includes(ext)) {
                headers['Cache-Control'] = 'public, max-age=604800, immutable'; // 7 Days Cache
            } else if (['.css', '.js'].includes(ext)) {
                headers['Cache-Control'] = 'no-cache, must-revalidate';
            } else if (ext === '.html') {
                headers['Cache-Control'] = 'no-cache'; // Always fresh
            }

            // Gzip Compression for Text Resources
            const isCompressible = ['.html', '.css', '.js', '.json', '.svg', '.xml'].includes(ext);
            const acceptEncoding = req.headers['accept-encoding'] || '';

            if (isCompressible && acceptEncoding.includes('gzip')) {
                zlib.gzip(content, (gzipErr, gzipped) => {
                    if (!gzipErr && gzipped) {
                        headers['Content-Encoding'] = 'gzip';
                        headers['Content-Length'] = gzipped.length;
                        res.writeHead(200, headers);
                        res.end(gzipped);
                    } else {
                        headers['Content-Length'] = content.length;
                        res.writeHead(200, headers);
                        res.end(content);
                    }
                });
            } else {
                headers['Content-Length'] = content.length;
                res.writeHead(200, headers);
                res.end(content);
            }
        });
    });
});

server.listen(PORT, () => {
    console.log(`\n========================================`);
    console.log(` Portfolio & Toolyard Server is LIVE (Hardened):`);
    console.log(` > Main Portfolio: http://localhost:${PORT}`);
    console.log(` > Toolyard Suite: http://localhost:${PORT}/tools.html`);
    console.log(` > Project Archive: http://localhost:${PORT}/works.html`);
    console.log(` > Admin Panel:    http://localhost:${PORT}/admin.html`);
    console.log(`========================================\n`);
});
