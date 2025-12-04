import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

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
import { requestLogger } from './middleware/logger.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));

app.use(express.json());

app.use(requestLogger);

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

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:5173'}`);
});
