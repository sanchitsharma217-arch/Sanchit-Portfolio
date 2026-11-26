const nodemailer = require('nodemailer');

// Escape user input before placing it inside the email HTML
function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

const EMAIL_RE = /^[^\s@<>"]+@[^\s@<>"]+\.[^\s@<>"]+$/;

module.exports = async (req, res) => {
  // Enable CORS for cross-origin requests from GitHub Pages
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method Not Allowed' });
  }

  // Credentials must come from environment variables only (never hardcode them)
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  if (!smtpUser || !smtpPass) {
    console.error('[CONTACT] SMTP_USER / SMTP_PASS environment variables are not set.');
    return res.status(503).json({ success: false, error: 'Email service is not configured.' });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    const name = String(body.name || '').trim().slice(0, 100);
    const email = String(body.email || '').trim().slice(0, 200);
    const message = String(body.message || '').trim().slice(0, 5000);

    if (!name || !email || !message) {
      return res.status(400).json({ success: false, error: 'All fields are required.' });
    }
    if (!EMAIL_RE.test(email)) {
      return res.status(400).json({ success: false, error: 'Please enter a valid email address.' });
    }

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587', 10),
      secure: process.env.SMTP_SECURE === 'true',
      auth: { user: smtpUser, pass: smtpPass }
    });

    const safeName = escapeHtml(name);
    const safeEmail = escapeHtml(email);
    const safeMessage = escapeHtml(message).replace(/\n/g, '<br>');

    await transporter.sendMail({
      from: `"${name.replace(/["\r\n]/g, '')}" <${smtpUser}>`,
      replyTo: email,
      to: process.env.RECIPIENT_EMAIL || smtpUser,
      subject: `Portfolio Project Inquiry from ${name.replace(/[\r\n]/g, ' ')}`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; background: #0f0f0f; color: #ffffff; border-radius: 10px;">
          <h2 style="color: #ffffff; border-bottom: 1px solid #333; padding-bottom: 10px;">New Portfolio Project Inquiry</h2>
          <p><strong>Name:</strong> ${safeName}</p>
          <p><strong>Email:</strong> <a href="mailto:${safeEmail}" style="color: #ffffff;">${safeEmail}</a></p>
          <p><strong>Message:</strong></p>
          <div style="background: #1a1a1a; padding: 15px; border-left: 4px solid #ffffff; border-radius: 4px; color: #dddddd; line-height: 1.6;">
            ${safeMessage}
          </div>
        </div>
      `
    });

    return res.status(200).json({ success: true, message: 'Email sent successfully.' });
  } catch (err) {
    console.error('[CONTACT ERROR]:', err);
    return res.status(500).json({ success: false, error: 'Could not send your message. Please try again later.' });
  }
};
