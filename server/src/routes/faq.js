import express from 'express';
import { query } from '../config/database.js';
import { authenticateAdmin } from '../middleware/auth.js';

const router = express.Router();

let faqCache = { items: [], categories: [], lastUpdate: 0 };
const CACHE_TTL = 5 * 60 * 1000;

async function refreshFaqCache() {
  const now = Date.now();
  if (now - faqCache.lastUpdate > CACHE_TTL) {
    faqCache.categories = await query('SELECT * FROM faq_categories ORDER BY order_index ASC');
    faqCache.items = await query('SELECT * FROM faq_items WHERE is_published = TRUE ORDER BY category_id, order_index ASC');
    faqCache.lastUpdate = now;
  }
}

router.get('/categories', async (req, res) => {
  try {
    await refreshFaqCache();
    res.json(faqCache.categories);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/', async (req, res) => {
  try {
    await refreshFaqCache();
    res.json(faqCache.items);
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

    faqCache.lastUpdate = 0;
    res.status(201).json({ success: true });
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

    faqCache.lastUpdate = 0;
    res.status(201).json({ success: true });
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

    faqCache.lastUpdate = 0;
    res.json({ success: true });
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
