import { db } from '../db.js';
import type { NutritionGoals } from '../types.js';

export const DEFAULT_NUTRITION_GOALS: NutritionGoals = {
  kcal: 14000,
  protein: 350,
  carbs: 1750,
  sugars: 350,
  fat: 500,
  fiber: 175,
};

export function bootstrapUser(userId: number): void {
  const tx = db.transaction(() => {
    const existingFav = db
      .prepare(`SELECT id FROM groups WHERE user_id = ? AND is_protected = 1`)
      .get(userId);
    if (!existingFav) {
      db.prepare(
        `INSERT INTO groups (user_id, name, is_protected) VALUES (?, 'Favorites', 1)`,
      ).run(userId);
    }
    const existingGoals = db
      .prepare(`SELECT user_id FROM nutrition_goals WHERE user_id = ?`)
      .get(userId);
    if (!existingGoals) {
      db.prepare(
        `INSERT INTO nutrition_goals (user_id, goals_json) VALUES (?, ?)`,
      ).run(userId, JSON.stringify(DEFAULT_NUTRITION_GOALS));
    }
    const existingPlan = db
      .prepare(`SELECT user_id FROM current_plans WHERE user_id = ?`)
      .get(userId);
    if (!existingPlan) {
      db.prepare(
        `INSERT INTO current_plans (user_id, plan_json) VALUES (?, '{}')`,
      ).run(userId);
    }
  });
  tx();
}
