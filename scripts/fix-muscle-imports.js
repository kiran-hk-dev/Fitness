// Repair codemod fallout: Colors.<muscle> -> MuscleColor.<muscle> (+imports).
const fs = require('fs');
const FILES = [
  'app/yoga/active.tsx',
  'app/yoga/index.tsx',
  'app/yoga/[id].tsx',
  'src/components/ExerciseArt.tsx',
];
for (const f of FILES) {
  let t = fs.readFileSync(f, 'utf8');
  t = t.replace(/Colors\.mobility/g, 'MuscleColor.mobility');
  if (t.includes('MuscleColor.') && !/MuscleColor/.test(t.split('\n').find((l) => l.includes('src/theme') || l.includes('../theme')) || '')) {
    // extend existing theme import
    t = t.replace(/import\s*\{([^}]*)\}\s*from\s*(['"][^'"]*theme['"])/, (m, names, mod) => {
      const list = names.split(',').map((s) => s.trim()).filter(Boolean);
      if (!list.includes('MuscleColor')) list.push('MuscleColor');
      if (!list.includes('Colors')) list.unshift('Colors');
      return `import { ${list.join(', ')} } from ${mod}`;
    });
  }
  fs.writeFileSync(f, t);
  console.log('fixed:', f);
}
