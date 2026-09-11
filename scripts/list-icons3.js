// Precise: icon names from icon= props, Ionicons name=, and ICONS/TABS maps.
const fs = require('fs');
const path = require('path');
const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => {
  const p = path.join(d, e.name);
  if (e.isDirectory()) {
    if (['node_modules', '.expo', '.git'].includes(e.name)) return [];
    return walk(p);
  }
  return p.endsWith('.tsx') || p.endsWith('.ts') ? [p] : [];
});
const used = new Set();
const dynamic = new Set();
for (const f of [...walk('app'), ...walk('src')]) {
  const t = fs.readFileSync(f, 'utf8');
  // icon="name" / icon='name' props
  for (const m of t.matchAll(/\bicon=\{?["`]([A-Za-z0-9-]+)["`]\}?/g)) used.add(m[1]);
  // Ionicons name= (static handled above too, plus dynamic markers)
  for (const m of t.matchAll(/<Ionicons\b[^>]*?name=\{([^}>]+)\}/g)) dynamic.add(m[1].trim().slice(0, 60));
  // map values like: index: { on: 'home', off: 'home-outline' } and icon: 'home'
  for (const m of t.matchAll(/(?:on|off|icon):\s*['`]([A-Za-z0-9-]+)['`]/g)) used.add(m[1]);
}
console.log('STATIC:', [...used].sort().join('\n'));
console.log('DYNAMIC:', [...dynamic].join(' | '));
console.log('TOTAL STATIC:', used.size);
