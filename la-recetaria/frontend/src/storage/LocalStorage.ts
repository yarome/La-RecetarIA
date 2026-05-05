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
  Meal,
} from '../api/types';
import { MEALS } from '../api/types';
import type { StorageBackend } from './Storage';
import { GUEST_NEXT_ID, GUEST_STARTER_RECIPES } from './guestStarterRecipes';

const STORAGE_KEY = 'la-recetaria:guest';

const DEFAULT_GOALS: NutritionGoals = {
  kcal: 14000,
  protein: 350,
  carbs: 1750,
  sugars: 350,
  fat: 500,
  fiber: 175,
};

interface GuestData {
  nextId: number;
  recipes: Recipe[];
  groups: Group[];
  menu: MenuItem[];
  currentPlan: WeeklyPlan;
  savedPlans: SavedPlan[];
  nutritionGoals: NutritionGoals;
}

function freshData(): GuestData {
  return {
    nextId: GUEST_NEXT_ID,
    recipes: GUEST_STARTER_RECIPES.map((r) => ({ ...r })),
    groups: [
      { id: 1, name: 'Favorites', isProtected: true, recipeIds: [2] },
    ],
    menu: [],
    currentPlan: {},
    savedPlans: [],
    nutritionGoals: { ...DEFAULT_GOALS },
  };
}

function read(): GuestData {
  if (typeof window === 'undefined') return freshData();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return freshData();
    const parsed = JSON.parse(raw) as Partial<GuestData> | null;
    const fresh = freshData();
    if (!parsed || typeof parsed !== 'object') return fresh;
    return {
      ...fresh,
      ...parsed,
      groups: parsed.groups?.length
        ? parsed.groups
        : fresh.groups,
      currentPlan: parsed.currentPlan ?? {},
      savedPlans: parsed.savedPlans ?? [],
      nutritionGoals: { ...fresh.nutritionGoals, ...(parsed.nutritionGoals ?? {}) },
    };
  } catch {
    return freshData();
  }
}

function write(data: GuestData): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function nextId(data: GuestData): number {
  const id = data.nextId;
  data.nextId = id + 1;
  return id;
}

function findFavoriteGroup(data: GuestData): Group | undefined {
  return data.groups.find((g) => g.isProtected);
}

