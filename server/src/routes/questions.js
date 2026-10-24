import express from 'express';
import { query } from '../config/database.js';
import { authenticateAdmin, optionalAuth } from '../middleware/auth.js';
import { translationFields } from '../utils/content-translations.js';

const router = express.Router();

router.get('/manage', authenticateAdmin, async (req, res) => {
  try {
    const questions = await query(
      'SELECT * FROM rules_questions ORDER BY category, difficulty LIMIT 1000'
    );
    res.json(questions);
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message });
  }
});

router.get('/', optionalAuth, async (req, res) => {
  try {
    const questions = await query(
      'SELECT * FROM rules_questions WHERE is_active = TRUE ORDER BY category, difficulty LIMIT 1000'
    );
    res.json(questions);
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message });
  }
});

router.post('/', authenticateAdmin, async (req, res) => {
  try {
    const { question_text, correct_answer, incorrect_answers, category, difficulty, is_active } = req.body;
    const translated = translationFields(req.body, { question_text_en: null, category_en: 255 });

    await query(
      'INSERT INTO rules_questions (id, question_text, question_text_en, correct_answer, incorrect_answers, category, category_en, difficulty, is_active) VALUES (UUID(), ?, ?, ?, ?, ?, ?, ?, ?)',
      [
        question_text,
        translated.question_text_en ?? null,
        correct_answer || null,
        incorrect_answers ? JSON.stringify(incorrect_answers) : null,
        category || null,
        translated.category_en ?? null,
        difficulty || 'medium',
        is_active !== false
      ]
    );

    res.status(201).json({ success: true });
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message });
  }
});

router.patch('/:id', authenticateAdmin, async (req, res) => {
  try {
    const { question_text, correct_answer, incorrect_answers, category, difficulty, is_active } = req.body;
    const translated = translationFields(req.body, { question_text_en: null, category_en: 255 });
    const updates = [];
    const values = [];

    if (question_text !== undefined) {
      updates.push('question_text = ?');
      values.push(question_text);
    }

    for (const [field, value] of Object.entries(translated)) {
      updates.push(`${field} = ?`);
      values.push(value);
    }

    if (correct_answer !== undefined) {
      updates.push('correct_answer = ?');
      values.push(correct_answer);
    }

    if (incorrect_answers !== undefined) {
      updates.push('incorrect_answers = ?');
      values.push(JSON.stringify(incorrect_answers));
    }

    if (category !== undefined) {
      updates.push('category = ?');
      values.push(category);
    }

    if (difficulty !== undefined) {
      updates.push('difficulty = ?');
      values.push(difficulty);
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
      `UPDATE rules_questions SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      values
    );

    res.json({ success: true });
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message });
  }
});

router.delete('/:id', authenticateAdmin, async (req, res) => {
  try {
    await query('DELETE FROM rules_questions WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message });
  }
});

export default router;
