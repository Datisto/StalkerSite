import express from 'express';
import { query } from '../config/database.js';
import { authenticateAdmin, optionalAuth } from '../middleware/auth.js';

const router = express.Router();

let rulesCache = { rules: [], categories: [], lastUpdate: 0 };
const CACHE_TTL = 5 * 60 * 1000;

async function refreshRulesCache() {
  const now = Date.now();
  if (now - rulesCache.lastUpdate > CACHE_TTL) {
    rulesCache.categories = await query('SELECT * FROM rules_categories ORDER BY order_index ASC');
    rulesCache.rules = await query('SELECT * FROM rules WHERE is_published = TRUE ORDER BY category_id, order_index ASC');
    rulesCache.lastUpdate = now;
  }
}

router.get('/categories', async (req, res) => {
  try {
    await refreshRulesCache();
    res.json(rulesCache.categories);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/', async (req, res) => {
  try {
    await refreshRulesCache();
    res.json(rulesCache.rules);
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

    rulesCache.lastUpdate = 0;
    res.status(201).json({ success: true });
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

    rulesCache.lastUpdate = 0;
    res.status(201).json({ success: true });
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

    rulesCache.lastUpdate = 0;
    res.json({ success: true });
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
