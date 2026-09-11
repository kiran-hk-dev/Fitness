// Collect every string that matches a real Ionicons glyph name (maps, props, vars).
const fs = require('fs');
const path = require('path');
const glyphs = new Set(Object.keys(require('@expo/vector-icons/build/vendor/react-native-vector-icons/glyphmaps/Ionicons.json')));
const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => {
  const p = path.join(d, e.name);
  if (e.isDirectory()) {
    if (['node_modules', '.expo', '.git'].includes(e.name)) return [];
    return walk(p);
  }
  return p.endsWith('.tsx') || p.endsWith('.ts') ? [p] : [];
});
const used = new Map();
for (const f of [...walk('app'), ...walk('src')]) {
  const t = fs.readFileSync(f, 'utf8');
  const re = /['`]([a-z][a-z0-9-]{2,})['`]/g;
  let m;
  while ((m = re.exec(t)) !== null) {
    if (glyphs.has(m[1])) {
      if (!used.has(m[1])) used.set(m[1], new Set());
      used.get(m[1]).add(f.replace(/\\/g, '/'));
    }
  }
}
for (const [n, files] of [...used.entries()].sort()) {
  console.log(n, ' x' + files.size);
}
console.log('TOTAL UNIQUE:', used.size);
