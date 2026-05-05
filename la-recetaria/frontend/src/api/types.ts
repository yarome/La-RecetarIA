export type Weekday = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun';
export const WEEKDAYS: Weekday[] = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
export const WEEKDAY_LABEL: Record<Weekday, string> = {
  mon: 'Monday',
  tue: 'Tuesday',
  wed: 'Wednesday',
  thu: 'Thursday',
  fri: 'Friday',
  sat: 'Saturday',
  sun: 'Sunday',
};

export type Meal = 'breakfast' | 'lunch' | 'dinner' | 'snack';
export const MEALS: Meal[] = ['breakfast', 'lunch', 'dinner', 'snack'];
export const MEAL_LABEL: Record<Meal, string> = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  dinner: 'Dinner',
  snack: 'Snack',
};

export interface Ingredient {
  name: string;
  quantity: number;
  unit: string;
}

export interface Nutrition {
  protein: number;
  carbs: number;
  sugars: number;
  fat: number;
  fiber: number;
}

export interface Recipe {
  id: number;
  name: string;
  imageUrl: string | null;
  prepTimeMin: number;
  baseServings: number;
  tags: string[];
  ingredients: Ingredient[];
  kcal: number;
  nutrition: Nutrition;
  steps: string[];
  videoUrl: string | null;
  isFavorite: boolean;
  createdAt?: string;
}

export type RecipeInput = Omit<Recipe, 'id' | 'createdAt'>;

export interface Group {
  id: number;
  name: string;
  isProtected: boolean;
  recipeIds: number[];
}

export interface MenuItem {
  id: number;
  recipeId: number;
  peopleCount: number;
  sortOrder: number;
}

export interface PlanSlot {
  recipeId: number;
  people: number;
}

export type WeeklyPlan = Partial<Record<Weekday, Partial<Record<Meal, PlanSlot[]>>>>;

export interface SavedPlan {
  id: number;
  name: string;
  plan: WeeklyPlan;
  createdAt: string;
}

export interface NutritionGoals extends Nutrition {
  kcal: number;
}

export interface ShoppingListItem {
  name: string;
  unit: string;
  totalQuantity: number;
}

export interface User {
  id: number;
  email: string;
}
