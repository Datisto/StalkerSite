import express from 'express';
import { query } from '../config/database.js';
import { authenticateUser, optionalAuth } from '../middleware/auth.js';

const router = express.Router();

router.get('/', optionalAuth, async (req, res) => {
  try {
    const { steam_id, status } = req.query;
    let sql = 'SELECT id, user_id, steam_id, status, name, surname, nickname, age, gender, face_model, faction, created_at, updated_at FROM characters WHERE 1=1';
    const params = [];

    if (steam_id) {
      sql += ' AND steam_id = ?';
      params.push(steam_id);
    }

    if (status) {
      sql += ' AND status = ?';
      params.push(status);
    }

    if (req.user && !status) {
      sql += ' AND steam_id = ?';
      params.push(req.user.steam_id);
    }

    sql += ' ORDER BY created_at DESC LIMIT 500';

    const characters = await query(sql, params);
    res.json(characters);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const [character] = await query(
      'SELECT * FROM characters WHERE id = ? LIMIT 1',
      [req.params.id]
    );

    if (!character) {
      return res.status(404).json({ error: 'Character not found' });
    }

    if (character.steam_id !== req.user?.steam_id && character.status === 'draft') {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json(character);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', authenticateUser, async (req, res) => {
  try {
    if (req.user.is_banned) {
      return res.status(403).json({ error: 'Cannot create character while banned' });
    }

    const {
      name, surname, patronymic, nickname, age, gender, face_model,
      origin_country, citizenship, faction, biography,
      appearance, psychological_portrait, character_traits,
      skills, inventory
    } = req.body;

    if (nickname) {
      const [existing] = await query(
        'SELECT id FROM characters WHERE nickname = ? AND status != ? LIMIT 1',
        [nickname, 'dead']
      );
      if (existing) {
        return res.status(400).json({ error: 'Nickname already taken' });
      }
    }

    await query(
      `INSERT INTO characters (
        id, user_id, steam_id, status, name, surname, patronymic, nickname, age, gender,
        face_model, origin_country, citizenship, faction, biography,
        appearance, psychological_portrait, character_traits, skills, inventory
      ) VALUES (UUID(), ?, ?, 'draft', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        req.user.id || null,
        req.user.steam_id,
        name || null,
        surname || null,
        patronymic || null,
        nickname || null,
        age || null,
        gender || null,
        face_model || null,
        origin_country || null,
        citizenship || null,
        faction || null,
        biography || null,
        appearance || null,
        psychological_portrait || null,
        JSON.stringify(character_traits || []),
        JSON.stringify(skills || []),
        JSON.stringify(inventory || [])
      ]
    );

    res.status(201).json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.patch('/:id', authenticateUser, async (req, res) => {
  try {
    const [character] = await query(
      'SELECT * FROM characters WHERE id = ? LIMIT 1',
      [req.params.id]
    );

    if (!character) {
      return res.status(404).json({ error: 'Character not found' });
    }

    if (character.steam_id !== req.user.steam_id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    if (!['draft', 'rejected'].includes(character.status)) {
      return res.status(400).json({ error: 'Cannot edit character in current status' });
    }

    const allowedFields = [
      'name', 'surname', 'patronymic', 'nickname', 'age', 'gender', 'face_model',
      'origin_country', 'citizenship', 'faction', 'biography',
      'appearance', 'psychological_portrait', 'character_traits',
      'skills', 'inventory', 'status', 'submitted_at'
    ];

    const updates = [];
    const values = [];

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        if (['character_traits', 'skills', 'inventory'].includes(field)) {
          updates.push(`${field} = ?`);
          values.push(JSON.stringify(req.body[field]));
        } else {
          updates.push(`${field} = ?`);
          values.push(req.body[field]);
        }
      }
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    values.push(req.params.id);

    await query(
      `UPDATE characters SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      values
    );

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/:id', authenticateUser, async (req, res) => {
  try {
    const [character] = await query(
      'SELECT * FROM characters WHERE id = ? LIMIT 1',
      [req.params.id]
    );

    if (!character) {
      return res.status(404).json({ error: 'Character not found' });
    }

    if (character.steam_id !== req.user.steam_id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    await query('DELETE FROM characters WHERE id = ?', [req.params.id]);

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
