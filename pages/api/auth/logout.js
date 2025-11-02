import { serialize } from 'cookie';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Clear admin token cookie (both legacy and __Host- names)
    const isProd = process.env.NODE_ENV === 'production';
    const primary = serialize(isProd ? '__Host-admin_token' : 'admin_token', '', {
      httpOnly: true,
      secure: isProd,
      sameSite: 'strict',
      path: '/',
      maxAge: 0
    });
    const legacy = serialize(isProd ? 'admin_token' : '__Host-admin_token', '', {
      httpOnly: true,
      secure: isProd,
      sameSite: 'strict',
      path: '/',
      maxAge: 0
    });
    res.setHeader('Set-Cookie', [primary, legacy]);

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error in logout:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
