import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { parse } from 'cookie';

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET is not set in environment variables');
}

// Generate JWT token
function generateToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

// Verify JWT token
function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

// Extract token from cookie header (supports both __Host- and legacy names)
function extractTokenFromCookie(cookieHeader) {
  if (!cookieHeader) return null;
  
  const cookies = parse(cookieHeader);
  return cookies['__Host-admin_token'] || cookies['admin_token'] || null;
}

// Middleware to verify admin authentication
function requireAdmin(handler) {
  return async (req, res) => {
    const token = extractTokenFromCookie(req.headers.cookie);
    
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const decoded = verifyToken(token);
    
    if (!decoded) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }
    
    // Attach admin info to request
    req.admin = decoded;
    
    return handler(req, res);
  };
}

export {
  generateToken,
  verifyToken,
  extractTokenFromCookie,
  requireAdmin,
};
