import express from 'express';
import { query } from '../config/database.js';
import { authenticateAdmin, optionalAuth } from '../middleware/auth.js';

const router = express.Router();

let rulesCache = { rules: [], categories: [], lastUpdate: 0 };
const CACHE_TTL = 5 * 60 * 1000;
let migrationDone = false;

async function ensureNumberColumn() {
  if (migrationDone) return;
  try {
    await query(`ALTER TABLE rules ADD COLUMN IF NOT EXISTS number VARCHAR(50) DEFAULT NULL AFTER id`);
    migrationDone = true;
  } catch (error) {
    console.error('Migration error (might already exist):', error.message);
  }
}

async function refreshRulesCache() {
  await ensureNumberColumn();
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
    const categories = rulesCache.categories.map((cat) => ({
      ...cat,
      title: cat.name,
      slug: cat.name.toLowerCase().replace(/\s+/g, '-'),
    }));
    res.json(categories);
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
    const { name, title, order_index } = req.body;
    const categoryName = title || name;

    await query(
      'INSERT INTO rules_categories (id, name, order_index) VALUES (UUID(), ?, ?)',
      [categoryName, order_index || 0]
    );

    rulesCache.lastUpdate = 0;
    res.status(201).json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.patch('/categories/:id', authenticateAdmin, async (req, res) => {
  try {
    const { name, title, order_index } = req.body;
    const updates = [];
    const values = [];

    if (title !== undefined || name !== undefined) {
      updates.push('name = ?');
      values.push(title || name);
    }

    if (order_index !== undefined) {
      updates.push('order_index = ?');
      values.push(order_index);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    values.push(req.params.id);

    await query(
      `UPDATE rules_categories SET ${updates.join(', ')} WHERE id = ?`,
      values
    );

    rulesCache.lastUpdate = 0;
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/categories/:id', authenticateAdmin, async (req, res) => {
  try {
    await query('DELETE FROM rules_categories WHERE id = ?', [req.params.id]);
    rulesCache.lastUpdate = 0;
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', authenticateAdmin, async (req, res) => {
  try {
    await ensureNumberColumn();
    const { category_id, number, title, content, order_index, is_published } = req.body;

    await query(
      'INSERT INTO rules (id, category_id, number, title, content, order_index, is_published) VALUES (UUID(), ?, ?, ?, ?, ?, ?)',
      [category_id, number || null, title, content, order_index || 0, is_published !== false]
    );

    rulesCache.lastUpdate = 0;
    res.status(201).json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.patch('/:id', authenticateAdmin, async (req, res) => {
  try {
    await ensureNumberColumn();
    const { number, title, content, order_index, is_published } = req.body;
    const updates = [];
    const values = [];

    if (number !== undefined) {
      updates.push('number = ?');
      values.push(number || null);
    }

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
