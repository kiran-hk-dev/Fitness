// Adds View to the react-native import wherever JSX uses it but import lacks it.
const fs = require('fs');
const path = require('path');
const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => {
  const p = path.join(d, e.name);
  if (e.isDirectory()) return walk(p);
  return p.endsWith('.tsx') ? [p] : [];
});
let fixed = 0;
for (const f of [...walk('app'), ...walk('src')]) {
  const t = fs.readFileSync(f, 'utf8');
  if (!/<View[\s>]/.test(t)) continue;
  const m = t.match(/import\s*\{([^}]+)\}\s*from\s*'react-native'/);
  if (!m) { console.log('NO-RN-IMPORT:', f); continue; }
  const names = m[1].split(',').map((s) => s.trim());
  if (names.includes('View')) continue;
  names.push('View');
  const next = t.replace(m[0], `import { ${names.join(', ')} } from 'react-native'`);
  fs.writeFileSync(f, next);
  fixed++;
  console.log('fixed import:', f);
}
console.log(`\ndone: ${fixed} imports fixed`);
