export const WORKOUT_PLANS = [
  {
    id: 'full-a', name: 'Full Body A (Beginner)', level: 'easy', days: 3,
    description: 'Chair/bodyweight squat, incline push-up, band row, glute bridge, dead bug + walk.',
    exercises: ['bodyweight-squat', 'incline-push-up', 'band-row', 'dead-bug', 'plank', 'walking'],
  },
  {
    id: 'full-b', name: 'Full Body B (Beginner)', level: 'easy', days: 3,
    description: 'Goblet squat, dumbbell press, lat pull/band row, hip hinge, side plank, calf raise.',
    exercises: ['goblet-squat', 'db-press', 'lat-pulldown', 'rdl', 'plank', 'cat-cow'],
  },
  {
    id: 'upper-lower', name: 'Upper / Lower (Intermediate)', level: 'normal', days: 4,
    description: 'Compound lifts + moderate volume + short conditioning.',
    exercises: ['push-up', 'db-row', 'db-shoulder-press', 'goblet-squat', 'rdl', 'db-curl', 'cable-pressdown'],
  },
  {
    id: 'ppl', name: 'Push-Pull-Legs (Intermediate)', level: 'normal', days: 5,
    description: 'Split routine with progressive overload.',
    exercises: ['db-press', 'db-shoulder-press', 'cable-pressdown', 'db-row', 'lat-pulldown', 'db-curl', 'goblet-squat', 'rdl'],
  },
  {
    id: 'home-no-equip', name: 'Home No Equipment', level: 'easy', days: 3,
    description: 'Bodyweight only, joint-friendly.',
    exercises: ['bodyweight-squat', 'incline-push-up', 'plank', 'dead-bug', 'cat-cow', 'walking'],
  },
  {
    id: 'core-focus', name: 'Core Focus + Full Body', level: 'normal', days: 3,
    description: 'Anti-movement core 2-4x/week. Abs build muscle; visible definition needs overall fat loss.',
    exercises: ['dead-bug', 'plank', 'goblet-squat', 'push-up', 'db-row', 'walking'],
  },
  {
    id: 'upper-power', name: 'Upper Power Builder', level: 'normal', days: 4,
    description: 'Chest, back, shoulders, arms with photo-guided form on every move.',
    exercises: ['dips-chest', 'pull-up', 'military-press', 'barbell-curl', 'skullcrusher', 'face-pull'],
  },
  {
    id: 'lower-core', name: 'Legs + Core Shaper', level: 'normal', days: 3,
    description: 'Squat, hinge, lunge and thrust patterns plus photo-guided core finishers.',
    exercises: ['goblet-squat', 'rdl', 'lunge', 'hip-thrust', 'calf-raise', 'crunch', 'russian-twist', 'side-plank'],
  },
];

// Level programs: exactly 10 different exercises per tier.
// The Active Workout screen loads THESE lists (this fixes every plan
// previously opening the same 4 exercises).
export const LEVEL_PROGRAMS = [
  {
    id: 'beginner', name: 'Beginner', tagline: 'Learn technique · 20–40 min · joint-friendly', color: '#34D399',
    exercises: ['bodyweight-squat', 'incline-push-up', 'band-row', 'dead-bug', 'plank', 'walking', 'cat-cow', 'calf-raise', 'bench-dips', 'reverse-crunch'],
  },
  {
    id: 'medium', name: 'Medium', tagline: 'Build strength · progressive overload', color: '#38BDF8',
    exercises: ['push-up', 'db-press', 'db-row', 'lat-pulldown', 'goblet-squat', 'rdl', 'db-shoulder-press', 'db-curl', 'cable-pressdown', 'crunch'],
  },
  {
    id: 'advanced', name: 'Advanced', tagline: 'High skill + intensity · solid base required', color: '#FF7A1A',
    exercises: ['pull-up', 'chin-up', 'dips-chest', 'military-press', 'bulgarian-split', 'hip-thrust', 'hanging-knee-raise', 'ab-wheel', 'battle-ropes', 'triceps-dips'],
  },
];

export const WEEK_TEMPLATE = [
  { day: 'Day 1', focus: 'Full Body A', detail: 'Squat, incline push-up, band row, glute bridge, dead bug, easy walk' },
  { day: 'Day 2', focus: 'Mobility / Yoga', detail: '20-30 min basic yoga + comfortable walking' },
  { day: 'Day 3', focus: 'Full Body B', detail: 'Goblet squat, press, pull, hinge, side plank, calf raise' },
  { day: 'Day 4', focus: 'Recovery', detail: 'Steps + gentle stretching; no hard strength' },
  { day: 'Day 5', focus: 'Full Body A', detail: 'Repeat with small progression if technique + recovery good' },
  { day: 'Day 6', focus: 'Cardio + Core', detail: 'Brisk walk/cycle + dead bug / plank / bird dog' },
  { day: 'Day 7', focus: 'Rest', detail: 'Rest, light mobility, plan meals, review progress' },
];
