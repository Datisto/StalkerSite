import express from 'express';
import { query } from '../config/database.js';
import { authenticateAdmin } from '../middleware/auth.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const { gender } = req.query;
    let sql = 'SELECT * FROM face_models WHERE is_active = TRUE';
    const params = [];

    if (gender) {
      sql += ' AND gender = ?';
      params.push(gender);
    }

    sql += ' ORDER BY is_unique DESC, name ASC';

    const models = await query(sql, params);
    res.json(models);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', authenticateAdmin, async (req, res) => {
  try {
    const { name, gender, image_url, is_unique, is_active } = req.body;

    await query(
      'INSERT INTO face_models (id, name, gender, image_url, is_unique, is_active) VALUES (UUID(), ?, ?, ?, ?, ?)',
      [name, gender, image_url, is_unique || false, is_active !== false]
    );

    const [model] = await query(
      'SELECT * FROM face_models WHERE id = LAST_INSERT_ID() LIMIT 1'
    );

    res.status(201).json(model);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.patch('/:id', authenticateAdmin, async (req, res) => {
  try {
    const { name, gender, image_url, is_unique, is_active } = req.body;
    const updates = [];
    const values = [];

    if (name !== undefined) {
      updates.push('name = ?');
      values.push(name);
    }

    if (gender !== undefined) {
      updates.push('gender = ?');
      values.push(gender);
    }

    if (image_url !== undefined) {
      updates.push('image_url = ?');
      values.push(image_url);
    }

    if (is_unique !== undefined) {
      updates.push('is_unique = ?');
      values.push(is_unique);
    }

    if (is_active !== undefined) {
      updates.push('is_active = ?');
      values.push(is_active);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    values.push(req.params.id);

    await query(
      `UPDATE face_models SET ${updates.join(', ')} WHERE id = ?`,
      values
    );

    const [model] = await query(
      'SELECT * FROM face_models WHERE id = ? LIMIT 1',
      [req.params.id]
    );

    res.json(model);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/:id', authenticateAdmin, async (req, res) => {
  try {
    await query('DELETE FROM face_models WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
