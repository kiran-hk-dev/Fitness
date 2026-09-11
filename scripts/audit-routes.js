// Audit: every router.push/replace('/...') target must map to a real file.
const fs = require('fs');
const path = require('path');

function routeToFile(route) {
  let r = route.split('?')[0];
  if (r === '/') r = '/index';
  const segs = r.split('/').filter(Boolean);
  const base = 'app';
  const tryPaths = [];
  tryPaths.push(path.join(base, ...segs) + '.tsx');           // file
  tryPaths.push(path.join(base, ...segs, 'index.tsx'));       // dir index
  tryPaths.push(path.join(base, ...segs, '_layout.tsx'));     // group layout
  if (segs.length > 1) {
    tryPaths.push(path.join(base, ...segs.slice(0, -1), '[id].tsx')); // dynamic
  }
  return { hit: tryPaths.find((p) => fs.existsSync(p)) || null };
}

const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => {
  const p = path.join(d, e.name);
  if (e.isDirectory()) return walk(p);
  return p.endsWith('.tsx') ? [p] : [];
});

let bad = 0, total = 0;
for (const f of [...walk('app'), ...walk('src')]) {
  const t = fs.readFileSync(f, 'utf8');
  const re = /router\.(push|replace)\(\s*[`'"]([^`'"]+)[`'"]/g;
  let m;
  while ((m = re.exec(t)) !== null) {
    let route = m[2];
    if (route.includes('${')) {
      // dynamic: check the static prefix dir/file exists (ignore ?query)
      const prefix = route.split('?')[0].split('${')[0].replace(/\/$/, '');
      const clean = prefix.replace(/^\//, '');
      const dirHit = fs.existsSync(path.join('app', clean)) ||
        fs.existsSync(path.join('app', clean) + '.tsx') ||
        fs.existsSync(path.join('app', clean, 'index.tsx')) ||
        fs.existsSync(path.join('app', path.dirname(clean), '[id].tsx'));
      total++;
      if (!dirHit) { console.log('BAD(dynamic):', f, '->', route); bad++; }
      continue;
    }
    total++;
    const { hit } = routeToFile(route);
    if (!hit) { console.log('BAD:', f, '->', route); bad++; }
  }
}
console.log(`\nchecked ${total} navigations: ${bad === 0 ? 'ALL ROUTES OK' : bad + ' BROKEN'}`);
