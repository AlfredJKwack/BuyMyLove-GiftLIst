import { extractTokenFromCookie, verifyToken } from '../../../lib/auth.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const token = extractTokenFromCookie(req.headers.cookie);

    if (!token) {
      return res.status(200).json({ isAdmin: false });
    }

    const decoded = verifyToken(token);

    if (!decoded) {
      return res.status(200).json({ isAdmin: false });
    }

    return res.status(200).json({
      isAdmin: true,
      email: decoded.email,
    });
  } catch (error) {
    console.error('Error in auth/me:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
