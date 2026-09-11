export const MEAL_TEMPLATES = [
  {
    id: 'veg-day-1', name: 'Veg Day — South Indian', diet: 'veg',
    meals: {
      breakfast: 'Idli (3) + sambar + boiled egg or extra dal (non-veg swap: 2 eggs)',
      lunch: '1.5 cup rice OR 3 roti + dal + 2 veg + curd + salad',
      snack: 'Buttermilk + roasted chana (30g)',
      dinner: '2 roti + paneer/tofu + big veg portion + dal',
    },
    swaps: ['Rice ↔ roti ↔ millet (same portion energy)', 'Paneer ↔ tofu ↔ soya', 'Curd ↔ buttermilk'],
  },
  {
    id: 'nonveg-day-1', name: 'Non-veg Day — Balanced', diet: 'non_veg',
    meals: {
      breakfast: 'Veg upma + curd + 2 eggs (veg swap: paneer 60g)',
      lunch: 'Measured rice/roti + dal + veg + chicken/fish 120-150g + curd',
      snack: 'Fruit + yogurt (15g protein aim)',
      dinner: 'Veg + protein + moderate grain; lighter per hunger, no “no carbs at night” rule',
    },
    swaps: ['Chicken ↔ fish ↔ eggs ↔ paneer', 'Rice ↔ ragi ↔ chapati'],
  },
  {
    id: 'quick-office', name: 'Office / Quick Day', diet: 'any',
    meals: {
      breakfast: 'Oats + milk/curd + banana + peanuts (measured)',
      lunch: 'Rajma/chole + rice/roti + salad + curd',
      snack: 'Sprouts chaat',
      dinner: 'Dosa (1-2) + sambar + veg (portion guidance)',
    },
    swaps: ['Oats ↔ poha ↔ upma', 'Sprouts ↔ chana ↔ yogurt'],
  },
];

export const GROCERY_LIST = [
  'Rice / atta / ragi / oats / poha', 'Toor dal / chana / rajma / soya',
  'Paneer / tofu / eggs / chicken / fish (per diet)', 'Milk / curd / buttermilk',
  'Seasonal veg x5 + fruit x3', 'Peanuts / chana / nuts (measured)', 'Oil, haldi, jeera, salt',
];
