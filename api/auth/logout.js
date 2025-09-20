// Logout handler
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Clear session cookies
    res.setHeader('Set-Cookie', [
      'staff_session=; HttpOnly; Secure; SameSite=Strict; Max-Age=0',
      'staff_user=; Secure; SameSite=Strict; Max-Age=0'
    ]);

    res.status(200).json({ 
      success: true, 
      message: 'Successfully logged out' 
    });

  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Logout failed' });
  }
}