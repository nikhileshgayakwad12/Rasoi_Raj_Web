/**
 * Rasoi Raja Local Web Server
 * A native Node.js static file server that runs without any npm dependencies.
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

const DEFAULT_PORT = 3000;

// MIME types for static assets
const MIME_TYPES = {
    '.html': 'text/html; charset=UTF-8',
    '.css': 'text/css; charset=UTF-8',
    '.js': 'application/javascript; charset=UTF-8',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.json': 'application/json'
};

const server = http.createServer((req, res) => {
    // Decode request URL to handle spaces or special characters
    let safeUrl;
    try {
        safeUrl = decodeURIComponent(req.url);
    } catch (e) {
        res.statusCode = 400;
        res.end('Bad Request');
        return;
    }

    // Default to index.html for root path request
    let filePath = safeUrl === '/' ? '/index.html' : safeUrl;
    
    // Resolve absolute path in workspace
    const absolutePath = path.join(__dirname, filePath);
    
    // Safety check: Prevent directory traversal attacks
    if (!absolutePath.startsWith(__dirname)) {
        res.statusCode = 403;
        res.end('Forbidden');
        return;
    }

    // Check if file exists and read it
    fs.stat(absolutePath, (err, stats) => {
        if (err || !stats.isFile()) {
            res.statusCode = 404;
            res.setHeader('Content-Type', 'text/plain');
            res.end('404 Not Found');
            return;
        }

        // Get extension to set Content-Type header
        const ext = path.extname(absolutePath).toLowerCase();
        const contentType = MIME_TYPES[ext] || 'application/octet-stream';
        
        res.statusCode = 200;
        res.setHeader('Content-Type', contentType);
        
        // Use read stream for memory efficiency
        const stream = fs.createReadStream(absolutePath);
        stream.on('error', (streamErr) => {
            console.error('Stream read error:', streamErr);
            if (!res.headersSent) {
                res.statusCode = 500;
                res.setHeader('Content-Type', 'text/plain');
                res.end('Internal Server Error');
            }
        });
        stream.pipe(res);
    });
});

// Function to start server on an available port
function startServer(port) {
    server.listen(port, () => {
        console.log(`==================================================`);
        console.log(`  RASOI RAJA SCROLL ANIMATION LOCAL SERVER RUNNING `);
        console.log(`==================================================`);
        console.log(`  Local URL:  http://localhost:${port}`);
        console.log(`  Directory:  ${__dirname}`);
        console.log(`  Press Ctrl+C in terminal to stop.`);
        console.log(`==================================================`);
    });

    server.on('error', (err) => {
        if (err.code === 'EADDRINUSE') {
            console.log(`Port ${port} is in use. Trying port ${port + 1}...`);
            startServer(port + 1);
        } else {
            console.error('Server failed to start:', err);
        }
    });
}

// Start the server
startServer(DEFAULT_PORT);
