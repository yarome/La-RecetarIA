import express from 'express';
import cors from 'cors';

import './db.js';

import authRouter from './routes/auth.js';
import recipesRouter from './routes/recipes.js';
import groupsRouter from './routes/groups.js';
import menuRouter from './routes/menu.js';
import plansRouter from './routes/plans.js';
import nutritionGoalsRouter from './routes/nutritionGoals.js';
import shoppingListRouter from './routes/shoppingList.js';

const app = express();
const PORT = Number(process.env.PORT) || 4000;

const corsOriginEnv = process.env.CORS_ORIGIN ?? 'http://localhost:5173';
const corsOrigins = corsOriginEnv
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

app.use(cors({ origin: corsOrigins, credentials: false }));
app.use(express.json({ limit: '2mb' }));

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, service: 'la-recetaria-api', time: new Date().toISOString() });
});

app.use('/api/auth', authRouter);
app.use('/api/recipes', recipesRouter);
app.use('/api/groups', groupsRouter);
app.use('/api/menu', menuRouter);
app.use('/api/plans', plansRouter);
app.use('/api/nutrition-goals', nutritionGoalsRouter);
app.use('/api/shopping-list', shoppingListRouter);

app.use((_req, res) => {
  res.status(404).json({ error: 'Not found' });
});

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`[backend] La RecetarIA API listening on http://localhost:${PORT}`);
  // eslint-disable-next-line no-console
  console.log(`[backend] CORS origins: ${corsOrigins.join(', ')}`);
});
