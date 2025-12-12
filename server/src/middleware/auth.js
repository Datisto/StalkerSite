import { verifyToken } from '../utils/jwt.js';
import { query } from '../config/database.js';

export async function authenticateUser(req, res, next) {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = verifyToken(token);

    if (!decoded) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    if (!decoded.steam_id) {
      return res.status(401).json({ error: 'Invalid token type' });
    }

    const [user] = await query(
      'SELECT * FROM users WHERE steam_id = ? LIMIT 1',
      [decoded.steam_id]
    );

    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    if (user.is_banned) {
      return res.status(403).json({ error: 'Account is banned', reason: user.ban_reason });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Authentication error in authenticateUser:', error.message, error.code);
    return res.status(500).json({ error: 'Authentication failed' });
  }
}

export async function authenticateAdmin(req, res, next) {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = verifyToken(token);

    if (!decoded || decoded.type !== 'admin') {
      return res.status(401).json({ error: 'Invalid admin token' });
    }

    const [admin] = await query(
      'SELECT * FROM admins WHERE id = ? AND is_active = TRUE LIMIT 1',
      [decoded.id]
    );

    if (!admin) {
      return res.status(401).json({ error: 'Admin not found or inactive' });
    }

    req.admin = admin;
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(500).json({ error: 'Authentication failed' });
  }
}

export function optionalAuth(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '');

  if (token) {
    const decoded = verifyToken(token);
    if (decoded && decoded.steam_id) {
      query('SELECT * FROM users WHERE steam_id = ? LIMIT 1', [decoded.steam_id])
        .then(([user]) => {
          if (user && !user.is_banned) {
            req.user = user;
          }
          next();
        })
        .catch(() => next());
    } else {
      next();
    }
  } else {
    next();
  }
}
