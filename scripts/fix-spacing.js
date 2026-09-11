// Adds <BottomSpace /> (bottom breathing room) to nested ScrollView screens.
const fs = require('fs');
const FILES = [
  'app/workouts/active.tsx', 'app/workouts/summary.tsx', 'app/workouts/history.tsx',
  'app/workouts/add.tsx', 'app/workouts/[id].tsx',
  'app/nutrition/logger.tsx', 'app/nutrition/plan.tsx', 'app/nutrition/recovery.tsx',
  'app/nutrition/add-food.tsx', 'app/nutrition/recipes.tsx', 'app/nutrition/grocery.tsx',
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
  if (t.includes('<BottomSpace')) { skipped++; continue; }
  const im = t.match(/import\s*\{([^}]+)\}\s*from\s*(['"][^'"]*components\/ui['"])/);
  if (!im) { console.log('NO-UI-IMPORT:', f); continue; }
  t = t.replace(im[0], `import {${im[1].trim()}, BottomSpace} from ${im[2]}`);
  const i = t.lastIndexOf('</ScrollView>');
  if (i === -1) { console.log('NO-SCROLL:', f); continue; }
  t = t.slice(0, i) + '      <BottomSpace />\n    ' + t.slice(i);
  fs.writeFileSync(f, t);
  fixed++;
  console.log('fixed:', f);
}
console.log(`\ndone: ${fixed} fixed, ${skipped} already-ok`);
