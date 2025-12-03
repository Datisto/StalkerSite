import express from 'express';
import { query } from '../config/database.js';
import { authenticateUser, optionalAuth } from '../middleware/auth.js';

const router = express.Router();

router.get('/me', authenticateUser, async (req, res) => {
  try {
    res.json(req.user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:steam_id', optionalAuth, async (req, res) => {
  try {
    const [user] = await query(
      'SELECT id, steam_id, steam_nickname, discord_username, is_banned, rules_passed, created_at FROM users WHERE steam_id = ? LIMIT 1',
      [req.params.steam_id]
    );

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.patch('/me', authenticateUser, async (req, res) => {
  try {
    const { discord_username, rules_passed } = req.body;
    const updates = [];
    const values = [];

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

    values.push(req.user.steam_id);

    await query(
      `UPDATE users SET ${updates.join(', ')} WHERE steam_id = ?`,
      values
    );

    const [updatedUser] = await query(
      'SELECT * FROM users WHERE steam_id = ? LIMIT 1',
      [req.user.steam_id]
    );

    res.json(updatedUser);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
