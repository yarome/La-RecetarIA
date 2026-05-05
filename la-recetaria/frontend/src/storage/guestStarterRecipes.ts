import type { Recipe } from '../api/types';

/** Fixed timestamp so guest seed data is stable across reloads. */
const GUEST_CREATED_AT = '2026-01-01T00:00:00.000Z';

/**
 * First three sample recipes (same content as backend/data/sample-recipes.json),
 * with stable ids 2–4 for guest mode. Tortilla is pre-favorited via the Favorites group.
 */
export const GUEST_STARTER_RECIPES: Recipe[] = [
  {
    id: 2,
    name: 'Spanish tortilla (tortilla de patatas)',
    imageUrl:
      'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=800&q=80',
    prepTimeMin: 45,
    baseServings: 4,
    tags: ['breakfast', 'dinner', 'eggs', 'freezable'],
    ingredients: [
      { name: 'Potatoes', quantity: 600, unit: 'g' },
      { name: 'Yellow onion', quantity: 1, unit: 'unit' },
      { name: 'Eggs', quantity: 6, unit: 'unit' },
      { name: 'Olive oil', quantity: 80, unit: 'ml' },
      { name: 'Salt', quantity: 1, unit: 'tsp' },
    ],
    kcal: 1680,
    nutrition: { protein: 56, carbs: 132, sugars: 12, fat: 98, fiber: 14 },
    steps: [
      'Peel and slice potatoes thin; dice onion.',
      'Fry potatoes and onion gently in olive oil until tender, not browned. Drain excess oil, reserve 2 tbsp.',
      'Beat eggs with salt. Mix with potatoes and onion in the pan.',
      'Cook on medium until edges set, flip with a plate (or finish under a broiler).',
      'Rest 5 minutes, slice, and serve warm or cold.',
    ],
    videoUrl: null,
    isFavorite: true,
    createdAt: GUEST_CREATED_AT,
  },
  {
    id: 3,
    name: 'Greek salad with feta',
    imageUrl:
      'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=800&q=80',
    prepTimeMin: 15,
    baseServings: 2,
    tags: ['lunch', 'vegetarian', 'quick'],
    ingredients: [
      { name: 'Cucumber', quantity: 1, unit: 'unit' },
      { name: 'Tomatoes', quantity: 3, unit: 'unit' },
      { name: 'Red onion', quantity: 0.5, unit: 'unit' },
      { name: 'Kalamata olives', quantity: 60, unit: 'g' },
      { name: 'Feta cheese', quantity: 120, unit: 'g' },
      { name: 'Extra virgin olive oil', quantity: 45, unit: 'ml' },
      { name: 'Red wine vinegar', quantity: 15, unit: 'ml' },
      { name: 'Dried oregano', quantity: 1, unit: 'tsp' },
    ],
    kcal: 620,
    nutrition: { protein: 18, carbs: 28, sugars: 16, fat: 52, fiber: 8 },
    steps: [
      'Chop cucumber and tomatoes; slice onion thin.',
      'Combine vegetables with olives in a bowl.',
      'Whisk oil, vinegar, and oregano; season with salt and pepper.',
      'Toss salad, crumble feta on top, and serve.',
    ],
    videoUrl: null,
    isFavorite: false,
    createdAt: GUEST_CREATED_AT,
  },
  {
    id: 4,
    name: 'Creamy mushroom risotto',
    imageUrl:
      'https://images.unsplash.com/photo-1476124369491-e7addf5db371?w=800&q=80',
    prepTimeMin: 40,
    baseServings: 4,
    tags: ['dinner', 'carbs', 'vegetarian'],
    ingredients: [
      { name: 'Arborio rice', quantity: 320, unit: 'g' },
      { name: 'Mixed mushrooms', quantity: 400, unit: 'g' },
      { name: 'Shallot', quantity: 2, unit: 'unit' },
      { name: 'Garlic cloves', quantity: 2, unit: 'unit' },
      { name: 'Dry white wine', quantity: 120, unit: 'ml' },
      { name: 'Vegetable stock (hot)', quantity: 1200, unit: 'ml' },
      { name: 'Butter', quantity: 40, unit: 'g' },
      { name: 'Parmesan (grated)', quantity: 60, unit: 'g' },
      { name: 'Fresh thyme', quantity: 1, unit: 'tsp' },
    ],
    kcal: 1980,
    nutrition: { protein: 52, carbs: 268, sugars: 18, fat: 68, fiber: 12 },
    steps: [
      'Sauté chopped shallot and garlic in half the butter until soft.',
      'Add sliced mushrooms; cook until golden. Season.',
      'Stir in rice; toast 1–2 minutes. Add wine and stir until absorbed.',
      'Add hot stock one ladle at a time, stirring until absorbed before the next.',
      'When rice is creamy and al dente, fold in remaining butter, parmesan, and thyme.',
    ],
    videoUrl: null,
    isFavorite: false,
    createdAt: GUEST_CREATED_AT,
  },
];

export const GUEST_NEXT_ID = 5;