function syncFavorite(data: GuestData, recipeId: number, isFavorite: boolean): void {
  const fav = findFavoriteGroup(data);
  if (!fav) return;
  if (isFavorite) {
    if (!fav.recipeIds.includes(recipeId)) fav.recipeIds.unshift(recipeId);
  } else {
    fav.recipeIds = fav.recipeIds.filter((id) => id !== recipeId);
  }
  const recipe = data.recipes.find((r) => r.id === recipeId);
  if (recipe) recipe.isFavorite = isFavorite;
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

export class LocalStorageBackend implements StorageBackend {
  async listRecipes(): Promise<Recipe[]> {
    return clone(read().recipes);
  }

  async getRecipe(id: number): Promise<Recipe | null> {
    const r = read().recipes.find((x) => x.id === id);
    return r ? clone(r) : null;
  }

  async createRecipe(input: RecipeInput): Promise<Recipe> {
    const data = read();
    const recipe: Recipe = {
      ...input,
      id: nextId(data),
      createdAt: new Date().toISOString(),
    };
    data.recipes.unshift(recipe);
    if (recipe.isFavorite) syncFavorite(data, recipe.id, true);
    write(data);
    return clone(recipe);
  }

  async updateRecipe(id: number, input: RecipeInput): Promise<Recipe> {
    const data = read();
    const idx = data.recipes.findIndex((r) => r.id === id);
    if (idx === -1) throw new Error('Recipe not found');
    const updated: Recipe = { ...input, id, createdAt: data.recipes[idx].createdAt };
    data.recipes[idx] = updated;
    syncFavorite(data, id, updated.isFavorite);
    write(data);
    return clone(updated);
  }

  async deleteRecipe(id: number): Promise<void> {
    const data = read();
    data.recipes = data.recipes.filter((r) => r.id !== id);
    data.groups.forEach((g) => {
      g.recipeIds = g.recipeIds.filter((rid) => rid !== id);
    });
    data.menu = data.menu.filter((m) => m.recipeId !== id);
    Object.keys(data.currentPlan).forEach((day) => {
      const dayPlan = data.currentPlan[day as Weekday];
      if (!dayPlan) return;
      MEALS.forEach((m) => {
        const slots = dayPlan[m];
        if (slots) dayPlan[m] = slots.filter((s) => s.recipeId !== id);
      });
    });
    write(data);
  }

  async setFavorite(id: number, isFavorite: boolean): Promise<Recipe> {
    const data = read();
    const recipe = data.recipes.find((r) => r.id === id);
    if (!recipe) throw new Error('Recipe not found');
    recipe.isFavorite = isFavorite;
    syncFavorite(data, id, isFavorite);
    write(data);
    return clone(recipe);
  }

  async listGroups(): Promise<Group[]> {
    const data = read();
    return clone(
      [...data.groups].sort((a, b) => {
        if (a.isProtected !== b.isProtected) return a.isProtected ? -1 : 1;
        return a.name.localeCompare(b.name);
      }),
    );
  }

  async getGroup(id: number): Promise<Group | null> {
    const g = read().groups.find((x) => x.id === id);
    return g ? clone(g) : null;
  }

  async createGroup(name: string): Promise<Group> {
    const data = read();
    if (data.groups.some((g) => g.name.toLowerCase() === name.toLowerCase())) {
      throw new Error('A group with that name already exists');
    }
    const group: Group = {
      id: nextId(data),
      name,
      isProtected: false,
      recipeIds: [],
    };
    data.groups.push(group);
    write(data);
    return clone(group);
  }

  async renameGroup(id: number, name: string): Promise<Group> {
    const data = read();
    const g = data.groups.find((x) => x.id === id);
    if (!g) throw new Error('Group not found');
    if (g.isProtected) throw new Error('Cannot rename the Favorites group');
    if (data.groups.some((og) => og.id !== id && og.name.toLowerCase() === name.toLowerCase())) {
      throw new Error('A group with that name already exists');
    }
    g.name = name;
    write(data);
    return clone(g);
  }

  async deleteGroup(id: number): Promise<void> {
    const data = read();
    const g = data.groups.find((x) => x.id === id);
    if (!g) throw new Error('Group not found');
    if (g.isProtected) throw new Error('Cannot delete the Favorites group');
    data.groups = data.groups.filter((x) => x.id !== id);
    write(data);
  }

  async addRecipeToGroup(groupId: number, recipeId: number): Promise<Group> {
    const data = read();
    const group = data.groups.find((g) => g.id === groupId);
    if (!group) throw new Error('Group not found');
    if (!data.recipes.some((r) => r.id === recipeId)) throw new Error('Recipe not found');
    if (!group.recipeIds.includes(recipeId)) group.recipeIds.unshift(recipeId);
    if (group.isProtected) {
      const r = data.recipes.find((x) => x.id === recipeId);
      if (r) r.isFavorite = true;
    }
    write(data);
    return clone(group);
  }

  async removeRecipeFromGroup(groupId: number, recipeId: number): Promise<Group> {
    const data = read();
    const group = data.groups.find((g) => g.id === groupId);
    if (!group) throw new Error('Group not found');
    group.recipeIds = group.recipeIds.filter((id) => id !== recipeId);
    if (group.isProtected) {
      const r = data.recipes.find((x) => x.id === recipeId);
      if (r) r.isFavorite = false;
    }
    write(data);
    return clone(group);
  }

  async listMenu(): Promise<MenuItem[]> {
    return clone(
      [...read().menu].sort((a, b) => a.sortOrder - b.sortOrder || a.id - b.id),
    );
  }

  async addToMenu(recipeId: number, peopleCount: number): Promise<MenuItem> {
    const data = read();
    if (!data.recipes.some((r) => r.id === recipeId)) throw new Error('Recipe not found');
    const sortOrder = data.menu.length === 0 ? 0 : Math.max(...data.menu.map((m) => m.sortOrder)) + 1;
    const item: MenuItem = { id: nextId(data), recipeId, peopleCount, sortOrder };
    data.menu.push(item);
    write(data);
    return clone(item);
  }

  async updateMenuItem(
    id: number,
    patch: Partial<{ peopleCount: number; sortOrder: number }>,
  ): Promise<MenuItem[]> {
    const data = read();
    const item = data.menu.find((m) => m.id === id);
    if (!item) throw new Error('Menu item not found');
    if (patch.peopleCount !== undefined) item.peopleCount = patch.peopleCount;
    if (patch.sortOrder !== undefined) item.sortOrder = patch.sortOrder;
    write(data);
    return clone(
      [...data.menu].sort((a, b) => a.sortOrder - b.sortOrder || a.id - b.id),
    );
  }

  async removeFromMenu(id: number): Promise<void> {
    const data = read();
    data.menu = data.menu.filter((m) => m.id !== id);
    write(data);
  }

  async clearMenu(): Promise<void> {
    const data = read();
    data.menu = [];
    write(data);
  }

  async getCurrentPlan(): Promise<WeeklyPlan> {
    return clone(read().currentPlan);
  }

  async setCurrentPlan(plan: WeeklyPlan): Promise<WeeklyPlan> {
    const data = read();
    data.currentPlan = clone(plan);
    write(data);
    return clone(data.currentPlan);
  }

  async listSavedPlans(): Promise<SavedPlan[]> {
    return clone(
      [...read().savedPlans].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      ),
    );
  }

  async saveCurrentPlan(name: string, plan: WeeklyPlan): Promise<SavedPlan> {
    const data = read();
    const saved: SavedPlan = {
      id: nextId(data),
      name,
      plan: clone(plan),
      createdAt: new Date().toISOString(),
    };
    data.savedPlans.unshift(saved);
    write(data);
    return clone(saved);
  }

  async deleteSavedPlan(id: number): Promise<void> {
    const data = read();
    data.savedPlans = data.savedPlans.filter((p) => p.id !== id);
    write(data);
  }

  async getNutritionGoals(): Promise<NutritionGoals> {
    return clone(read().nutritionGoals);
  }

  async setNutritionGoals(goals: NutritionGoals): Promise<NutritionGoals> {
    const data = read();
    data.nutritionGoals = { ...goals };
    write(data);
    return clone(data.nutritionGoals);
  }

  async computeShoppingList(days: Weekday[]): Promise<ShoppingListItem[]> {
    const data = read();
    type Bucket = { name: string; unit: string; totalQuantity: number };
    const buckets = new Map<string, Bucket>();
    for (const day of days) {
      const dayPlan = data.currentPlan[day];
      if (!dayPlan) continue;
      for (const meal of MEALS as Meal[]) {
        const slots = dayPlan[meal] ?? [];
        for (const slot of slots) {
          const recipe = data.recipes.find((r) => r.id === slot.recipeId);
          if (!recipe || recipe.baseServings <= 0) continue;
          const factor = slot.people / recipe.baseServings;
          for (const ing of recipe.ingredients) {
            const key = `${ing.name.trim().toLowerCase()}__${ing.unit.trim().toLowerCase()}`;
            const scaled = ing.quantity * factor;
            const existing = buckets.get(key);
            if (existing) existing.totalQuantity += scaled;
            else
              buckets.set(key, {
                name: ing.name.trim(),
                unit: ing.unit.trim(),
                totalQuantity: scaled,
              });
          }
        }
      }
    }
    return Array.from(buckets.values()).sort((a, b) =>
      a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }),
    );
  }
}
