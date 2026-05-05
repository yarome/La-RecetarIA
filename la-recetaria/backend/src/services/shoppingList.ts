import { db } from '../db.js';
import type { ShoppingListItem, Weekday, WeeklyPlan } from '../types.js';

interface IngredientRow {
  name: string;
  quantity: number;
  unit: string;
}

interface RecipeForScaling {
  baseServings: number;
  ingredients: IngredientRow[];
}

function loadRecipeForScaling(
  userId: number,
  recipeId: number,
): RecipeForScaling | null {
  const r = db
    .prepare(
      'SELECT base_servings FROM recipes WHERE id = ? AND user_id = ?',
    )
    .get(recipeId, userId) as { base_servings: number } | undefined;
  if (!r) return null;
  const ingredients = db
    .prepare(
      'SELECT name, quantity, unit FROM ingredients WHERE recipe_id = ? ORDER BY sort_order ASC, id ASC',
    )
    .all(recipeId) as IngredientRow[];
  return { baseServings: r.base_servings, ingredients };
}

function normaliseUnit(unit: string): string {
  return unit.trim().toLowerCase();
}

function normaliseName(name: string): string {
  return name.trim().toLowerCase();
}

export function buildShoppingList(
  userId: number,
  days: Weekday[],
  plan: WeeklyPlan,
): ShoppingListItem[] {
  type Bucket = { name: string; unit: string; totalQuantity: number };
  const buckets = new Map<string, Bucket>();

  for (const day of days) {
    const dayPlan = plan[day];
    if (!dayPlan) continue;
    for (const meal of Object.keys(dayPlan) as (keyof typeof dayPlan)[]) {
      const slots = dayPlan[meal] ?? [];
      for (const slot of slots) {
        const recipe = loadRecipeForScaling(userId, slot.recipeId);
        if (!recipe || recipe.baseServings <= 0) continue;
        const factor = slot.people / recipe.baseServings;
        for (const ing of recipe.ingredients) {
          const key = `${normaliseName(ing.name)}__${normaliseUnit(ing.unit)}`;
          const scaled = ing.quantity * factor;
          const existing = buckets.get(key);
          if (existing) {
            existing.totalQuantity += scaled;
          } else {
            buckets.set(key, {
              name: ing.name.trim(),
              unit: ing.unit.trim(),
              totalQuantity: scaled,
            });
          }
        }
      }
    }
  }

  return Array.from(buckets.values()).sort((a, b) =>
    a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }),
  );
}
