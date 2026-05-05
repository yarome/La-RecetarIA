import { Router } from 'express';
import { z } from 'zod';
import { db } from '../db.js';
import { requireAuth } from '../auth/requireAuth.js';
import type { Recipe, Nutrition } from '../types.js';

const router = Router();
router.use(requireAuth);

const ingredientSchema = z.object({
  name: z.string().trim().min(1),
  quantity: z.number().nonnegative(),
  unit: z.string().trim().min(1),
});

const nutritionSchema = z.object({
  protein: z.number().nonnegative(),
  carbs: z.number().nonnegative(),
  sugars: z.number().nonnegative(),
  fat: z.number().nonnegative(),
  fiber: z.number().nonnegative(),
});

const optionalUrl = z
  .string()
  .trim()
  .url()
  .nullish()
  .or(z.literal('').transform(() => null));

const recipeSchema = z.object({
  name: z.string().trim().min(1),
  imageUrl: optionalUrl,
  prepTimeMin: z.number().int().nonnegative().default(0),
  baseServings: z.number().int().positive().default(2),
  tags: z.array(z.string().trim().min(1)).default([]),
  ingredients: z.array(ingredientSchema).default([]),
  kcal: z.number().nonnegative().default(0),
  nutrition: nutritionSchema.default({
    protein: 0,
    carbs: 0,
    sugars: 0,
    fat: 0,
    fiber: 0,
  }),
  steps: z.array(z.string().trim().min(1)).default([]),
  videoUrl: optionalUrl,
  isFavorite: z.boolean().default(false),
});

interface RecipeRow {
  id: number;
  user_id: number;
  name: string;
  image_url: string | null;
  prep_time_min: number;
  base_servings: number;
  kcal: number;
  nutrition_json: string;
  video_url: string | null;
  is_favorite: number;
  created_at: string;
}

function loadRecipe(userId: number, id: number): Recipe | null {
  const r = db
    .prepare('SELECT * FROM recipes WHERE id = ? AND user_id = ?')
    .get(id, userId) as RecipeRow | undefined;
  if (!r) return null;
  const ingredients = db
    .prepare(
      'SELECT name, quantity, unit FROM ingredients WHERE recipe_id = ? ORDER BY sort_order ASC, id ASC',
    )
    .all(id) as { name: string; quantity: number; unit: string }[];
  const tags = (
    db
      .prepare('SELECT tag FROM recipe_tags WHERE recipe_id = ? ORDER BY tag ASC')
      .all(id) as { tag: string }[]
  ).map((t) => t.tag);
  const steps = (
    db
      .prepare(
        'SELECT text FROM recipe_steps WHERE recipe_id = ? ORDER BY sort_order ASC, id ASC',
      )
      .all(id) as { text: string }[]
  ).map((s) => s.text);
  let nutrition: Nutrition;
  try {
    const parsed = JSON.parse(r.nutrition_json);
    nutrition = {
      protein: Number(parsed.protein) || 0,
      carbs: Number(parsed.carbs) || 0,
      sugars: Number(parsed.sugars) || 0,
      fat: Number(parsed.fat) || 0,
      fiber: Number(parsed.fiber) || 0,
    };
  } catch {
    nutrition = { protein: 0, carbs: 0, sugars: 0, fat: 0, fiber: 0 };
  }
  return {
    id: r.id,
    name: r.name,
    imageUrl: r.image_url,
    prepTimeMin: r.prep_time_min,
    baseServings: r.base_servings,
    kcal: r.kcal,
    nutrition,
    videoUrl: r.video_url,
    isFavorite: r.is_favorite === 1,
    tags,
    ingredients,
    steps,
    createdAt: r.created_at,
  };
}

function syncFavoriteGroup(userId: number, recipeId: number, isFavorite: boolean): void {
  const fav = db
    .prepare('SELECT id FROM groups WHERE user_id = ? AND is_protected = 1')
    .get(userId) as { id: number } | undefined;
  if (!fav) return;
  if (isFavorite) {
    db.prepare(
      'INSERT OR IGNORE INTO group_recipes (group_id, recipe_id) VALUES (?, ?)',
    ).run(fav.id, recipeId);
  } else {
    db.prepare(
      'DELETE FROM group_recipes WHERE group_id = ? AND recipe_id = ?',
    ).run(fav.id, recipeId);
  }
}

router.get('/', (req, res) => {
  const ids = (
    db
      .prepare(
        'SELECT id FROM recipes WHERE user_id = ? ORDER BY created_at DESC, id DESC',
      )
      .all(req.user!.id) as { id: number }[]
  ).map((r) => r.id);
  const recipes = ids.map((id) => loadRecipe(req.user!.id, id)!);
  res.json({ recipes });
});

router.get('/:id', (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    res.status(400).json({ error: 'Invalid id' });
    return;
  }
  const r = loadRecipe(req.user!.id, id);
  if (!r) {
    res.status(404).json({ error: 'Not found' });
    return;
  }
  res.json({ recipe: r });
});

