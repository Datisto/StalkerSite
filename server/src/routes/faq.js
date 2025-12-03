import express from 'express';
import { query } from '../config/database.js';
import { authenticateAdmin } from '../middleware/auth.js';

const router = express.Router();

router.get('/categories', async (req, res) => {
  try {
    const categories = await query(
      'SELECT * FROM faq_categories ORDER BY order_index ASC'
    );
    res.json(categories);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/', async (req, res) => {
  try {
    const items = await query(
      'SELECT * FROM faq_items WHERE is_published = TRUE ORDER BY category_id, order_index ASC'
    );
    res.json(items);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/categories', authenticateAdmin, async (req, res) => {
  try {
    const { name, order_index } = req.body;

    await query(
      'INSERT INTO faq_categories (id, name, order_index) VALUES (UUID(), ?, ?)',
      [name, order_index || 0]
    );

    const [category] = await query(
      'SELECT * FROM faq_categories WHERE id = LAST_INSERT_ID() LIMIT 1'
    );

    res.status(201).json(category);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', authenticateAdmin, async (req, res) => {
  try {
    const { category_id, question, answer, order_index, is_published } = req.body;

    await query(
      'INSERT INTO faq_items (id, category_id, question, answer, order_index, is_published) VALUES (UUID(), ?, ?, ?, ?, ?)',
      [category_id, question, answer, order_index || 0, is_published !== false]
    );

    const [item] = await query(
      'SELECT * FROM faq_items WHERE id = LAST_INSERT_ID() LIMIT 1'
    );

    res.status(201).json(item);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.patch('/:id', authenticateAdmin, async (req, res) => {
  try {
    const { question, answer, order_index, is_published } = req.body;
    const updates = [];
    const values = [];

    if (question !== undefined) {
      updates.push('question = ?');
      values.push(question);
    }

    if (answer !== undefined) {
      updates.push('answer = ?');
      values.push(answer);
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
      `UPDATE faq_items SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      values
    );

    const [item] = await query(
      'SELECT * FROM faq_items WHERE id = ? LIMIT 1',
      [req.params.id]
    );

    res.json(item);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/:id', authenticateAdmin, async (req, res) => {
  try {
    await query('DELETE FROM faq_items WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
