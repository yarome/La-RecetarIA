import type { Recipe, Ingredient, Nutrition } from '../api/types';

export function scaleFactor(recipe: Pick<Recipe, 'baseServings'>, people: number): number {
  if (recipe.baseServings <= 0) return 1;
  return people / recipe.baseServings;
}

export function scaleIngredient(ing: Ingredient, factor: number): Ingredient {
  return { ...ing, quantity: ing.quantity * factor };
}

export function scaleNutrition(n: Nutrition, factor: number): Nutrition {
  return {
    protein: n.protein * factor,
    carbs: n.carbs * factor,
    sugars: n.sugars * factor,
    fat: n.fat * factor,
    fiber: n.fiber * factor,
  };
}

export function formatQuantity(quantity: number, unit: string): string {
  const u = unit.trim().toLowerCase();
  const isCount = u === 'unit' || u === 'units' || u === 'pcs' || u === 'piece';
  const rounded = Math.round(quantity * 100) / 100;
  const display = Number.isInteger(rounded)
    ? rounded.toString()
    : rounded.toFixed(2).replace(/\.?0+$/, '');
  if (isCount) return `${display} ${quantity === 1 ? 'unit' : 'units'}`;
  return `${display} ${unit}`;
}