router.post('/', (req, res) => {
  const parse = recipeSchema.safeParse(req.body);
  if (!parse.success) {
    res.status(400).json({ error: parse.error.format() });
    return;
  }
  const data = parse.data;
  const userId = req.user!.id;

  const newId = db.transaction(() => {
    const result = db
      .prepare(
        `INSERT INTO recipes (user_id, name, image_url, prep_time_min, base_servings, kcal, nutrition_json, video_url, is_favorite)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
        userId,
        data.name,
        data.imageUrl ?? null,
        data.prepTimeMin,
        data.baseServings,
        data.kcal,
        JSON.stringify(data.nutrition),
        data.videoUrl ?? null,
        data.isFavorite ? 1 : 0,
      );
    const id = Number(result.lastInsertRowid);

    const insIng = db.prepare(
      'INSERT INTO ingredients (recipe_id, name, quantity, unit, sort_order) VALUES (?, ?, ?, ?, ?)',
    );
    data.ingredients.forEach((ing, i) =>
      insIng.run(id, ing.name, ing.quantity, ing.unit, i),
    );

    const insTag = db.prepare(
      'INSERT OR IGNORE INTO recipe_tags (recipe_id, tag) VALUES (?, ?)',
    );
    data.tags.forEach((t) => insTag.run(id, t));

    const insStep = db.prepare(
      'INSERT INTO recipe_steps (recipe_id, sort_order, text) VALUES (?, ?, ?)',
    );
    data.steps.forEach((s, i) => insStep.run(id, i, s));

    if (data.isFavorite) syncFavoriteGroup(userId, id, true);

    return id;
  })();

  res.status(201).json({ recipe: loadRecipe(userId, newId) });
});

router.put('/:id', (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    res.status(400).json({ error: 'Invalid id' });
    return;
  }
  const parse = recipeSchema.safeParse(req.body);
  if (!parse.success) {
    res.status(400).json({ error: parse.error.format() });
    return;
  }
  const data = parse.data;
  const userId = req.user!.id;

  const owns = db
    .prepare('SELECT 1 FROM recipes WHERE id = ? AND user_id = ?')
    .get(id, userId);
  if (!owns) {
    res.status(404).json({ error: 'Not found' });
    return;
  }

  db.transaction(() => {
    db.prepare(
      `UPDATE recipes
       SET name = ?, image_url = ?, prep_time_min = ?, base_servings = ?, kcal = ?, nutrition_json = ?, video_url = ?, is_favorite = ?
       WHERE id = ? AND user_id = ?`,
    ).run(
      data.name,
      data.imageUrl ?? null,
      data.prepTimeMin,
      data.baseServings,
      data.kcal,
      JSON.stringify(data.nutrition),
      data.videoUrl ?? null,
      data.isFavorite ? 1 : 0,
      id,
      userId,
    );
    db.prepare('DELETE FROM ingredients WHERE recipe_id = ?').run(id);
    db.prepare('DELETE FROM recipe_tags WHERE recipe_id = ?').run(id);
    db.prepare('DELETE FROM recipe_steps WHERE recipe_id = ?').run(id);

    const insIng = db.prepare(
      'INSERT INTO ingredients (recipe_id, name, quantity, unit, sort_order) VALUES (?, ?, ?, ?, ?)',
    );
    data.ingredients.forEach((ing, i) =>
      insIng.run(id, ing.name, ing.quantity, ing.unit, i),
    );
    const insTag = db.prepare(
      'INSERT OR IGNORE INTO recipe_tags (recipe_id, tag) VALUES (?, ?)',
    );
    data.tags.forEach((t) => insTag.run(id, t));
    const insStep = db.prepare(
      'INSERT INTO recipe_steps (recipe_id, sort_order, text) VALUES (?, ?, ?)',
    );
    data.steps.forEach((s, i) => insStep.run(id, i, s));

    syncFavoriteGroup(userId, id, data.isFavorite);
  })();

  res.json({ recipe: loadRecipe(userId, id) });
});

router.delete('/:id', (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    res.status(400).json({ error: 'Invalid id' });
    return;
  }
  const result = db
    .prepare('DELETE FROM recipes WHERE id = ? AND user_id = ?')
    .run(id, req.user!.id);
  if (result.changes === 0) {
    res.status(404).json({ error: 'Not found' });
    return;
  }
  res.status(204).end();
});

const favoriteSchema = z.object({ isFavorite: z.boolean() });

router.put('/:id/favorite', (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    res.status(400).json({ error: 'Invalid id' });
    return;
  }
  const userId = req.user!.id;
  const owns = db
    .prepare('SELECT 1 FROM recipes WHERE id = ? AND user_id = ?')
    .get(id, userId);
  if (!owns) {
    res.status(404).json({ error: 'Not found' });
    return;
  }
  const parse = favoriteSchema.safeParse(req.body);
  if (!parse.success) {
    res.status(400).json({ error: 'Invalid body' });
    return;
  }
  const fav = parse.data.isFavorite;
  db.transaction(() => {
    db.prepare(
      'UPDATE recipes SET is_favorite = ? WHERE id = ? AND user_id = ?',
    ).run(fav ? 1 : 0, id, userId);
    syncFavoriteGroup(userId, id, fav);
  })();
  res.json({ recipe: loadRecipe(userId, id) });
});

export default router;
export { loadRecipe };
