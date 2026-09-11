// Probe the free-exercise-db repo structure (MIT licensed, real demo images).
async function gh(path) {
  const r = await fetch('https://api.github.com/repos/yuhonas/free-exercise-db/contents/' + path, {
    headers: { 'User-Agent': 'fitlife360-probe', Accept: 'application/vnd.github+json' },
  });
  if (!r.ok) { console.log(path, '-> HTTP', r.status); return null; }
  return r.json();
}
async function main() {
  const root = await gh('');
  if (root) console.log('ROOT:', root.map((e) => e.name + (e.type === 'dir' ? '/' : '')).join('  '));
  const ex = await gh('exercises');
  if (ex) {
    console.log('exercises/ sample:', ex.slice(0, 8).map((e) => e.name).join('  '));
    console.log('total entries:', ex.length);
  }
}
main().catch((e) => console.log('FAILED:', e.message));
