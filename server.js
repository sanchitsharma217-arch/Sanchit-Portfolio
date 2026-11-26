require('dotenv').config();
const http = require('http');
const fs = require('fs');
const path = require('path');
const nodemailer = require('nodemailer');

const PORT = process.env.PORT || 3000;
const ROOT = __dirname;

const MIME_TYPES = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'text/javascript',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.json': 'application/json',
  '.ico': 'image/x-icon'
};

// Never serve these, even if requested directly
const BLOCKED = [/^\.env/i, /^\.git/i, /^node_modules/i, /^server\.js$/i, /^api[\\/]/i, /^package(-lock)?\.json$/i];

const EMAIL_RE = /^[^\s@<>"]+@[^\s@<>"]+\.[^\s@<>"]+$/;

// Escape user input before placing it inside the email HTML
function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Create Nodemailer SMTP Transporter
function createSmtpTransporter() {
  const host = process.env.SMTP_HOST || 'smtp.gmail.com';
  const port = parseInt(process.env.SMTP_PORT || '587', 10);
  const secure = process.env.SMTP_SECURE === 'true';
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!user || !pass) {
    return null; // Return null if SMTP credentials are not yet configured
  }

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass }
  });
}

const server = http.createServer((req, res) => {
  // 1. Handle SMTP Contact Form Submission Endpoint
  if (req.method === 'POST' && req.url === '/api/contact') {
    let body = '';

    req.on('data', chunk => {
      body += chunk.toString();
      if (body.length > 20000) req.destroy(); // reject oversized payloads
    });

    req.on('end', async () => {
      try {
        const parsed = JSON.parse(body || '{}');
        const name = String(parsed.name || '').trim().slice(0, 100);
        const email = String(parsed.email || '').trim().slice(0, 200);
        const message = String(parsed.message || '').trim().slice(0, 5000);

        if (!name || !email || !message) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ success: false, error: 'All fields are required.' }));
        }
        if (!EMAIL_RE.test(email)) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ success: false, error: 'Please enter a valid email address.' }));
        }

        console.log(`[SMTP INQUIRY RECEIVED] From: ${name} <${email}>`);

        const transporter = createSmtpTransporter();

        if (transporter) {
          await transporter.sendMail({
            from: `"${name.replace(/["\r\n]/g, '')}" <${process.env.SMTP_USER}>`,
            replyTo: email,
            to: process.env.RECIPIENT_EMAIL || process.env.SMTP_USER,
            subject: `Portfolio Project Inquiry from ${name.replace(/[\r\n]/g, ' ')}`,
            html: `
              <div style="font-family: Arial, sans-serif; padding: 20px; background: #0f0f0f; color: #ffffff; border-radius: 10px;">
                <h2 style="color: #ffffff; border-bottom: 1px solid #333; padding-bottom: 10px;">New Portfolio Project Inquiry</h2>
                <p><strong>Name:</strong> ${escapeHtml(name)}</p>
                <p><strong>Email:</strong> <a href="mailto:${escapeHtml(email)}" style="color: #ffffff;">${escapeHtml(email)}</a></p>
                <p><strong>Message:</strong></p>
                <div style="background: #1a1a1a; padding: 15px; border-left: 4px solid #ffffff; border-radius: 4px; color: #dddddd; line-height: 1.6;">
                  ${escapeHtml(message).replace(/\n/g, '<br>')}
                </div>
              </div>
            `
          });
          console.log(`[SMTP SUCCESS] Email delivered via SMTP!`);
        } else {
          console.log(`[SMTP NOTICE] SMTP credentials not set in .env. Logged inquiry locally.`);
        }

        res.writeHead(200, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ success: true, message: 'Message sent successfully!' }));

      } catch (err) {
        console.error('[SMTP ERROR]:', err);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ success: false, error: 'Internal server error processing email.' }));
      }
    });

    return;
  }

  // 2. Static File Server (restricted to the project folder)
  let urlPath;
  try {
    urlPath = decodeURIComponent(req.url.split('?')[0]);
  } catch {
    res.writeHead(400);
    return res.end('Bad Request');
  }
  if (urlPath === '/') urlPath = '/index.html';

  // Resolve inside the project folder only (blocks ../ path traversal)
  const filePath = path.resolve(ROOT, '.' + path.posix.normalize(urlPath));
  const relative = path.relative(ROOT, filePath);
  if (relative.startsWith('..') || path.isAbsolute(relative) || BLOCKED.some(re => re.test(relative))) {
    res.writeHead(404, { 'Content-Type': 'text/html' });
    return res.end('<h1>404 Not Found</h1>');
  }

  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  fs.readFile(filePath, (err, content) => {
    if (err) {
      if (err.code === 'ENOENT' || err.code === 'EISDIR') {
        res.writeHead(404, { 'Content-Type': 'text/html' });
        res.end('<h1>404 Not Found</h1>', 'utf-8');
      } else {
        res.writeHead(500);
        res.end('Server Error', 'utf-8');
      }
    } else {
      res.writeHead(200, {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=3600'
      });
      res.end(content);
    }
  });
});

server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}/`);
});
