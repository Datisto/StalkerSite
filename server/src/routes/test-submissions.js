import express from 'express';
import { query } from '../config/database.js';
import { optionalAuth } from '../middleware/auth.js';

const router = express.Router();

router.post('/', optionalAuth, async (req, res) => {
  try {
    const { steam_id, answers, score } = req.body;

    await query(
      'INSERT INTO rules_test_submissions (id, user_id, steam_id, answers, score) VALUES (UUID(), ?, ?, ?, ?)',
      [req.user?.id || null, steam_id, JSON.stringify(answers), score]
    );

    res.status(201).json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/', optionalAuth, async (req, res) => {
  try {
    const { steam_id } = req.query;

    if (!steam_id && !req.user) {
      return res.status(400).json({ error: 'steam_id required' });
    }

    const submissions = await query(
      'SELECT * FROM rules_test_submissions WHERE steam_id = ? ORDER BY created_at DESC LIMIT 100',
      [steam_id || req.user.steam_id]
    );

    res.json(submissions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/:id', optionalAuth, async (req, res) => {
  try {
    const [submission] = await query(
      'SELECT * FROM rules_test_submissions WHERE id = ? LIMIT 1',
      [req.params.id]
    );

    if (!submission) {
      return res.status(404).json({ error: 'Submission not found' });
    }

    await query('DELETE FROM rules_test_submissions WHERE id = ?', [req.params.id]);

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
