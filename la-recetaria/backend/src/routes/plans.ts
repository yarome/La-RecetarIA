import { Router } from 'express';
import { z } from 'zod';
import { db } from '../db.js';
import { requireAuth } from '../auth/requireAuth.js';
import type { WeeklyPlan } from '../types.js';

const router = Router();
router.use(requireAuth);

const slotSchema = z.object({
  recipeId: z.number().int().positive(),
  people: z.number().int().positive(),
});

const dayPlanSchema = z
  .object({
    breakfast: z.array(slotSchema).optional(),
    lunch: z.array(slotSchema).optional(),
    dinner: z.array(slotSchema).optional(),
    snack: z.array(slotSchema).optional(),
  })
  .strict();

const planSchema = z
  .object({
    mon: dayPlanSchema.optional(),
    tue: dayPlanSchema.optional(),
    wed: dayPlanSchema.optional(),
    thu: dayPlanSchema.optional(),
    fri: dayPlanSchema.optional(),
    sat: dayPlanSchema.optional(),
    sun: dayPlanSchema.optional(),
  })
  .strict();

router.get('/current', (req, res) => {
  const row = db
    .prepare('SELECT plan_json FROM current_plans WHERE user_id = ?')
    .get(req.user!.id) as { plan_json: string } | undefined;
  let plan: WeeklyPlan = {};
  if (row) {
    try {
      plan = JSON.parse(row.plan_json) as WeeklyPlan;
    } catch {
      plan = {};
    }
  }
  res.json({ plan });
});

router.put('/current', (req, res) => {
  const parse = planSchema.safeParse(req.body?.plan ?? req.body);
  if (!parse.success) {
    res.status(400).json({ error: parse.error.format() });
    return;
  }
  const planJson = JSON.stringify(parse.data);
  const userId = req.user!.id;
  const exists = db
    .prepare('SELECT 1 FROM current_plans WHERE user_id = ?')
    .get(userId);
  if (exists) {
    db.prepare(
      'UPDATE current_plans SET plan_json = ? WHERE user_id = ?',
    ).run(planJson, userId);
  } else {
    db.prepare(
      'INSERT INTO current_plans (user_id, plan_json) VALUES (?, ?)',
    ).run(userId, planJson);
  }
  res.json({ plan: parse.data });
});

router.get('/', (req, res) => {
  const rows = db
    .prepare(
      'SELECT id, name, plan_json, created_at FROM saved_plans WHERE user_id = ? ORDER BY created_at DESC, id DESC',
    )
    .all(req.user!.id) as {
    id: number;
    name: string;
    plan_json: string;
    created_at: string;
  }[];
  const plans = rows.map((r) => {
    let plan: WeeklyPlan = {};
    try {
      plan = JSON.parse(r.plan_json) as WeeklyPlan;
    } catch {
      plan = {};
    }
    return { id: r.id, name: r.name, plan, createdAt: r.created_at };
  });
  res.json({ plans });
});

const savePlanSchema = z.object({
  name: z.string().trim().min(1).max(60),
  plan: planSchema,
});

router.post('/', (req, res) => {
  const parse = savePlanSchema.safeParse(req.body);
  if (!parse.success) {
    res.status(400).json({ error: parse.error.format() });
    return;
  }
  const result = db
    .prepare(
      'INSERT INTO saved_plans (user_id, name, plan_json) VALUES (?, ?, ?)',
    )
    .run(req.user!.id, parse.data.name, JSON.stringify(parse.data.plan));
  res.status(201).json({
    plan: {
      id: Number(result.lastInsertRowid),
      name: parse.data.name,
      plan: parse.data.plan,
      createdAt: new Date().toISOString(),
    },
  });
});

router.delete('/:id', (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    res.status(400).json({ error: 'Invalid id' });
    return;
  }
  const result = db
    .prepare('DELETE FROM saved_plans WHERE id = ? AND user_id = ?')
    .run(id, req.user!.id);
  if (result.changes === 0) {
    res.status(404).json({ error: 'Not found' });
    return;
  }
  res.status(204).end();
});

export default router;
