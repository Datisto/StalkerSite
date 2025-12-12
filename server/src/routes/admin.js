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
    let sql = 'SELECT c.id, c.user_id, c.steam_id, c.status, c.name, c.surname, c.patronymic, c.nickname, c.age, c.gender, c.face_model, c.origin_country, c.citizenship, c.faction, c.biography, c.appearance, c.psychological_portrait, c.character_traits, c.skills, c.inventory, c.rejection_reason, c.admin_notes, c.created_at, c.updated_at, c.submitted_at, c.approved_at, u.steam_nickname FROM characters c JOIN users u ON c.user_id = u.id';
    const params = [];

    if (status) {
      sql += ' WHERE c.status = ?';
      params.push(status);
    }

    sql += ' ORDER BY c.created_at DESC LIMIT 1000';

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

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/users', authenticateAdmin, async (req, res) => {
  try {
    const users = await query('SELECT id, steam_id, steam_nickname, discord_username, discord_id, is_banned, ban_reason, rules_passed, created_at, last_login FROM users ORDER BY created_at DESC LIMIT 1000');
    res.json(users);
  } catch (error) {
    console.error('Error loading users:', error);
    res.status(500).json({ error: error.message });
  }
});

router.patch('/users/:id', authenticateAdmin, async (req, res) => {
  try {
    const { is_banned, ban_reason, discord_username, rules_passed } = req.body;
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

    if (discord_username !== undefined) {
      updates.push('discord_username = ?');
      values.push(discord_username);
    }

    if (rules_passed !== undefined) {
      updates.push('rules_passed = ?');
      values.push(rules_passed);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    values.push(req.params.id);

    await query(
      `UPDATE users SET ${updates.join(', ')} WHERE id = ?`,
      values
    );

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/test-submissions', authenticateAdmin, async (req, res) => {
  try {
    const submissions = await query(`
      SELECT rts.id, rts.user_id, rts.steam_id, rts.discord_id, rts.answers, rts.score, rts.created_at, rts.reviewed_at, rts.approved, rts.feedback, rts.question_grades, u.steam_nickname
      FROM rules_test_submissions rts
      LEFT JOIN users u ON rts.user_id = u.id
      ORDER BY rts.created_at DESC
      LIMIT 500
    `);
    const parsedSubmissions = submissions.map((sub) => {
      let parsedAnswers = { questions: [], answers: [] };
      try {
        if (sub.answers) {
          parsedAnswers = JSON.parse(sub.answers);
        }
      } catch (e) {
        console.error('Error parsing answers for submission', sub.id, e);
      }

      let parsedQuestionGrades = [];
      try {
        if (sub.question_grades) {
          parsedQuestionGrades = JSON.parse(sub.question_grades);
        }
      } catch (e) {
        console.error('Error parsing question_grades for submission', sub.id, e);
      }

      return {
        id: sub.id,
        user_id: sub.user_id,
        steam_id: sub.steam_id,
        discord_id: sub.discord_id,
        steam_nickname: sub.steam_nickname,
        questions: parsedAnswers.questions || [],
        answers: parsedAnswers.answers || [],
        question_grades: parsedQuestionGrades,
        score: sub.score,
        created_at: sub.created_at,
        reviewed_at: sub.reviewed_at,
        approved: sub.approved,
        feedback: sub.feedback
      };
    });
    res.json(parsedSubmissions);
  } catch (error) {
    console.error('Error loading test submissions:', error);
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

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


export default router;
