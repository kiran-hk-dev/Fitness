// Adds <TopSpace /> (top breathing room) right inside every screen container.
const fs = require('fs');
const FILES = [
  'app/(tabs)/index.tsx', 'app/(tabs)/workouts.tsx', 'app/(tabs)/nutrition.tsx',
  'app/(tabs)/progress.tsx', 'app/(tabs)/profile.tsx',
  'app/workouts/active.tsx', 'app/workouts/summary.tsx', 'app/workouts/history.tsx',
  'app/workouts/add.tsx', 'app/workouts/[id].tsx', 'app/workouts/library.tsx',
  'app/workouts/plans.tsx',
  'app/nutrition/logger.tsx', 'app/nutrition/search.tsx', 'app/nutrition/plan.tsx',
  'app/nutrition/recipes.tsx', 'app/nutrition/grocery.tsx', 'app/nutrition/recovery.tsx',
  'app/nutrition/add-food.tsx',
  'app/yoga/index.tsx', 'app/yoga/[id].tsx', 'app/yoga/active.tsx',
  'app/yoga/history.tsx', 'app/yoga/add.tsx',
  'app/progress/weight.tsx', 'app/progress/measurements.tsx', 'app/progress/strength.tsx',
  'app/progress/habits.tsx', 'app/progress/photos.tsx', 'app/progress/monthly-review.tsx',
  'app/progress/share.tsx',
  'app/(onboarding)/profile.tsx', 'app/(onboarding)/goal.tsx', 'app/(onboarding)/diet.tsx',
  'app/(onboarding)/equipment.tsx', 'app/(onboarding)/level.tsx',
  'app/(onboarding)/schedule.tsx', 'app/(onboarding)/summary.tsx',
];
let fixed = 0, skipped = 0;
for (const f of FILES) {
  let t = fs.readFileSync(f, 'utf8');
  if (t.includes('<TopSpace')) { skipped++; continue; }
  const im = t.match(/import\s*\{([^}]+)\}\s*from\s*(['"][^'"]*components\/ui['"])/);
  if (!im) { console.log('NO-UI-IMPORT:', f); continue; }
  t = t.replace(im[0], `import {${im[1].trim()}, TopSpace} from ${im[2]}`);
  const lines = t.split('\n');
  // root container: first <ScrollView...> line, else the flex:1 root <View> line (FlatList screens)
  let idx = lines.findIndex((l) => l.includes('<ScrollView'));
  if (idx === -1) {
    idx = lines.findIndex((l) => l.includes('<View style={{ flex: 1,'));
  }
  if (idx === -1) { console.log('NO-CONTAINER:', f); continue; }
  lines.splice(idx + 1, 0, '      <TopSpace />');
  fs.writeFileSync(f, lines.join('\n'));
  fixed++;
}
console.log(`done: ${fixed} fixed, ${skipped} already-ok`);
