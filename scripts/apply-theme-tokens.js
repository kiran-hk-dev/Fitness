// Codemod: hardcoded dark-theme hexes -> Colors.* tokens (enables multi-theme).
// Skips: src/theme/** (definitions), scripts/**, non-TS files.
const fs = require('fs');
const path = require('path');

const MAP = [
  ['0E0E12', 'Colors.bg'],
  ['0E1628', 'Colors.bgSoft'],
  ['17171D', 'Colors.bgSoft'],
  ['1A1A22', 'Colors.card'],
  ['232329', 'Colors.raised'],
  ['2B2B33', 'Colors.border'],
  ['FAFAF8', 'Colors.text'],
  ['FFFFFF', 'Colors.text'],
  ['475569', 'Colors.faint'],
  ['55555F', 'Colors.faint'],
  ['A7A7B3', 'Colors.muted'],
];

const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => {
  const p = path.join(d, e.name);
  if (e.isDirectory()) {
    if (['node_modules', '.expo', '.git', 'scripts', 'assets'].includes(e.name)) return [];
    return walk(p);
  }
  return p.endsWith('.ts') || p.endsWith('.tsx') ? [p] : [];
});

const roots = ['app', 'src'].filter((d) => fs.existsSync(d));
let files = [];
for (const r of roots) files.push(...walk(r));
files = files.filter((f) => !f.includes(`src${path.sep}theme${path.sep}`) && !f.includes('scripts'));

let touched = 0;
for (const f of files) {
  let t = fs.readFileSync(f, 'utf8');
  const orig = t;
  for (const [hex, token] of MAP) {
    // 'HEX' or "HEX" (exact length, quote-bounded) -> token
    t = t.replace(new RegExp(`(['"])#${hex}\\1`, 'g'), token);
  }
  // 3-digit white
  t = t.replace(/(['"])#fff\1/gi, (m, q) => (q === '"' ? '{Colors.text}' : 'Colors.text'));
  // placeholder gray -> muted (prop form gets braces)
  t = t.replace(/(['"])#888\1/g, (m, q) => (q === '"' ? '{Colors.muted}' : 'Colors.muted'));
  // scrim rgba
  t = t.replace(/(['"])rgba\(11,18,32,0\.85\)\1/g, 'Colors.scrim');
  if (t !== orig) {
    // ensure Colors import
    if (t.includes('Colors.') && !/from\s*['"][^'"]*src\/theme['"]/.test(t)) {
      const rel = f.startsWith('app' + path.sep) ? '../../src/theme' : '../theme';
      const lines = t.split('\n');
      let lastImport = -1;
      lines.forEach((l, i) => { if (l.startsWith('import ')) lastImport = i; });
      lines.splice(lastImport + 1, 0, `import { Colors } from '${rel}';`);
      t = lines.join('\n');
    }
    fs.writeFileSync(f, t);
    touched++;
  }
}
console.log(`tokenized ${touched} files`);
