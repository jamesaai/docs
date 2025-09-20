// Protected staff API endpoint example
import { protectAPI } from '../../middleware/auth.js';

async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // This endpoint is protected and only accessible to authenticated staff
    const user = req.user;
    
    res.status(200).json({
      success: true,
      user: {
        id: user.userId,
        username: user.username,
        accessLevel: user.accessLevel,
        roles: user.roles
      },
      server: {
        status: 'online',
        players: 1247,
        uptime: '99.9%'
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Staff status error:', error);
    res.status(500).json({ error: 'Failed to fetch status' });
  }
}

// Protect this endpoint with moderator level access
export default protectAPI(handler, 'moderator');