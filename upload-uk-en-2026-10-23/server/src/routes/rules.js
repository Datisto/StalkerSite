import express from 'express';
import { query } from '../config/database.js';
import { authenticateAdmin, optionalAuth } from '../middleware/auth.js';
import { translationFields } from '../utils/content-translations.js';

const router = express.Router();

let rulesCache = { rules: [], categories: [], lastUpdate: 0 };
const CACHE_TTL = 5 * 60 * 1000;

function buildRuleTree(rules) {
  const ruleMap = new Map();
  const rootRules = [];

  rules.forEach(rule => {
    ruleMap.set(rule.id, { ...rule, subitems: [] });
  });

  rules.forEach(rule => {
    if (rule.parent_id) {
      const parent = ruleMap.get(rule.parent_id);
      if (parent) {
        parent.subitems.push(ruleMap.get(rule.id));
      }
    } else {
      rootRules.push(ruleMap.get(rule.id));
    }
  });

  return rootRules;
}

async function refreshRulesCache() {
  const now = Date.now();
  if (now - rulesCache.lastUpdate > CACHE_TTL) {
    rulesCache.categories = await query('SELECT * FROM rules_categories ORDER BY order_index ASC');
    const allRules = await query('SELECT * FROM rules WHERE is_published = TRUE ORDER BY category_id, order_index ASC');
    rulesCache.rules = buildRuleTree(allRules);
    rulesCache.lastUpdate = now;
  }
}

router.get('/categories', async (req, res) => {
  try {
    await refreshRulesCache();
    const categories = rulesCache.categories.map((cat) => ({
      ...cat,
      title: cat.name,
      title_en: cat.name_en ?? null,
      slug: cat.name.toLowerCase().replace(/\s+/g, '-'),
    }));
    res.json(categories);
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message });
  }
});

router.get('/', async (req, res) => {
  try {
    await refreshRulesCache();
    res.json(rulesCache.rules);
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message });
  }
});

router.post('/categories', authenticateAdmin, async (req, res) => {
  try {
    const { name, title, order_index } = req.body;
    const categoryName = title || name;
    const translated = translationFields(req.body, { title_en: 255 });

    await query(
      'INSERT INTO rules_categories (id, name, name_en, order_index) VALUES (UUID(), ?, ?, ?)',
      [categoryName, translated.title_en ?? null, order_index || 0]
    );

    rulesCache.lastUpdate = 0;
    res.status(201).json({ success: true });
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message });
  }
});

router.patch('/categories/:id', authenticateAdmin, async (req, res) => {
  try {
    const { name, title, order_index } = req.body;
    const translated = translationFields(req.body, { title_en: 255 });
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

    if (translated.title_en !== undefined) {
      updates.push('name_en = ?');
      values.push(translated.title_en);
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
    res.status(error.status || 500).json({ error: error.message });
  }
});

router.delete('/categories/:id', authenticateAdmin, async (req, res) => {
  try {
    await query('DELETE FROM rules_categories WHERE id = ?', [req.params.id]);
    rulesCache.lastUpdate = 0;
    res.json({ success: true });
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message });
  }
});

router.post('/', authenticateAdmin, async (req, res) => {
  try {
    const { category_id, parent_id, number, title, content, order_index, is_published } = req.body;
    const translated = translationFields(req.body, { title_en: 255, content_en: null });

    await query(
      'INSERT INTO rules (id, category_id, parent_id, number, title, title_en, content, content_en, order_index, is_published) VALUES (UUID(), ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [category_id, parent_id || null, number || null, title, translated.title_en ?? null, content, translated.content_en ?? null, order_index || 0, is_published !== false]
    );

    rulesCache.lastUpdate = 0;
    res.status(201).json({ success: true });
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message });
  }
});

router.patch('/:id', authenticateAdmin, async (req, res) => {
  try {
    const { parent_id, number, title, content, order_index, is_published } = req.body;
    const translated = translationFields(req.body, { title_en: 255, content_en: null });
    const updates = [];
    const values = [];

    if (parent_id !== undefined) {
      updates.push('parent_id = ?');
      values.push(parent_id || null);
    }

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

    for (const [field, value] of Object.entries(translated)) {
      updates.push(`${field} = ?`);
      values.push(value);
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
    res.status(error.status || 500).json({ error: error.message });
  }
});

router.delete('/:id', authenticateAdmin, async (req, res) => {
  try {
    await query('DELETE FROM rules WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message });
  }
});

export default router;
