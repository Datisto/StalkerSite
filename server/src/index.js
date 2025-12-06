import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

import steamAuthRoutes from './routes/steam-auth.js';
import usersRoutes from './routes/users.js';
import charactersRoutes from './routes/characters.js';
import adminRoutes from './routes/admin.js';
import rulesRoutes from './routes/rules.js';
import questionsRoutes from './routes/questions.js';
import testSubmissionsRoutes from './routes/test-submissions.js';
import faqRoutes from './routes/faq.js';
import faceModelsRoutes from './routes/face-models.js';
import mediaVideosRoutes from './routes/media-videos.js';
import { pool } from './config/database.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));

app.use(express.json());

app.get('/api', async (req, res) => {
  let dbStatus = 'unknown';
  try {
    const connection = await pool.getConnection();
    dbStatus = 'connected';
    connection.release();
  } catch (error) {
    dbStatus = 'disconnected: ' + error.message;
  }

  res.json({
    status: 'ok',
    message: 'API is running',
    version: '1.0.0',
    database: dbStatus,
    timestamp: new Date().toISOString(),
    env: {
      nodeEnv: process.env.NODE_ENV || 'development',
      port: PORT,
      frontendUrl: process.env.FRONTEND_URL
    }
  });
});

app.use('/api/steam-auth', steamAuthRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/characters', charactersRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/rules', rulesRoutes);
app.use('/api/questions', questionsRoutes);
app.use('/api/test-submissions', testSubmissionsRoutes);
app.use('/api/faq', faqRoutes);
app.use('/api/face-models', faceModelsRoutes);
app.use('/api/media-videos', mediaVideosRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

const distPath = path.join(__dirname, '../../dist');
app.use(express.static(distPath, {
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.js')) {
      res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
    } else if (filePath.endsWith('.css')) {
      res.setHeader('Content-Type', 'text/css; charset=utf-8');
    } else if (filePath.endsWith('.json')) {
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
    } else if (filePath.endsWith('.png')) {
      res.setHeader('Content-Type', 'image/png');
    } else if (filePath.endsWith('.jpg') || filePath.endsWith('.jpeg')) {
      res.setHeader('Content-Type', 'image/jpeg');
    } else if (filePath.endsWith('.webp')) {
      res.setHeader('Content-Type', 'image/webp');
    }
  }
}));

app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api/') || req.path.startsWith('/assets/')) {
    return next();
  }
  res.sendFile(path.join(distPath, 'index.html'));
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

async function startServer() {
  try {
    const connection = await pool.getConnection();
    console.log('✓ Database connected successfully');
    connection.release();
  } catch (error) {
    console.error('⚠ Database connection warning:', error.message);
    console.error('⚠ Server will start but database operations may fail');
  }

  app.listen(PORT, () => {
    console.log(`✓ Server running on port ${PORT}`);
    console.log(`✓ Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:5173'}`);
    console.log(`✓ API available at: ${process.env.FRONTEND_URL || 'http://localhost:5173'}/api`);
  });
}

startServer();
