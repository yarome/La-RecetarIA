import { Router } from 'express';
import { z } from 'zod';
import { db } from '../db.js';
import { requireAuth } from '../auth/requireAuth.js';
import { buildShoppingList } from '../services/shoppingList.js';
import type { Weekday, WeeklyPlan } from '../types.js';

const router = Router();
router.use(requireAuth);

const weekdaySchema = z.enum(['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']);

const bodySchema = z.object({
  days: z.array(weekdaySchema).min(1),
});

router.post('/', (req, res) => {
  const parse = bodySchema.safeParse(req.body);
  if (!parse.success) {
    res.status(400).json({ error: 'Invalid body' });
    return;
  }
  const userId = req.user!.id;
  const row = db
    .prepare('SELECT plan_json FROM current_plans WHERE user_id = ?')
    .get(userId) as { plan_json: string } | undefined;
  let plan: WeeklyPlan = {};
  if (row) {
    try {
      plan = JSON.parse(row.plan_json) as WeeklyPlan;
    } catch {
      plan = {};
    }
  }
  const items = buildShoppingList(userId, parse.data.days as Weekday[], plan);
  res.json({ items });
});

export default router;
