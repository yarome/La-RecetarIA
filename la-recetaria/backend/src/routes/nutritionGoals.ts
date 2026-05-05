import { Router } from 'express';
import { z } from 'zod';
import { db } from '../db.js';
import { requireAuth } from '../auth/requireAuth.js';
import { DEFAULT_NUTRITION_GOALS } from '../services/userBootstrap.js';
import type { NutritionGoals } from '../types.js';

const router = Router();
router.use(requireAuth);

const goalsSchema = z.object({
  kcal: z.number().nonnegative(),
  protein: z.number().nonnegative(),
  carbs: z.number().nonnegative(),
  sugars: z.number().nonnegative(),
  fat: z.number().nonnegative(),
  fiber: z.number().nonnegative(),
});

router.get('/', (req, res) => {
  const row = db
    .prepare('SELECT goals_json FROM nutrition_goals WHERE user_id = ?')
    .get(req.user!.id) as { goals_json: string } | undefined;
  let goals: NutritionGoals = DEFAULT_NUTRITION_GOALS;
  if (row) {
    try {
      const parsed = JSON.parse(row.goals_json) as Partial<NutritionGoals>;
      goals = { ...DEFAULT_NUTRITION_GOALS, ...parsed };
    } catch {
      goals = DEFAULT_NUTRITION_GOALS;
    }
  }
  res.json({ goals });
});

router.put('/', (req, res) => {
  const parse = goalsSchema.safeParse(req.body);
  if (!parse.success) {
    res.status(400).json({ error: parse.error.format() });
    return;
  }
  const userId = req.user!.id;
  const json = JSON.stringify(parse.data);
  const exists = db
    .prepare('SELECT 1 FROM nutrition_goals WHERE user_id = ?')
    .get(userId);
  if (exists) {
    db.prepare(
      'UPDATE nutrition_goals SET goals_json = ? WHERE user_id = ?',
    ).run(json, userId);
  } else {
    db.prepare(
      'INSERT INTO nutrition_goals (user_id, goals_json) VALUES (?, ?)',
    ).run(userId, json);
  }
  res.json({ goals: parse.data });
});

export default router;
