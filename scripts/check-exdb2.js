// Inspect one exercise entry: JSON fields + image files.
async function gh(path) {
  const r = await fetch('https://api.github.com/repos/yuhonas/free-exercise-db/contents/' + path, {
    headers: { 'User-Agent': 'fitlife360-probe', Accept: 'application/vnd.github+json' },
  });
  if (!r.ok) { console.log(path, '-> HTTP', r.status); return null; }
  return r.json();
}
async function main() {
  const folder = await gh('exercises/Ab_Roller');
  if (folder) console.log('Ab_Roller/:', folder.map((e) => e.name).join('  '));
  const r = await fetch('https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Ab_Roller.json', {
    headers: { 'User-Agent': 'fitlife360-probe' },
  });
  const j = await r.json();
  console.log('JSON keys:', Object.keys(j).join(', '));
  console.log(JSON.stringify(j, null, 1).slice(0, 900));
}
main().catch((e) => console.log('FAILED:', e.message));
