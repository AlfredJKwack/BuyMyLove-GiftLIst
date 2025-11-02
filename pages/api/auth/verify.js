import db from '../../../lib/db.js';
import { otpTokens } from '../../../database/schema.js';
import { eq, and, gt } from 'drizzle-orm';
import { generateToken } from '../../../lib/auth.js';
import { serialize } from 'cookie';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { token } = req.query;

    if (!token) {
      return res.status(400).json({ error: 'Token is required' });
    }

    // Find token in database
    const [otpRecord] = await db
      .select()
      .from(otpTokens)
      .where(
        and(
          eq(otpTokens.token, token),
          eq(otpTokens.used, false),
          gt(otpTokens.expiresAt, new Date())
        )
      )
      .limit(1);

    if (!otpRecord) {
      // Redirect to home with error
      return res.redirect('/?error=invalid_token');
    }

    // Mark token as used
    await db
      .update(otpTokens)
      .set({ used: true })
      .where(eq(otpTokens.token, token));

    // Generate JWT
    const jwtToken = generateToken({
      email: otpRecord.email,
      type: 'admin',
    });

    // Set cookie and redirect to home
    const isProd = process.env.NODE_ENV === 'production';
    const cookieName = isProd ? '__Host-admin_token' : 'admin_token';
    const cookie = serialize(cookieName, jwtToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: 'strict',
      path: '/',
      maxAge: 60 * 60 * 24 * 7
    });
    res.setHeader('Set-Cookie', cookie);

    return res.redirect('/?login=success');
  } catch (error) {
    console.error('Error in verify:', error);
    return res.redirect('/?error=server_error');
  }
}
