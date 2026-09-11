import type { Food } from '../types/app';

export const FOODS: Food[] = [
  { id: 'idli', name: 'Idli (2 pc)', category: 'breakfast', serving: '2 pc (~120g)', calories: 140, protein_g: 5, carbs_g: 28, fat_g: 1, fiber_g: 2, sugar_g: 0 },
  { id: 'sambar', name: 'Sambar (1 katori)', category: 'dal', serving: '150ml', calories: 120, protein_g: 5, carbs_g: 18, fat_g: 3, fiber_g: 4, sugar_g: 3 },
  { id: 'dosa', name: 'Dosa (1)', category: 'breakfast', serving: '1 (~80g)', calories: 170, protein_g: 4, carbs_g: 32, fat_g: 3, fiber_g: 1, sugar_g: 1 },
  { id: 'upma', name: 'Veg Upma', category: 'breakfast', serving: '1 bowl (200g)', calories: 240, protein_g: 6, carbs_g: 42, fat_g: 6, fiber_g: 4, sugar_g: 3 },
  { id: 'poha', name: 'Poha', category: 'breakfast', serving: '1 bowl (200g)', calories: 220, protein_g: 4, carbs_g: 44, fat_g: 4, fiber_g: 3, sugar_g: 4 },
  { id: 'chapati', name: 'Chapati/Roti (1)', category: 'grains', serving: '1 (~40g)', calories: 110, protein_g: 3.5, carbs_g: 22, fat_g: 1, fiber_g: 3, sugar_g: 0 },
  { id: 'rice', name: 'Cooked Rice', category: 'grains', serving: '1 cup (150g)', calories: 195, protein_g: 3.5, carbs_g: 44, fat_g: 0.5, fiber_g: 1, sugar_g: 0 },
  { id: 'dal', name: 'Dal Tadka', category: 'dal', serving: '1 katori (150g)', calories: 170, protein_g: 8, carbs_g: 20, fat_g: 6, fiber_g: 5, sugar_g: 2 },
  { id: 'rajma', name: 'Rajma', category: 'dal', serving: '1 katori', calories: 210, protein_g: 10, carbs_g: 32, fat_g: 4, fiber_g: 8, sugar_g: 2 },
  { id: 'chole', name: 'Chole', category: 'dal', serving: '1 katori', calories: 220, protein_g: 9, carbs_g: 32, fat_g: 6, fiber_g: 8, sugar_g: 3 },
  { id: 'paneer', name: 'Paneer (100g)', category: 'protein', serving: '100g', calories: 265, protein_g: 18, carbs_g: 4, fat_g: 20, fiber_g: 0, sugar_g: 2 },
  { id: 'egg', name: 'Eggs (2)', category: 'protein', serving: '2 large', calories: 140, protein_g: 12, carbs_g: 1, fat_g: 10, fiber_g: 0, sugar_g: 0 },
  { id: 'chicken', name: 'Chicken Curry (150g)', category: 'protein', serving: '150g', calories: 240, protein_g: 30, carbs_g: 6, fat_g: 10, fiber_g: 1, sugar_g: 2 },
  { id: 'fish', name: 'Fish Curry (150g)', category: 'protein', serving: '150g', calories: 220, protein_g: 28, carbs_g: 5, fat_g: 9, fiber_g: 1, sugar_g: 1 },
  { id: 'curd', name: 'Curd (1 katori)', category: 'dairy', serving: '150g', calories: 95, protein_g: 5, carbs_g: 7, fat_g: 5, fiber_g: 0, sugar_g: 6 },
  { id: 'buttermilk', name: 'Buttermilk', category: 'dairy', serving: '250ml', calories: 40, protein_g: 3, carbs_g: 5, fat_g: 1, fiber_g: 0, sugar_g: 4 },
  { id: 'oats', name: 'Oats + Milk', category: 'breakfast', serving: '1 bowl', calories: 280, protein_g: 12, carbs_g: 45, fat_g: 6, fiber_g: 6, sugar_g: 8 },
  { id: 'sprouts', name: 'Sprouts Chaat', category: 'snack', serving: '1 bowl', calories: 150, protein_g: 9, carbs_g: 22, fat_g: 2, fiber_g: 5, sugar_g: 3 },
  { id: 'chana', name: 'Roasted Chana (30g)', category: 'snack', serving: '30g', calories: 120, protein_g: 6, carbs_g: 18, fat_g: 2, fiber_g: 5, sugar_g: 0 },
  { id: 'nuts', name: 'Mixed Nuts (20g)', category: 'snack', serving: 'small handful', calories: 115, protein_g: 3.5, carbs_g: 4, fat_g: 10, fiber_g: 2, sugar_g: 1 },
  { id: 'banana', name: 'Banana (1)', category: 'fruit', serving: '1 medium', calories: 105, protein_g: 1, carbs_g: 27, fat_g: 0.5, fiber_g: 3, sugar_g: 14 },
  { id: 'ragi', name: 'Ragi Malt / Roti', category: 'grains', serving: '1 serving', calories: 150, protein_g: 4, carbs_g: 32, fat_g: 1, fiber_g: 4, sugar_g: 1 },
];

export const MICRONUTRIENT_CARDS = [
  { name: 'Vitamin A', role: 'Vision, immunity, skin', sources: 'Carrot, spinach, mango, eggs, milk', warn: 'Do not megadose supplements.' },
  { name: 'B Vitamins', role: 'Energy metabolism', sources: 'Whole grains, dal, eggs, milk, leafy greens', warn: 'Food-first approach.' },
  { name: 'Vitamin C', role: 'Immunity, iron absorption', sources: 'Amla, guava, citrus, capsicum', warn: 'More is not better beyond needs.' },
  { name: 'Vitamin D', role: 'Bones, muscle function', sources: 'Sunlight, fortified milk, fish, eggs', warn: 'Test before high-dose supplements.' },
  { name: 'Calcium', role: 'Bones, teeth', sources: 'Milk, curd, ragi, sesame, greens', warn: 'Avoid excess calcium pills without advice.' },
  { name: 'Iron', role: 'Oxygen transport', sources: 'Dal, chole, spinach + vitamin C foods', warn: 'Do not self-prescribe iron.' },
  { name: 'B12', role: 'Nerves, blood cells', sources: 'Milk, curd, eggs, fish, fortified foods (veg/vegan check)', warn: 'Vegans: discuss testing with clinician.' },
  { name: 'Zinc / Magnesium / Potassium', role: 'Recovery, hydration balance', sources: 'Nuts, seeds, bananas, legumes', warn: 'Food first; avoid megadoses.' },
];
