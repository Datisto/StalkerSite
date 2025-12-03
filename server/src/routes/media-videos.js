import express from 'express';
import { query } from '../config/database.js';
import { authenticateAdmin } from '../middleware/auth.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const videos = await query(
      'SELECT * FROM media_videos WHERE is_published = TRUE ORDER BY order_index ASC'
    );
    res.json(videos);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/all', authenticateAdmin, async (req, res) => {
  try {
    const videos = await query(
      'SELECT * FROM media_videos ORDER BY order_index ASC'
    );
    res.json(videos);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', authenticateAdmin, async (req, res) => {
  try {
    const { title, url, thumbnail_url, order_index, is_published } = req.body;

    await query(
      'INSERT INTO media_videos (id, title, url, thumbnail_url, order_index, is_published) VALUES (UUID(), ?, ?, ?, ?, ?)',
      [title, url, thumbnail_url, order_index || 0, is_published !== false]
    );

    const [video] = await query(
      'SELECT * FROM media_videos WHERE id = LAST_INSERT_ID() LIMIT 1'
    );

    res.status(201).json(video);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.patch('/:id', authenticateAdmin, async (req, res) => {
  try {
    const { title, url, thumbnail_url, order_index, is_published } = req.body;
    const updates = [];
    const values = [];

    if (title !== undefined) {
      updates.push('title = ?');
      values.push(title);
    }

    if (url !== undefined) {
      updates.push('url = ?');
      values.push(url);
    }

    if (thumbnail_url !== undefined) {
      updates.push('thumbnail_url = ?');
      values.push(thumbnail_url);
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
      `UPDATE media_videos SET ${updates.join(', ')} WHERE id = ?`,
      values
    );

    const [video] = await query(
      'SELECT * FROM media_videos WHERE id = ? LIMIT 1',
      [req.params.id]
    );

    res.json(video);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/:id', authenticateAdmin, async (req, res) => {
  try {
    await query('DELETE FROM media_videos WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
