import express from 'express';
import { query } from '../config/database.js';
import { authenticateAdmin, optionalAuth } from '../middleware/auth.js';

const router = express.Router();

router.get('/categories', async (req, res) => {
  try {
    const categories = await query(
      'SELECT * FROM rules_categories ORDER BY order_index ASC'
    );
    res.json(categories);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/', async (req, res) => {
  try {
    const rules = await query(
      'SELECT * FROM rules WHERE is_published = TRUE ORDER BY category_id, order_index ASC'
    );
    res.json(rules);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/categories', authenticateAdmin, async (req, res) => {
  try {
    const { name, order_index } = req.body;

    await query(
      'INSERT INTO rules_categories (id, name, order_index) VALUES (UUID(), ?, ?)',
      [name, order_index || 0]
    );

    const [category] = await query(
      'SELECT * FROM rules_categories WHERE id = LAST_INSERT_ID() LIMIT 1'
    );

    res.status(201).json(category);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', authenticateAdmin, async (req, res) => {
  try {
    const { category_id, title, content, order_index, is_published } = req.body;

    await query(
      'INSERT INTO rules (id, category_id, title, content, order_index, is_published) VALUES (UUID(), ?, ?, ?, ?, ?)',
      [category_id, title, content, order_index || 0, is_published !== false]
    );

    const [rule] = await query(
      'SELECT * FROM rules WHERE id = LAST_INSERT_ID() LIMIT 1'
    );

    res.status(201).json(rule);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.patch('/:id', authenticateAdmin, async (req, res) => {
  try {
    const { title, content, order_index, is_published } = req.body;
    const updates = [];
    const values = [];

    if (title !== undefined) {
      updates.push('title = ?');
      values.push(title);
    }

    if (content !== undefined) {
      updates.push('content = ?');
      values.push(content);
    }

    if (order_index !== undefined) {
      updates.push('order_index = ?');
      values.push(order_index);
    }

    if (is_published !== undefined) {
      updates.push('is_published = ?');
      values.push(is_published);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    values.push(req.params.id);

    await query(
      `UPDATE rules SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      values
    );

    const [rule] = await query(
      'SELECT * FROM rules WHERE id = ? LIMIT 1',
      [req.params.id]
    );

    res.json(rule);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/:id', authenticateAdmin, async (req, res) => {
  try {
    await query('DELETE FROM rules WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
