export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Clear admin token cookie
    res.setHeader(
      'Set-Cookie',
      'admin_token=; Path=/; HttpOnly; Max-Age=0; SameSite=Strict'
    );

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error in logout:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
