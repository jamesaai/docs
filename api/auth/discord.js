// Discord OAuth Authentication Handler
// This file handles Discord OAuth 2.0 authentication for staff members

const CLIENT_ID = process.env.DISCORD_CLIENT_ID;
const CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET;
const REDIRECT_URI = process.env.DISCORD_REDIRECT_URI || 'https://yourdomain.com/api/auth/discord/callback';
const DISCORD_API_BASE = 'https://discord.com/api/v10';

// Authorized staff roles (Discord role IDs)
const AUTHORIZED_ROLES = [
  'moderator_role_id',     // Replace with actual role ID
  'admin_role_id',         // Replace with actual role ID
  'owner_role_id'          // Replace with actual role ID
];

// Discord server ID
const DISCORD_GUILD_ID = process.env.DISCORD_GUILD_ID;

/**
 * Initiate Discord OAuth flow
 */
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Generate state parameter for security
    const state = generateRandomString(32);
    
    // Store state in session/cookie for verification
    res.setHeader('Set-Cookie', `oauth_state=${state}; HttpOnly; Secure; SameSite=Strict; Max-Age=600`);
    
    // Discord OAuth URL
    const discordAuthUrl = new URL('https://discord.com/oauth2/authorize');
    discordAuthUrl.searchParams.set('client_id', CLIENT_ID);
    discordAuthUrl.searchParams.set('redirect_uri', REDIRECT_URI);
    discordAuthUrl.searchParams.set('response_type', 'code');
    discordAuthUrl.searchParams.set('scope', 'identify guilds guilds.members.read');
    discordAuthUrl.searchParams.set('state', state);
    
    // Redirect to Discord
    res.redirect(302, discordAuthUrl.toString());
    
  } catch (error) {
    console.error('Discord auth error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
}

/**
 * Generate random string for state parameter
 */
function generateRandomString(length) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Discord OAuth Callback Handler
 */
export async function callbackHandler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { code, state } = req.query;
  const storedState = req.cookies?.oauth_state;

  try {
    // Verify state parameter
    if (!state || !storedState || state !== storedState) {
      return res.status(400).json({ error: 'Invalid state parameter' });
    }

    // Clear state cookie
    res.setHeader('Set-Cookie', 'oauth_state=; HttpOnly; Secure; SameSite=Strict; Max-Age=0');

    // Exchange code for access token
    const tokenResponse = await fetch('https://discord.com/api/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: REDIRECT_URI,
      }),
    });

    if (!tokenResponse.ok) {
      throw new Error('Failed to exchange code for token');
    }

    const tokenData = await tokenResponse.json();

    // Get user information
    const userResponse = await fetch(`${DISCORD_API_BASE}/users/@me`, {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
      },
    });

    if (!userResponse.ok) {
      throw new Error('Failed to fetch user information');
    }

    const user = await userResponse.json();

    // Check if user is in our Discord server and has authorized role
    const memberResponse = await fetch(`${DISCORD_API_BASE}/guilds/${DISCORD_GUILD_ID}/members/${user.id}`, {
      headers: {
        Authorization: `Bot ${process.env.DISCORD_BOT_TOKEN}`,
      },
    });

    if (!memberResponse.ok) {
      return res.status(403).json({ 
        error: 'Access denied', 
        message: 'You must be a member of our Discord server to access staff resources.' 
      });
    }

    const member = await memberResponse.json();

    // Check if user has authorized role
    const hasAuthorizedRole = member.roles.some(roleId => AUTHORIZED_ROLES.includes(roleId));

    if (!hasAuthorizedRole) {
      return res.status(403).json({ 
        error: 'Insufficient permissions', 
        message: 'You must have a staff role to access these resources.' 
      });
    }

    // Create JWT session token
    const sessionToken = createSessionToken({
      userId: user.id,
      username: user.username,
      discriminator: user.discriminator,
      avatar: user.avatar,
      roles: member.roles,
      accessLevel: getUserAccessLevel(member.roles)
    });

    // Set secure session cookie
    res.setHeader('Set-Cookie', [
      `staff_session=${sessionToken}; HttpOnly; Secure; SameSite=Strict; Max-Age=86400`, // 24 hours
      `staff_user=${encodeURIComponent(JSON.stringify({
        id: user.id,
        username: user.username,
        avatar: user.avatar
      }))}; Secure; SameSite=Strict; Max-Age=86400`
    ]);

    // Redirect to staff dashboard
    res.redirect(302, '/staff/dashboard');

  } catch (error) {
    console.error('Discord callback error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
}

/**
 * Create JWT session token
 */
function createSessionToken(payload) {
  // In production, use a proper JWT library like 'jsonwebtoken'
  // This is a simplified version for demonstration
  const header = { alg: 'HS256', typ: 'JWT' };
  const secret = process.env.JWT_SECRET || 'your-secret-key';
  
  // Encode header and payload
  const encodedHeader = Buffer.from(JSON.stringify(header)).toString('base64url');
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64url');
  
  // Create signature (simplified - use proper HMAC in production)
  const signature = Buffer.from(secret).toString('base64url');
  
  return `${encodedHeader}.${encodedPayload}.${signature}`;
}

/**
 * Determine user access level based on roles
 */
function getUserAccessLevel(roles) {
  if (roles.includes('owner_role_id')) return 'owner';
  if (roles.includes('admin_role_id')) return 'admin';
  if (roles.includes('moderator_role_id')) return 'moderator';
  return 'user';
}