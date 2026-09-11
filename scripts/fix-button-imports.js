// Ensures ActionCard import where used; drops PrimaryButton/GhostButton when unused.
const fs = require('fs');
const FILES = [
  'app/yoga/history.tsx',
  'app/workouts/summary.tsx',
  'app/(auth)/welcome.tsx',
  'app/(auth)/login.tsx',
  'app/workouts/library.tsx',
  'app/nutrition/search.tsx',
  'app/yoga/index.tsx',
];
for (const f of FILES) {
  const lines = fs.readFileSync(f, 'utf8').split('\n');
  const idx = lines.findIndex((l) => /components\/ui'/.test(l) && l.startsWith('import '));
  if (idx === -1) { console.log('NO-UI-IMPORT:', f); continue; }
  const m = lines[idx].match(/import\s*\{([^}]*)\}\s*from\s*('[^']*')/);
  if (!m) { console.log('MULTILINE-IMPORT:', f); continue; }
  let names = m[1].split(',').map((s) => s.trim()).filter(Boolean);
  const body = lines.filter((_, i) => i !== idx).join('\n');
  const uses = (n) => body.includes('<' + n);
  if (uses('ActionCard') && !names.includes('ActionCard')) names.push('ActionCard');
  for (const n of ['PrimaryButton', 'GhostButton']) {
    if (!uses(n) && names.includes(n)) names = names.filter((x) => x !== n);
  }
  lines[idx] = `import { ${names.join(', ')} } from ${m[2]};`;
  fs.writeFileSync(f, lines.join('\n'));
  console.log('imports ok:', f, '->', names.join(','));
}
