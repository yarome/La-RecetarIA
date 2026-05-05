import { readFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { z } from 'zod';
import { db } from '../db.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

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

type RecipeInput = z.infer<typeof recipeSchema>;

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

function insertRecipe(userId: number, data: RecipeInput): number {
  return db.transaction(() => {
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
}

function resolveUserId(): number {
  const fromEnv = process.env.SEED_USER_ID;
  if (fromEnv && fromEnv.trim()) {
    const n = Number(fromEnv);
    if (Number.isInteger(n) && n > 0) return n;
  }
  const row = db
    .prepare('SELECT id FROM users ORDER BY id ASC LIMIT 1')
    .get() as { id: number } | undefined;
  if (!row) throw new Error('No users in database. Run npm run seed:users first.');
  return row.id;
}

function loadRecipes(): RecipeInput[] {
  const path = join(__dirname, '..', '..', 'data', 'sample-recipes.json');
  if (!existsSync(path)) {
    throw new Error(`Missing ${path}`);
  }
  const raw = JSON.parse(readFileSync(path, 'utf-8'));
  const arr = z.array(recipeSchema).parse(raw);
  return arr;
}

function main(): void {
  const userId = resolveUserId();
  const recipes = loadRecipes();
  let inserted = 0;
  let skipped = 0;

  for (const r of recipes) {
    const exists = db
      .prepare('SELECT 1 FROM recipes WHERE user_id = ? AND name = ?')
      .get(userId, r.name);
    if (exists) {
      console.log(`  skip (exists): ${r.name}`);
      skipped += 1;
      continue;
    }
    const id = insertRecipe(userId, r);
    console.log(`  inserted: ${r.name} (id=${id})`);
    inserted += 1;
  }

  console.log(`Done. Inserted ${inserted}, skipped ${skipped} (user_id=${userId}).`);
}

main();
