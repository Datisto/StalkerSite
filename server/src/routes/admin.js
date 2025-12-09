import express from 'express';
import bcrypt from 'bcryptjs';
import { query } from '../config/database.js';
import { generateAdminToken } from '../utils/jwt.js';
import { authenticateAdmin } from '../middleware/auth.js';

const router = express.Router();

router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    const [admin] = await query(
      'SELECT * FROM admins WHERE username = ? AND is_active = TRUE LIMIT 1',
      [username]
    );

    if (!admin) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isValid = await bcrypt.compare(password, admin.password_hash);

    if (!isValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    await query(
      'UPDATE admins SET last_login = CURRENT_TIMESTAMP WHERE id = ?',
      [admin.id]
    );

    const token = generateAdminToken(admin);

    res.json({
      token,
      admin: {
        id: admin.id,
        username: admin.username,
        role: admin.role,
        permissions: admin.permissions
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/characters', authenticateAdmin, async (req, res) => {
  try {
    const { status } = req.query;
    let sql = 'SELECT c.*, u.steam_nickname FROM characters c JOIN users u ON c.user_id = u.id';
    const params = [];

    if (status) {
      sql += ' WHERE c.status = ?';
      params.push(status);
    }

    sql += ' ORDER BY c.created_at DESC';

    const characters = await query(sql, params);
    res.json(characters);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.patch('/characters/:id', authenticateAdmin, async (req, res) => {
  try {
    const { status, rejection_reason, admin_notes, approved_at } = req.body;
    const updates = [];
    const values = [];

    if (status) {
      updates.push('status = ?');
      values.push(status);
    }

    if (rejection_reason !== undefined) {
      updates.push('rejection_reason = ?');
      values.push(rejection_reason);
    }

    if (admin_notes !== undefined) {
      updates.push('admin_notes = ?');
      values.push(admin_notes);
    }

    if (approved_at !== undefined) {
      updates.push('approved_at = ?');
      values.push(approved_at);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    values.push(req.params.id);

    await query(
      `UPDATE characters SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      values
    );

    const [character] = await query(
      'SELECT * FROM characters WHERE id = ? LIMIT 1',
      [req.params.id]
    );

    res.json(character);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/users', authenticateAdmin, async (req, res) => {
  try {
    const users = await query('SELECT * FROM users ORDER BY created_at DESC');
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.patch('/users/:id', authenticateAdmin, async (req, res) => {
  try {
    const { is_banned, ban_reason } = req.body;
    const updates = [];
    const values = [];

    if (is_banned !== undefined) {
      updates.push('is_banned = ?');
      values.push(is_banned);
    }

    if (ban_reason !== undefined) {
      updates.push('ban_reason = ?');
      values.push(ban_reason);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    values.push(req.params.id);

    await query(
      `UPDATE users SET ${updates.join(', ')} WHERE id = ?`,
      values
    );

    const [user] = await query(
      'SELECT * FROM users WHERE id = ? LIMIT 1',
      [req.params.id]
    );

    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/test-submissions', authenticateAdmin, async (req, res) => {
  try {
    const submissions = await query(`
      SELECT rts.*, u.steam_nickname
      FROM rules_test_submissions rts
      LEFT JOIN users u ON rts.user_id = u.id
      ORDER BY rts.created_at DESC
    `);
    res.json(submissions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.patch('/test-submissions/:id', authenticateAdmin, async (req, res) => {
  try {
    const { approved, feedback, question_grades, score } = req.body;
    const updates = [];
    const values = [];

    if (approved !== undefined) {
      updates.push('approved = ?');
      values.push(approved);
    }

    if (feedback !== undefined) {
      updates.push('feedback = ?');
      values.push(feedback);
    }

    if (question_grades !== undefined) {
      updates.push('question_grades = ?');
      values.push(JSON.stringify(question_grades));
    }

    if (score !== undefined) {
      updates.push('score = ?');
      values.push(score);
    }

    updates.push('reviewed_at = CURRENT_TIMESTAMP');

    values.push(req.params.id);

    await query(
      `UPDATE rules_test_submissions SET ${updates.join(', ')} WHERE id = ?`,
      values
    );

    const [submission] = await query(
      'SELECT * FROM rules_test_submissions WHERE id = ? LIMIT 1',
      [req.params.id]
    );

    res.json(submission);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/logs', authenticateAdmin, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 50,
      method,
      status_code,
      endpoint,
      user_id,
      admin_id,
      from_date,
      to_date
    } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);
    const conditions = [];
    const params = [];

    if (method) {
      conditions.push('method = ?');
      params.push(method);
    }

    if (status_code) {
      conditions.push('status_code = ?');
      params.push(parseInt(status_code));
    }

    if (endpoint) {
      conditions.push('endpoint LIKE ?');
      params.push(`%${endpoint}%`);
    }

    if (user_id) {
      conditions.push('user_id = ?');
      params.push(user_id);
    }

    if (admin_id) {
      conditions.push('admin_id = ?');
      params.push(admin_id);
    }

    if (from_date) {
      conditions.push('created_at >= ?');
      params.push(from_date);
    }

    if (to_date) {
      conditions.push('created_at <= ?');
      params.push(to_date);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const [countResult] = await query(
      `SELECT COUNT(*) as total FROM request_logs ${whereClause}`,
      params
    );

    const logs = await query(
      `SELECT
        rl.*,
        u.steam_nickname as user_nickname,
        a.username as admin_username
      FROM request_logs rl
      LEFT JOIN users u ON rl.user_id = u.id
      LEFT JOIN admins a ON rl.admin_id = a.id
      ${whereClause}
      ORDER BY rl.created_at DESC
      LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), offset]
    );

    res.json({
      logs,
      pagination: {
        total: countResult.total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(countResult.total / parseInt(limit))
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/logs/stats', authenticateAdmin, async (req, res) => {
  try {
    const { from_date, to_date } = req.query;
    const conditions = [];
    const params = [];

    if (from_date) {
      conditions.push('created_at >= ?');
      params.push(from_date);
    }

    if (to_date) {
      conditions.push('created_at <= ?');
      params.push(to_date);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const [totalRequests] = await query(
      `SELECT COUNT(*) as count FROM request_logs ${whereClause}`,
      params
    );

    const methodStats = await query(
      `SELECT method, COUNT(*) as count FROM request_logs ${whereClause} GROUP BY method`,
      params
    );

    const statusStats = await query(
      `SELECT
        CASE
          WHEN status_code < 300 THEN '2xx'
          WHEN status_code < 400 THEN '3xx'
          WHEN status_code < 500 THEN '4xx'
          ELSE '5xx'
        END as status_group,
        COUNT(*) as count
      FROM request_logs ${whereClause}
      GROUP BY status_group`,
      params
    );

    const [avgResponseTime] = await query(
      `SELECT AVG(response_time) as avg_time FROM request_logs ${whereClause}`,
      params
    );

    const topEndpoints = await query(
      `SELECT endpoint, COUNT(*) as count
      FROM request_logs ${whereClause}
      GROUP BY endpoint
      ORDER BY count DESC
      LIMIT 10`,
      params
    );

    const slowestEndpoints = await query(
      `SELECT endpoint, AVG(response_time) as avg_time, COUNT(*) as count
      FROM request_logs ${whereClause}
      GROUP BY endpoint
      HAVING count > 5
      ORDER BY avg_time DESC
      LIMIT 10`,
      params
    );

    res.json({
      total_requests: totalRequests.count,
      methods: methodStats,
      status_codes: statusStats,
      avg_response_time: Math.round(avgResponseTime.avg_time || 0),
      top_endpoints: topEndpoints,
      slowest_endpoints: slowestEndpoints
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
