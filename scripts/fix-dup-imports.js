// Remove duplicate theme imports left by the codemod.
const fs = require('fs');
const path = require('path');
const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => {
  const p = path.join(d, e.name);
  if (e.isDirectory()) {
    if (['node_modules', '.expo', '.git'].includes(e.name)) return [];
    return walk(p);
  }
  return p.endsWith('.ts') || p.endsWith('.tsx') ? [p] : [];
});
let fixed = 0;
for (const f of [...walk('app'), ...walk('src')]) {
  const lines = fs.readFileSync(f, 'utf8').split('\n');
  const themeIdx = lines
    .map((l, i) => (/from\s*['"][^'"]*theme['"]/.test(l) ? i : -1))
    .filter((i) => i >= 0);
  if (themeIdx.length < 2) continue;
  // merge all theme imports into the first, drop the rest
  const names = new Set();
  for (const i of themeIdx) {
    const m = lines[i].match(/import\s*\{([^}]*)\}/);
    if (m) m[1].split(',').map((s) => s.trim()).filter(Boolean).forEach((n) => names.add(n));
  }
  const mod = lines[themeIdx[0]].match(/from\s*(['"][^'"]*['"])/)[1];
  const merged = `import { ${[...names].join(', ')} } from ${mod};`;
  const out = lines.filter((_, i) => !themeIdx.slice(1).includes(i));
  out[themeIdx[0]] = merged;
  fs.writeFileSync(f, out.join('\n'));
  fixed++;
  console.log('merged:', f);
}
console.log(`\ndone: ${fixed} files`);
