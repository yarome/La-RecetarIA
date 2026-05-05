import { Router } from 'express';
import { z } from 'zod';
import { db } from '../db.js';
import { requireAuth } from '../auth/requireAuth.js';
import type { MenuItem } from '../types.js';

const router = Router();
router.use(requireAuth);

interface MenuRow {
  id: number;
  recipe_id: number;
  people_count: number;
  sort_order: number;
}

function loadMenu(userId: number): MenuItem[] {
  const rows = db
    .prepare(
      `SELECT id, recipe_id, people_count, sort_order
       FROM menu_items
       WHERE user_id = ?
       ORDER BY sort_order ASC, id ASC`,
    )
    .all(userId) as MenuRow[];
  return rows.map((r) => ({
    id: r.id,
    recipeId: r.recipe_id,
    peopleCount: r.people_count,
    sortOrder: r.sort_order,
  }));
}

router.get('/', (req, res) => {
  res.json({ items: loadMenu(req.user!.id) });
});

const addSchema = z.object({
  recipeId: z.number().int().positive(),
  peopleCount: z.number().int().positive().default(2),
});

router.post('/', (req, res) => {
  const parse = addSchema.safeParse(req.body);
  if (!parse.success) {
    res.status(400).json({ error: 'Invalid body' });
    return;
  }
  const userId = req.user!.id;
  const owns = db
    .prepare('SELECT 1 FROM recipes WHERE id = ? AND user_id = ?')
    .get(parse.data.recipeId, userId);
  if (!owns) {
    res.status(404).json({ error: 'Recipe not found' });
    return;
  }
  const next =
    (db
      .prepare(
        'SELECT COALESCE(MAX(sort_order) + 1, 0) AS next FROM menu_items WHERE user_id = ?',
      )
      .get(userId) as { next: number }).next;
  const result = db
    .prepare(
      'INSERT INTO menu_items (user_id, recipe_id, people_count, sort_order) VALUES (?, ?, ?, ?)',
    )
    .run(userId, parse.data.recipeId, parse.data.peopleCount, next);
  res.status(201).json({
    item: {
      id: Number(result.lastInsertRowid),
      recipeId: parse.data.recipeId,
      peopleCount: parse.data.peopleCount,
      sortOrder: next,
    },
  });
});

const patchSchema = z
  .object({
    peopleCount: z.number().int().positive().optional(),
    sortOrder: z.number().int().nonnegative().optional(),
  })
  .refine((d) => d.peopleCount !== undefined || d.sortOrder !== undefined, {
    message: 'At least one field required',
  });

router.patch('/:itemId', (req, res) => {
  const id = Number(req.params.itemId);
  if (!Number.isInteger(id)) {
    res.status(400).json({ error: 'Invalid id' });
    return;
  }
  const parse = patchSchema.safeParse(req.body);
  if (!parse.success) {
    res.status(400).json({ error: 'Invalid body' });
    return;
  }
  const userId = req.user!.id;
  const owns = db
    .prepare('SELECT 1 FROM menu_items WHERE id = ? AND user_id = ?')
    .get(id, userId);
  if (!owns) {
    res.status(404).json({ error: 'Not found' });
    return;
  }
  const updates: string[] = [];
  const params: (string | number)[] = [];
  if (parse.data.peopleCount !== undefined) {
    updates.push('people_count = ?');
    params.push(parse.data.peopleCount);
  }
  if (parse.data.sortOrder !== undefined) {
    updates.push('sort_order = ?');
    params.push(parse.data.sortOrder);
  }
  params.push(id, userId);
  db.prepare(
    `UPDATE menu_items SET ${updates.join(', ')} WHERE id = ? AND user_id = ?`,
  ).run(...params);
  res.json({ items: loadMenu(userId) });
});

router.delete('/:itemId', (req, res) => {
  const id = Number(req.params.itemId);
  if (!Number.isInteger(id)) {
    res.status(400).json({ error: 'Invalid id' });
    return;
  }
  const result = db
    .prepare('DELETE FROM menu_items WHERE id = ? AND user_id = ?')
    .run(id, req.user!.id);
  if (result.changes === 0) {
    res.status(404).json({ error: 'Not found' });
    return;
  }
  res.status(204).end();
});

router.delete('/', (req, res) => {
  db.prepare('DELETE FROM menu_items WHERE user_id = ?').run(req.user!.id);
  res.status(204).end();
});

export default router;
