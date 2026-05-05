import type {
  Group,
  MenuItem,
  NutritionGoals,
  Recipe,
  RecipeInput,
  SavedPlan,
  ShoppingListItem,
  Weekday,
  WeeklyPlan,
} from '../api/types';

export interface StorageBackend {
  listRecipes(): Promise<Recipe[]>;
  getRecipe(id: number): Promise<Recipe | null>;
  createRecipe(input: RecipeInput): Promise<Recipe>;
  updateRecipe(id: number, input: RecipeInput): Promise<Recipe>;
  deleteRecipe(id: number): Promise<void>;
  setFavorite(id: number, isFavorite: boolean): Promise<Recipe>;

  listGroups(): Promise<Group[]>;
  getGroup(id: number): Promise<Group | null>;
  createGroup(name: string): Promise<Group>;
  renameGroup(id: number, name: string): Promise<Group>;
  deleteGroup(id: number): Promise<void>;
  addRecipeToGroup(groupId: number, recipeId: number): Promise<Group>;
  removeRecipeFromGroup(groupId: number, recipeId: number): Promise<Group>;

  listMenu(): Promise<MenuItem[]>;
  addToMenu(recipeId: number, peopleCount: number): Promise<MenuItem>;
  updateMenuItem(
    id: number,
    patch: Partial<{ peopleCount: number; sortOrder: number }>,
  ): Promise<MenuItem[]>;
  removeFromMenu(id: number): Promise<void>;
  clearMenu(): Promise<void>;

  getCurrentPlan(): Promise<WeeklyPlan>;
  setCurrentPlan(plan: WeeklyPlan): Promise<WeeklyPlan>;
  listSavedPlans(): Promise<SavedPlan[]>;
  saveCurrentPlan(name: string, plan: WeeklyPlan): Promise<SavedPlan>;
  deleteSavedPlan(id: number): Promise<void>;

  getNutritionGoals(): Promise<NutritionGoals>;
  setNutritionGoals(goals: NutritionGoals): Promise<NutritionGoals>;

  computeShoppingList(days: Weekday[]): Promise<ShoppingListItem[]>;
}
