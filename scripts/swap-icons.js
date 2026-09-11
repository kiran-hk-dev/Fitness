// Replaces font-based Ionicons with font-free AppIcon across app/ + src/.
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

function relImport(file) {
  const parts = file.split(path.sep);
  if (parts[0] === 'app') return '../../src/components/AppIcon';
  if (parts[0] === 'src' && parts[1] === 'components') return './AppIcon';
  if (parts[0] === 'src') return '../components/AppIcon';
  return null;
}

let changed = 0;
for (const f of [...walk('app'), ...walk('src')]) {
  let t = fs.readFileSync(f, 'utf8');
  if (!t.includes('Ionicons')) continue;
  const orig = t;
  const needType = t.includes('Ionicons.glyphMap');
  // 1) JSX tags
  t = t.replace(/<Ionicons\b/g, '<AppIcon');
  t = t.replace(/<\/Ionicons>/g, '</AppIcon>');
  // 2) type refs
  t = t.replace(/keyof typeof Ionicons\.glyphMap/g, 'AppIconName');
  // 3) remove vector-icons imports, add AppIcon import
  const lines = t.split('\n');
  const kept = [];
  let hadVecImport = false;
  for (const l of lines) {
    if (/from '@expo\/vector-icons'/.test(l)) {
      hadVecImport = true;
      if (/^\s*import\s*\{\s*Ionicons\s*\}\s*from '@expo\/vector-icons';?\s*$/.test(l)) continue; // drop pure import
      console.log('COMPLEX-IMPORT (hand fix):', f, '::', l.trim());
      kept.push(l);
    } else kept.push(l);
  }
  t = kept.join('\n');
  if (hadVecImport || t.includes('<AppIcon')) {
    const needNames = ['AppIcon'];
    if (t.includes('AppIconName') && !/import\s*\{[^}]*AppIconName[^}]*\}\s*from/.test(t)) needNames.push('AppIconName');
    const rel = relImport(f);
    // merge into existing AppIcon import if present
    if (/from '[^']*components\/AppIcon'/.test(t)) {
      if (needNames.includes('AppIconName')) {
        t = t.replace(/import\s*\{([^}]*)\}\s*from\s*'([^']*components\/AppIcon)'/, (m, names, mod) => {
          const list = names.split(',').map((s) => s.trim()).filter(Boolean);
          if (!list.includes('AppIconName')) list.push('AppIconName');
          return `import { ${list.join(', ')} } from '${mod}'`;
        });
      }
    } else {
      const idx = t.split('\n').map((l, i) => (l.startsWith('import ') ? i : -1)).filter((i) => i >= 0).pop();
      const arr = t.split('\n');
      arr.splice(idx + 1, 0, `import { ${needNames.join(', ')} } from '${rel}';`);
      t = arr.join('\n');
    }
  }
  // 4) Ionicons.font static (root layout) -> drop (no font needed anymore)
  t = t.replace(/.*Ionicons\.font.*\n/g, '');
  if (t !== orig) {
    fs.writeFileSync(f, t);
    changed++;
    console.log('swapped:', f);
  }
}
console.log(`\ndone: ${changed} files`);
// report any leftover Ionicons references
const { execSync } = require('child_process');
try {
  const out = execSync('git diff --stat 2>NUL || echo nogit', { encoding: 'utf8' });
} catch {}
for (const f of [...walk('app'), ...walk('src')]) {
  const t = fs.readFileSync(f, 'utf8');
  if (/Ionicons/.test(t)) console.log('LEFTOVER Ionicons in:', f);
}
