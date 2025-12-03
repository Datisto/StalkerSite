import { verifyToken } from '../utils/jwt.js';
import { query } from '../config/database.js';

export async function authenticateUser(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  const decoded = verifyToken(token);

  if (!decoded) {
    return res.status(401).json({ error: 'Invalid token' });
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
}

export async function authenticateAdmin(req, res, next) {
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
}

export function optionalAuth(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '');

  if (token) {
    const decoded = verifyToken(token);
    if (decoded) {
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
