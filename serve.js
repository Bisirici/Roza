// Basit statik dosya sunucusu — oyunu yerelde test etmek için (PWA/service worker
// file:// üzerinden çalışmadığından bir http sunucusu gerekir).
// Çalıştırmak için: node serve.js
const http = require('http');
const fs = require('fs');
const path = require('path');

const root = __dirname;
const port = process.env.PORT || 8099;

const mime = {
    '.html': 'text/html; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.png': 'image/png'
};

http.createServer((req, res) => {
    let filePath = decodeURIComponent(req.url.split('?')[0]);
    if (filePath === '/') filePath = '/index.html';
    const full = path.join(root, filePath);

    fs.readFile(full, (err, data) => {
        if (err) {
            res.writeHead(404);
            res.end('Not found');
            return;
        }
        const ext = path.extname(full);
        res.writeHead(200, { 'Content-Type': mime[ext] || 'application/octet-stream' });
        res.end(data);
    });
}).listen(port, () => console.log(`Roza'nın Oyun Dünyası: http://localhost:${port}`));
