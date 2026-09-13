const http = require('http');
const fs = require('fs');
const path = require('path');

// forward --port / --host style CLI args
const args = process.argv.slice(2);
function argVal(names, dflt) {
  for (let i = 0; i < args.length; i++) {
    for (const n of names) {
      if (args[i] === n && args[i + 1]) return args[i + 1];
      if (args[i].startsWith(n + '=')) return args[i].split('=')[1];
    }
  }
  return dflt;
}
const port = parseInt(argVal(['--port', '-p'], '7100'), 10);
const host = argVal(['--host', '-H'], '127.0.0.1');

const mime = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.svg': 'image/svg+xml',
  '.mp4': 'video/mp4', '.json': 'application/json' };

http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]);
  if (p === '/') p = '/index.html';
  const file = path.join(__dirname, p);
  if (!file.startsWith(__dirname)) { res.writeHead(403); return res.end(); }
  fs.readFile(file, (err, data) => {
    if (err) { res.writeHead(404); return res.end('not found'); }
    res.writeHead(200, { 'Content-Type': mime[path.extname(file).toLowerCase()] || 'application/octet-stream' });
    res.end(data);
  });
}).listen(port, host, () => console.log(`serving on http://${host}:${port}/`));
