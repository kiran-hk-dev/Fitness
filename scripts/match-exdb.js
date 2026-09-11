// Match our 18 local exercises to free-exercise-db folders.
const OURS = {
  'push-up': ['push-up', 'pushup'],
  'incline-push-up': ['incline push'],
  'db-press': ['dumbbell bench press', 'dumbbell press'],
  'band-row': ['band row', 'resistance band row', 'band bent-over row'],
  'db-row': ['one-arm dumbbell row', 'dumbbell row', 'bent over dumbbell row'],
  'lat-pulldown': ['lat pulldown', 'wide-grip lat pulldown'],
  'lateral-raise': ['lateral raise', 'side lateral'],
  'db-shoulder-press': ['dumbbell shoulder press', 'seated dumbbell press', 'arnold'],
  'db-curl': ['dumbbell bicep curl', 'dumbbell curl', 'incline dumbbell curl', 'hammer curl'],
  'cable-pressdown': ['triceps pushdown', 'cable pushdown', 'pushdown'],
  'dead-bug': ['dead bug'],
  'plank': ['plank'],
  'ab-wheel': ['ab roller', 'ab wheel'],
  'bodyweight-squat': ['bodyweight squat', 'squat'],
  'goblet-squat': ['goblet squat'],
  'rdl': ['romanian deadlift'],
  'walking': ['walk', 'treadmill'],
  'cat-cow': ['cat stretch', 'cat-cow', 'cat cow'],
};
async function main() {
  const r = await fetch('https://api.github.com/repos/yuhonas/free-exercise-db/contents/exercises?per_page=100', {
    headers: { 'User-Agent': 'fitlife360-probe', Accept: 'application/vnd.github+json' },
  });
  if (!r.ok) { console.log('listing HTTP', r.status); return; }
  const entries = await r.json();
  const folders = new Set(entries.filter((e) => e.type === 'dir').map((e) => e.name));
  console.log('total folders:', folders.size);
  for (const [ours, keys] of Object.entries(OURS)) {
    const hits = [];
    for (const f of folders) {
      const norm = f.toLowerCase().replace(/_/g, ' ');
      if (keys.some((k) => norm.includes(k))) hits.push(f);
    }
    console.log(ours, '=>', hits.slice(0, 6).join(' | ') || 'NO MATCH');
  }
  // yoga-ish
  const yogaKeys = ['warrior', 'cobra', 'bridge', 'boat', 'child', 'downward dog', 'mountain pose', 'triangle', 'plank'];
  console.log('--- yoga-ish folders ---');
  for (const f of folders) {
    const norm = f.toLowerCase().replace(/_/g, ' ');
    if (yogaKeys.some((k) => norm.includes(k))) console.log(' ', f);
  }
}
main().catch((e) => console.log('FAILED:', e.message));
