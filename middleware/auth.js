// Authentication middleware for protecting staff routes
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

/**
 * Verify JWT token from cookie
 */
function verifyToken(token) {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return decoded;
  } catch (error) {
    return null;
  }
}

/**
 * Check if user has required access level
 */
function hasAccessLevel(userRoles, requiredLevel) {
  const accessLevels = {
    'user': 0,
    'moderator': 1,
    'admin': 2,
    'owner': 3
  };
  
  const userLevel = accessLevels[getUserAccessLevel(userRoles)] || 0;
  const required = accessLevels[requiredLevel] || 0;
  
  return userLevel >= required;
}

/**
 * Get user access level from roles
 */
function getUserAccessLevel(roles) {
  if (roles.includes(process.env.OWNER_ROLE_ID)) return 'owner';
  if (roles.includes(process.env.ADMIN_ROLE_ID)) return 'admin';
  if (roles.includes(process.env.MODERATOR_ROLE_ID)) return 'moderator';
  return 'user';
}

/**
 * Authentication middleware
 */
export function authenticate(requiredLevel = 'moderator') {
  return async (req, res, next) => {
    try {
      // Get token from cookie
      const token = req.cookies?.staff_session;
      
      if (!token) {
        return res.status(401).json({ 
          error: 'Authentication required',
          redirect: '/auth/login'
        });
      }

      // Verify token
      const decoded = verifyToken(token);
      
      if (!decoded) {
        return res.status(401).json({ 
          error: 'Invalid token',
          redirect: '/auth/login'
        });
      }

      // Check access level
      if (!hasAccessLevel(decoded.roles, requiredLevel)) {
        return res.status(403).json({ 
          error: 'Insufficient permissions',
          message: `Access level '${requiredLevel}' required`
        });
      }

      // Add user info to request
      req.user = decoded;
      next();

    } catch (error) {
      console.error('Auth middleware error:', error);
      res.status(500).json({ error: 'Authentication failed' });
    }
  };
}

/**
 * API route protection wrapper
 */
export function protectAPI(handler, requiredLevel = 'moderator') {
  return async (req, res) => {
    try {
      const token = req.cookies?.staff_session;
      
      if (!token) {
        return res.status(401).json({ 
          error: 'Authentication required',
          redirect: '/auth/login'
        });
      }

      const decoded = verifyToken(token);
      
      if (!decoded) {
        return res.status(401).json({ 
          error: 'Invalid token',
          redirect: '/auth/login'
        });
      }

      if (!hasAccessLevel(decoded.roles, requiredLevel)) {
        return res.status(403).json({ 
          error: 'Insufficient permissions'
        });
      }

      req.user = decoded;
      return handler(req, res);

    } catch (error) {
      console.error('API protection error:', error);
      res.status(500).json({ error: 'Authentication failed' });
    }
  };
}