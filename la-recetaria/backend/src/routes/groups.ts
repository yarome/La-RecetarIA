import { Router } from 'express';
import { z } from 'zod';
import { db } from '../db.js';
import { requireAuth } from '../auth/requireAuth.js';
import type { Group } from '../types.js';

const router = Router();
router.use(requireAuth);

interface GroupRow {
  id: number;
  user_id: number;
  name: string;
  is_protected: number;
}

function loadGroup(userId: number, id: number): Group | null {
  const g = db
    .prepare('SELECT * FROM groups WHERE id = ? AND user_id = ?')
    .get(id, userId) as GroupRow | undefined;
  if (!g) return null;
  const recipeIds = (
    db
      .prepare(
        `SELECT gr.recipe_id AS id
         FROM group_recipes gr
         JOIN recipes r ON r.id = gr.recipe_id
         WHERE gr.group_id = ? AND r.user_id = ?
         ORDER BY gr.recipe_id DESC`,
      )
      .all(id, userId) as { id: number }[]
  ).map((r) => r.id);
  return {
    id: g.id,
    name: g.name,
    isProtected: g.is_protected === 1,
    recipeIds,
  };
}

router.get('/', (req, res) => {
  const rows = db
    .prepare(
      'SELECT id FROM groups WHERE user_id = ? ORDER BY is_protected DESC, name COLLATE NOCASE ASC',
    )
    .all(req.user!.id) as { id: number }[];
  const groups = rows.map((r) => loadGroup(req.user!.id, r.id)!);
  res.json({ groups });
});

router.get('/:id', (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    res.status(400).json({ error: 'Invalid id' });
    return;
  }
  const g = loadGroup(req.user!.id, id);
  if (!g) {
    res.status(404).json({ error: 'Not found' });
    return;
  }
  res.json({ group: g });
});

const groupBodySchema = z.object({ name: z.string().trim().min(1).max(60) });

router.post('/', (req, res) => {
  const parse = groupBodySchema.safeParse(req.body);
  if (!parse.success) {
    res.status(400).json({ error: 'Invalid body' });
    return;
  }
  const userId = req.user!.id;
  try {
    const result = db
      .prepare(
        'INSERT INTO groups (user_id, name, is_protected) VALUES (?, ?, 0)',
      )
      .run(userId, parse.data.name);
    const id = Number(result.lastInsertRowid);
    res.status(201).json({ group: loadGroup(userId, id) });
  } catch (err) {
    if ((err as { code?: string }).code === 'SQLITE_CONSTRAINT_UNIQUE') {
      res.status(409).json({ error: 'A group with that name already exists' });
      return;
    }
    throw err;
  }
});

router.put('/:id', (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    res.status(400).json({ error: 'Invalid id' });
    return;
  }
  const parse = groupBodySchema.safeParse(req.body);
  if (!parse.success) {
    res.status(400).json({ error: 'Invalid body' });
    return;
  }
  const userId = req.user!.id;
  const existing = db
    .prepare('SELECT is_protected FROM groups WHERE id = ? AND user_id = ?')
    .get(id, userId) as { is_protected: number } | undefined;
  if (!existing) {
    res.status(404).json({ error: 'Not found' });
    return;
  }
  if (existing.is_protected === 1) {
    res.status(400).json({ error: 'Cannot rename the Favorites group' });
    return;
  }
  try {
    db.prepare(
      'UPDATE groups SET name = ? WHERE id = ? AND user_id = ?',
    ).run(parse.data.name, id, userId);
  } catch (err) {
    if ((err as { code?: string }).code === 'SQLITE_CONSTRAINT_UNIQUE') {
      res.status(409).json({ error: 'A group with that name already exists' });
      return;
    }
    throw err;
  }
  res.json({ group: loadGroup(userId, id) });
});

router.delete('/:id', (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    res.status(400).json({ error: 'Invalid id' });
    return;
  }
  const userId = req.user!.id;
  const existing = db
    .prepare('SELECT is_protected FROM groups WHERE id = ? AND user_id = ?')
    .get(id, userId) as { is_protected: number } | undefined;
  if (!existing) {
    res.status(404).json({ error: 'Not found' });
    return;
  }
  if (existing.is_protected === 1) {
    res.status(400).json({ error: 'Cannot delete the Favorites group' });
    return;
  }
  db.prepare('DELETE FROM groups WHERE id = ? AND user_id = ?').run(id, userId);
  res.status(204).end();
});

router.post('/:id/recipes/:recipeId', (req, res) => {
  const id = Number(req.params.id);
  const recipeId = Number(req.params.recipeId);
  if (!Number.isInteger(id) || !Number.isInteger(recipeId)) {
    res.status(400).json({ error: 'Invalid id' });
    return;
  }
  const userId = req.user!.id;
  const owns = db
    .prepare(
      `SELECT 1 FROM groups g JOIN recipes r ON r.user_id = g.user_id
       WHERE g.id = ? AND r.id = ? AND g.user_id = ?`,
    )
    .get(id, recipeId, userId);
  if (!owns) {
    res.status(404).json({ error: 'Group or recipe not found' });
    return;
  }
  db.prepare(
    'INSERT OR IGNORE INTO group_recipes (group_id, recipe_id) VALUES (?, ?)',
  ).run(id, recipeId);
  // If we just added to Favorites, also flip the recipe flag for consistency.
  const isFav = db
    .prepare('SELECT is_protected FROM groups WHERE id = ?')
    .get(id) as { is_protected: number } | undefined;
  if (isFav?.is_protected === 1) {
    db.prepare(
      'UPDATE recipes SET is_favorite = 1 WHERE id = ? AND user_id = ?',
    ).run(recipeId, userId);
  }
  res.json({ group: loadGroup(userId, id) });
});

router.delete('/:id/recipes/:recipeId', (req, res) => {
  const id = Number(req.params.id);
  const recipeId = Number(req.params.recipeId);
  if (!Number.isInteger(id) || !Number.isInteger(recipeId)) {
    res.status(400).json({ error: 'Invalid id' });
    return;
  }
  const userId = req.user!.id;
  const owns = db
    .prepare('SELECT is_protected FROM groups WHERE id = ? AND user_id = ?')
    .get(id, userId) as { is_protected: number } | undefined;
  if (!owns) {
    res.status(404).json({ error: 'Group not found' });
    return;
  }
  db.prepare(
    'DELETE FROM group_recipes WHERE group_id = ? AND recipe_id = ?',
  ).run(id, recipeId);
  if (owns.is_protected === 1) {
    db.prepare(
      'UPDATE recipes SET is_favorite = 0 WHERE id = ? AND user_id = ?',
    ).run(recipeId, userId);
  }
  res.json({ group: loadGroup(userId, id) });
});

export default router;
