import { apiFetch } from '../api/client';
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
import type { StorageBackend } from './Storage';

export class ApiStorage implements StorageBackend {
  async listRecipes(): Promise<Recipe[]> {
    const res = await apiFetch<{ recipes: Recipe[] }>('/api/recipes');
    return res.recipes;
  }

  async getRecipe(id: number): Promise<Recipe | null> {
    try {
      const res = await apiFetch<{ recipe: Recipe }>(`/api/recipes/${id}`);
      return res.recipe;
    } catch {
      return null;
    }
  }

  async createRecipe(input: RecipeInput): Promise<Recipe> {
    const res = await apiFetch<{ recipe: Recipe }>('/api/recipes', {
      method: 'POST',
      body: JSON.stringify(input),
    });
    return res.recipe;
  }

  async updateRecipe(id: number, input: RecipeInput): Promise<Recipe> {
    const res = await apiFetch<{ recipe: Recipe }>(`/api/recipes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(input),
    });
    return res.recipe;
  }

  async deleteRecipe(id: number): Promise<void> {
    await apiFetch(`/api/recipes/${id}`, { method: 'DELETE' });
  }

  async setFavorite(id: number, isFavorite: boolean): Promise<Recipe> {
    const res = await apiFetch<{ recipe: Recipe }>(`/api/recipes/${id}/favorite`, {
      method: 'PUT',
      body: JSON.stringify({ isFavorite }),
    });
    return res.recipe;
  }

  async listGroups(): Promise<Group[]> {
    const res = await apiFetch<{ groups: Group[] }>('/api/groups');
    return res.groups;
  }

  async getGroup(id: number): Promise<Group | null> {
    try {
      const res = await apiFetch<{ group: Group }>(`/api/groups/${id}`);
      return res.group;
    } catch {
      return null;
    }
  }

  async createGroup(name: string): Promise<Group> {
    const res = await apiFetch<{ group: Group }>('/api/groups', {
      method: 'POST',
      body: JSON.stringify({ name }),
    });
    return res.group;
  }

  async renameGroup(id: number, name: string): Promise<Group> {
    const res = await apiFetch<{ group: Group }>(`/api/groups/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ name }),
    });
    return res.group;
  }

  async deleteGroup(id: number): Promise<void> {
    await apiFetch(`/api/groups/${id}`, { method: 'DELETE' });
  }

  async addRecipeToGroup(groupId: number, recipeId: number): Promise<Group> {
    const res = await apiFetch<{ group: Group }>(
      `/api/groups/${groupId}/recipes/${recipeId}`,
      { method: 'POST' },
    );
    return res.group;
  }

  async removeRecipeFromGroup(groupId: number, recipeId: number): Promise<Group> {
    const res = await apiFetch<{ group: Group }>(
      `/api/groups/${groupId}/recipes/${recipeId}`,
      { method: 'DELETE' },
    );
    return res.group;
  }

  async listMenu(): Promise<MenuItem[]> {
    const res = await apiFetch<{ items: MenuItem[] }>('/api/menu');
    return res.items;
  }

  async addToMenu(recipeId: number, peopleCount: number): Promise<MenuItem> {
    const res = await apiFetch<{ item: MenuItem }>('/api/menu', {
      method: 'POST',
      body: JSON.stringify({ recipeId, peopleCount }),
    });
    return res.item;
  }

  async updateMenuItem(
    id: number,
    patch: Partial<{ peopleCount: number; sortOrder: number }>,
  ): Promise<MenuItem[]> {
    const res = await apiFetch<{ items: MenuItem[] }>(`/api/menu/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(patch),
    });
    return res.items;
  }

  async removeFromMenu(id: number): Promise<void> {
    await apiFetch(`/api/menu/${id}`, { method: 'DELETE' });
  }

  async clearMenu(): Promise<void> {
    await apiFetch('/api/menu', { method: 'DELETE' });
  }

  async getCurrentPlan(): Promise<WeeklyPlan> {
    const res = await apiFetch<{ plan: WeeklyPlan }>('/api/plans/current');
    return res.plan;
  }

  async setCurrentPlan(plan: WeeklyPlan): Promise<WeeklyPlan> {
    const res = await apiFetch<{ plan: WeeklyPlan }>('/api/plans/current', {
      method: 'PUT',
      body: JSON.stringify({ plan }),
    });
    return res.plan;
  }

  async listSavedPlans(): Promise<SavedPlan[]> {
    const res = await apiFetch<{ plans: SavedPlan[] }>('/api/plans');
    return res.plans;
  }

  async saveCurrentPlan(name: string, plan: WeeklyPlan): Promise<SavedPlan> {
    const res = await apiFetch<{ plan: SavedPlan }>('/api/plans', {
      method: 'POST',
      body: JSON.stringify({ name, plan }),
    });
    return res.plan;
  }

  async deleteSavedPlan(id: number): Promise<void> {
    await apiFetch(`/api/plans/${id}`, { method: 'DELETE' });
  }

  async getNutritionGoals(): Promise<NutritionGoals> {
    const res = await apiFetch<{ goals: NutritionGoals }>('/api/nutrition-goals');
    return res.goals;
  }

  async setNutritionGoals(goals: NutritionGoals): Promise<NutritionGoals> {
    const res = await apiFetch<{ goals: NutritionGoals }>('/api/nutrition-goals', {
      method: 'PUT',
      body: JSON.stringify(goals),
    });
    return res.goals;
  }

  async computeShoppingList(days: Weekday[]): Promise<ShoppingListItem[]> {
    const res = await apiFetch<{ items: ShoppingListItem[] }>(
      '/api/shopping-list',
      {
        method: 'POST',
        body: JSON.stringify({ days }),
      },
    );
    return res.items;
  }
}
