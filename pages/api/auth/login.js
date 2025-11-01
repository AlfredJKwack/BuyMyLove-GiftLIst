import db from '../../../lib/db.js';
import { otpTokens } from '../../../database/schema.js';
import { sendOtpEmail } from '../../../lib/email.js';
import { v4 as uuidv4 } from 'uuid';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email } = req.body;

    if (!email || !email.includes('@')) {
      return res.status(400).json({ error: 'Valid email is required' });
    }

    // Get list of allowed admin emails from environment
    const adminEmailsStr = process.env.ADMIN_EMAILS || '';
    const adminEmails = adminEmailsStr
      .split(',')
      .map(e => e.trim().toLowerCase())
      .filter(e => e.length > 0);

    // Check if the email is in the allowed list
    const isAllowedAdmin = adminEmails.includes(email.toLowerCase());

    // Generic success message (same for both cases for security)
    const genericMessage = 'If this is a registered admin email, you will receive a login link shortly.';

    if (!isAllowedAdmin) {
      // Don't reveal that the email is not authorized
      return res.status(200).json({
        success: true,
        message: genericMessage,
      });
    }

    // Email is authorized - proceed with OTP generation
    const token = uuidv4();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes from now

    // Save token to database
    await db.insert(otpTokens).values({
      email,
      token,
      expiresAt,
      used: false,
    });

    // Send email
    const emailSent = await sendOtpEmail(email, token);

    if (!emailSent) {
      // Only reveal SMTP/email sending errors
      return res.status(500).json({ error: 'Failed to send email. Please check SMTP configuration.' });
    }

    return res.status(200).json({
      success: true,
      message: genericMessage,
    });
  } catch (error) {
    console.error('Error in login:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
