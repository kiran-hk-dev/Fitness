// Wraps nested screens so <BottomNav/> sits fixed at the bottom of every page.
const fs = require('fs');
const FILES = [
  'app/workouts/plans.tsx', 'app/workouts/library.tsx', 'app/workouts/[id].tsx',
  'app/workouts/active.tsx', 'app/workouts/summary.tsx', 'app/workouts/history.tsx',
  'app/workouts/add.tsx',
  'app/nutrition/logger.tsx', 'app/nutrition/search.tsx', 'app/nutrition/plan.tsx',
  'app/nutrition/recipes.tsx', 'app/nutrition/grocery.tsx', 'app/nutrition/recovery.tsx',
  'app/nutrition/add-food.tsx',
  'app/yoga/index.tsx', 'app/yoga/[id].tsx', 'app/yoga/active.tsx',
  'app/yoga/history.tsx', 'app/yoga/add.tsx',
  'app/progress/weight.tsx', 'app/progress/measurements.tsx', 'app/progress/strength.tsx',
  'app/progress/habits.tsx', 'app/progress/photos.tsx', 'app/progress/monthly-review.tsx',
  'app/progress/share.tsx',
];
const IMPORT = `import { BottomNav } from '../../src/components/BottomNav';`;
let ok = 0;
for (const f of FILES) {
  let t = fs.readFileSync(f, 'utf8');
  if (t.includes('<BottomNav')) { console.log('skip (has nav):', f); continue; }
  const hasFlatList = t.includes('<FlatList');
  // 1) import
  const lines = t.split('\n');
  let li = lines.findIndex((l) => l.startsWith('import '));
  let lastImport = -1;
  lines.forEach((l, i) => { if (l.startsWith('import ')) lastImport = i; });
  lines.splice(lastImport + 1, 0, IMPORT);
  t = lines.join('\n');
  // 2) wrap root
  if (hasFlatList) {
    // root <View> ... last </View>  -> append nav before it
    const i = t.lastIndexOf('</View>');
    if (i === -1) { console.log('NO-VIEW:', f); continue; }
    t = t.slice(0, i) + '      <BottomNav />\n    ' + t.slice(i);
  } else {
    const open = t.indexOf('<ScrollView');
    const close = t.lastIndexOf('</ScrollView>');
    if (open === -1 || close === -1) { console.log('NO-SCROLL:', f); continue; }
    t = t.slice(0, open) + '<View style={{ flex: 1 }}>' + t.slice(open, close) + '</ScrollView><BottomNav /></View>' + t.slice(close + '</ScrollView>'.length);
  }
  fs.writeFileSync(f, t);
  ok++;
  console.log('wrapped:', f);
}
console.log(`\ndone: ${ok} wrapped`);
