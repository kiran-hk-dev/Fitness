// One-off audit: every named import from src/utils/* must exist in that module.
const fs = require('fs');
const path = require('path');

const exp = {};
for (const f of ['src/utils/nutrition.ts', 'src/utils/safety.ts', 'src/utils/hydration.ts', 'src/utils/progression.ts', 'src/utils/format.ts']) {
  const t = fs.readFileSync(f, 'utf8');
  const s = new Set();
  const re = /export\s+(?:const|function|class|interface|type)\s+(\w+)/g;
  let m;
  while ((m = re.exec(t)) !== null) s.add(m[1]);
  exp[path.basename(f, '.ts')] = s;
}

const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => {
  const p = path.join(d, e.name);
  if (e.isDirectory()) return walk(p);
  return p.endsWith('.tsx') || p.endsWith('.ts') ? [p] : [];
});

let bad = 0;
for (const f of [...walk('app'), ...walk('src')]) {
  const t = fs.readFileSync(f, 'utf8');
  const re = /import\s*\{([^}]+)\}\s*from\s*['"]([^'"]*utils\/(nutrition|safety|hydration|progression|format))['"]/g;
  let m;
  while ((m = re.exec(t)) !== null) {
    const mod = m[3];
    for (const n of m[1].split(',').map((s) => s.trim()).filter(Boolean)) {
      if (!exp[mod].has(n)) { console.log('BAD:', f, '->', n, 'not exported by utils/' + mod); bad++; }
    }
  }
}
console.log(bad === 0 ? 'all util imports OK' : bad + ' bad imports found');
