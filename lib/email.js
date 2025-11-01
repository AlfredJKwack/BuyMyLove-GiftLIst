import nodemailer from 'nodemailer';

// Create transporter
function createTransporter() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_PORT === '465',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

// Send OTP email
async function sendOtpEmail(email, token) {
  const transporter = createTransporter();
  const appUrl = process.env.APP_URL || 'http://localhost:3000';
  const loginUrl = `${appUrl}/api/auth/verify?token=${token}`;

  const mailOptions = {
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to: email,
    subject: 'Login to Gift List Admin',
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Admin Login Request</h2>
        <p>Click the link below to log in to the Gift List admin panel:</p>
        <p>
          <a href="${loginUrl}" style="display: inline-block; padding: 12px 24px; background-color: #3b82f6; color: white; text-decoration: none; border-radius: 4px;">
            Log In to Admin Panel
          </a>
        </p>
        <p>This link will expire in 15 minutes.</p>
        <p>If you didn't request this login, please ignore this email.</p>
      </div>
    `,
    text: `
      Admin Login Request
      
      Click the link below to log in to the Gift List admin panel:
      ${loginUrl}
      
      This link will expire in 15 minutes.
      
      If you didn't request this login, please ignore this email.
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('Failed to send email:', error);
    return false;
  }
}

export {
  sendOtpEmail,
};
