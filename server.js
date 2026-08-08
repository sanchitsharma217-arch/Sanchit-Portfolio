require('dotenv').config();
const http = require('http');
const fs = require('fs');
const path = require('path');
const nodemailer = require('nodemailer');

const PORT = process.env.PORT || 3000;

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
    });

    req.on('end', async () => {
      try {
        const { name, email, message } = JSON.parse(body || '{}');

        if (!name || !email || !message) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ success: false, error: 'All fields are required.' }));
        }

        console.log(`[SMTP INQUIRY RECEIVED] From: ${name} <${email}>`);
        console.log(`[MESSAGE]: ${message}`);

        const transporter = createSmtpTransporter();

        if (transporter) {
          const mailOptions = {
            from: `"${name}" <${process.env.SMTP_USER}>`,
            replyTo: email,
            to: process.env.RECIPIENT_EMAIL || process.env.SMTP_USER,
            subject: `🚀 Portfolio Inquiry from ${name}`,
            html: `
              <div style="font-family: Arial, sans-serif; padding: 20px; background: #0f0f0f; color: #ffffff; border-radius: 10px;">
                <h2 style="color: #ffffff; border-bottom: 1px solid #333; padding-bottom: 10px;">New Portfolio Project Inquiry</h2>
                <p><strong>Name:</strong> ${name}</p>
                <p><strong>Email:</strong> <a href="mailto:${email}" style="color: #ffffff;">${email}</a></p>
                <p><strong>Message:</strong></p>
                <div style="background: #1a1a1a; padding: 15px; border-left: 4px solid #ffffff; border-radius: 4px; color: #dddddd; line-height: 1.6;">
                  ${message.replace(/\n/g, '<br>')}
                </div>
              </div>
            `
          };

          await transporter.sendMail(mailOptions);
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

  // 2. Static File Server
  let filePath = path.join(__dirname, req.url === '/' ? 'index.html' : req.url);
  filePath = filePath.split('?')[0];

  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  fs.readFile(filePath, (err, content) => {
    if (err) {
      if (err.code === 'ENOENT') {
        res.writeHead(404, { 'Content-Type': 'text/html' });
        res.end('<h1>404 Not Found</h1>', 'utf-8');
      } else {
        res.writeHead(500);
        res.end(`Server Error: ${err.code}`, 'utf-8');
      }
    } else {
      res.writeHead(200, {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=3600'
      });
      res.end(content, 'utf-8');
    }
  });
});

server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}/`);
});
