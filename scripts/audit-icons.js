// Audit v2: only Ionicons name= props (not route names).
const fs = require('fs');
const path = require('path');
const glyphs = require('@expo/vector-icons/build/vendor/react-native-vector-icons/glyphmaps/Ionicons.json');
const names = new Set(Object.keys(glyphs));

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
    if (!used.has(m[1])) used.set(m[1], []);
    used.get(m[1]).push(f);
  }
}
let bad = 0;
for (const [n, files] of [...used.entries()].sort()) {
  if (!names.has(n)) {
    bad++;
    console.log('MISSING:', n, ' used in:', [...new Set(files)].join(', '));
  }
}
console.log(`\nchecked ${used.size} Ionicons names: ${bad === 0 ? 'ALL EXIST' : bad + ' MISSING'}`);
