// Full recursive tree (contents API truncates at 1000) -> find exact folders.
const WANT = ['plank', 'romanian', 'deadlift', 'pushdown', 'pulldown', 'pull-up', 'chin', 'dip',
  'curl', 'press', 'squat', 'lunge', 'raise', 'crunch', 'bird', 'cobra', 'warrior', 'bridge',
  'child', 'mountain', 'burpee', 'jack', 'calf', 'thrust', 'face_pull', 'face pull', 'skull',
  'preacher', 'russian', 'hanging', 'knee_raise', 'leg_raise', 'glute', 'band', 'cable_row',
  'seated_row', 't-bar', 'row', 'dog', 'pigeon', 'triangle', 'tree', 'chair', 'eagle', 'bow'];
async function main() {
  const r = await fetch('https://api.github.com/repos/yuhonas/free-exercise-db/git/trees/main?recursive=1', {
    headers: { 'User-Agent': 'fitlife360-probe', Accept: 'application/vnd.github+json' },
  });
  if (!r.ok) { console.log('tree HTTP', r.status); return; }
  const j = await r.json();
  const dirs = new Set(j.tree.filter((e) => e.type === 'tree' && e.path.startsWith('exercises/')).map((e) => e.path.slice(10)));
  console.log('exercise folders total:', dirs.size, '| truncated:', j.truncated);
  const shown = new Set();
  for (const w of WANT) {
    const key = w.replace(/_/g, ' ');
    for (const d of dirs) {
      const norm = d.toLowerCase().replace(/_/g, ' ');
      if (norm.includes(key) && !shown.has(d)) { console.log(w, '=>', d); shown.add(d); }
    }
  }
}
main().catch((e) => console.log('FAILED:', e.message));
