// List every Ionicons name= used in app/src.
const fs = require('fs');
const path = require('path');
const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => {
  const p = path.join(d, e.name);
  if (e.isDirectory()) {
    if (['node_modules', '.expo', '.git'].includes(e.name)) return [];
    return walk(p);
  }
  return p.endsWith('.tsx') ? [p] : [];
});
const used = new Map();
for (const f of [...walk('app'), ...walk('src')]) {
  const t = fs.readFileSync(f, 'utf8');
  if (!t.includes('@expo/vector-icons')) continue;
  const re = /<Ionicons\b[^>]*?\bname=\{?["`]([A-Za-z0-9-]+)["`]\}?/g;
  let m;
  while ((m = re.exec(t)) !== null) {
    if (!used.has(m[1])) used.set(m[1], new Set());
    used.get(m[1]).add(f.replace(/\\/g, '/'));
  }
}
for (const [n, files] of [...used.entries()].sort()) {
  console.log(n, '  x' + files.size);
}
console.log('TOTAL UNIQUE:', used.size);
