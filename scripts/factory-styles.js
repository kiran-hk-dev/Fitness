// Codemod: module-level `const styles = StyleSheet.create({...Colors...})`
// becomes `const useStyles = () => StyleSheet.create({...})` so colors are
// read fresh on every render (instant theme switching, no reload).
// Only touches files with EXACTLY ONE styles block that references Colors.
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

const DECL = /^const styles = StyleSheet\.create\(\{$/m;
let done = 0;
const skipped = [];
for (const f of [...walk('app'), ...walk('src')]) {
  const t = fs.readFileSync(f, 'utf8');
  const hits = t.match(/^const styles = StyleSheet\.create\(\{$/gm) || [];
  if (hits.length !== 1) {
    if (hits.length > 1) skipped.push(`${f} (${hits.length} blocks)`);
    continue;
  }
  const start = t.indexOf(hits[0]);
  // block must reference Colors. AFTER its declaration
  if (!t.slice(start).includes('Colors.')) continue;
  let out = t.replace(DECL, 'const useStyles = () => StyleSheet.create({');
  out = out.replace(/\bstyles\b/g, 'useStyles()');
  // fix accidental double-call from the declaration line itself? (none: decl had no `styles` word besides name)
  fs.writeFileSync(f, out);
  done++;
  console.log('factory:', f);
}
console.log(`\ndone: ${done} converted`);
if (skipped.length) console.log('NEEDS-HAND-REVIEW:\n' + skipped.join('\n'));
