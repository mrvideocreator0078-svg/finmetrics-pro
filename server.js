const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;
const ROOT = __dirname;

const MIME_TYPES = {
  '.html': 'text/html; charset=UTF-8',
  '.css': 'text/css; charset=UTF-8',
  '.js': 'text/javascript; charset=UTF-8',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.xml': 'application/xml',
  '.txt': 'text/plain; charset=UTF-8'
};

const server = http.createServer((req, res) => {
  // CORS & Security headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('X-Content-Type-Options', 'nosniff');

  let reqPath = decodeURIComponent(req.url.split('?')[0]);
  if (reqPath === '/' || reqPath.endsWith('/')) {
    reqPath += 'index.html';
  }

  let fullPath = path.join(ROOT, reqPath);

  // If path is a directory, look for index.html inside
  if (fs.existsSync(fullPath) && fs.statSync(fullPath).isDirectory()) {
    fullPath = path.join(fullPath, 'index.html');
  }

  // If file doesn't exist, try appending .html
  if (!fs.existsSync(fullPath) && fs.existsSync(fullPath + '.html')) {
    fullPath += '.html';
  }

  if (fs.existsSync(fullPath) && fs.statSync(fullPath).isFile()) {
    const ext = path.extname(fullPath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': contentType });
    fs.createReadStream(fullPath).pipe(res);
  } else {
    res.writeHead(404, { 'Content-Type': 'text/html; charset=UTF-8' });
    res.end(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <title>404 Not Found — FinMetrics Pro</title>
        <link rel="stylesheet" href="/assets/css/main.css">
      </head>
      <body style="display:flex;align-items:center;justify-content:center;height:100vh;text-align:center;">
        <div>
          <h1 style="font-size:3rem;color:#10b981;">404</h1>
          <p style="font-size:1.2rem;margin-bottom:20px;">Page not found: ${reqPath}</p>
          <a href="/" style="color:#34d399;font-weight:700;">← Return to FinMetrics Pro Home</a>
        </div>
      </body>
      </html>
    `);
  }
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`\n======================================================`);
  console.log(`🚀 FINMETRICS PRO IS LIVE ON LOCALHOST!`);
  console.log(`======================================================`);
  console.log(`🔗 Local URL:    http://localhost:${PORT}`);
  console.log(`🔗 Network URL:  http://127.0.0.1:${PORT}`);
  console.log(`\nCalculators:`);
  console.log(`📈 Compound:     http://localhost:${PORT}/calculators/compound-interest/`);
  console.log(`🏡 Mortgage:     http://localhost:${PORT}/calculators/mortgage-payoff/`);
  console.log(`🛡️ Debt Payoff:  http://localhost:${PORT}/calculators/debt-payoff/`);
  console.log(`🚗 Auto Loan:    http://localhost:${PORT}/calculators/auto-loan-lease/`);
  console.log(`\nSupporting:`);
  console.log(`ℹ️ About:        http://localhost:${PORT}/about.html`);
  console.log(`📐 Methodology:  http://localhost:${PORT}/methodology.html`);
  console.log(`======================================================\n`);
});

