const nodemailer = require('nodemailer');

module.exports = async (req, res) => {
  // Enable CORS for cross-origin requests from GitHub Pages
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method Not Allowed' });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    const { name, email, message } = body;

    if (!name || !email || !message) {
      return res.status(400).json({ success: false, error: 'All fields are required.' });
    }

    const smtpUser = process.env.SMTP_USER || 'sanchitsharma898811@gmail.com';
    const smtpPass = process.env.SMTP_PASS || 'jsrwjfvlgxexkaie';
    const recipientEmail = process.env.RECIPIENT_EMAIL || smtpUser;

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587', 10),
      secure: false,
      auth: {
        user: smtpUser,
        pass: smtpPass
      }
    });

    const mailOptions = {
      from: `"${name}" <${smtpUser}>`,
      replyTo: email,
      to: recipientEmail,
      subject: `🚀 Portfolio Inquiry from ${name}`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; background: #0f0f0f; color: #ffffff; border-radius: 10px;">
          <h2 style="color: #ffffff; border-bottom: 1px solid #333; padding-bottom: 10px;">New Portfolio Project Inquiry</h2>
          <p><strong>Name:</strong> ${name}</p>
          <p><strong>Email:</strong> <a href="mailto:${email}" style="color: #ffffff;">${email}</a></p>
          <p><strong>Message:</strong></p>
          <div style="background: #1a1a1a; padding: 15px; border-left: 4px solid #ffffff; border-radius: 4px; color: #dddddd; line-height: 1.6;">
            ${String(message).replace(/\n/g, '<br>')}
          </div>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    return res.status(200).json({ success: true, message: 'Email sent successfully via Gmail SMTP!' });
  } catch (err) {
    console.error('[VERCEL SMTP ERROR]:', err);
    return res.status(500).json({ success: false, error: err.message || 'Internal Server Error' });
  }
};
