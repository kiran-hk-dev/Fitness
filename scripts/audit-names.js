// For every mapped photo folder, compare the DB's official name/muscles
// against OUR exercise/pose name. Flags mismatches for human review.
const fs = require('fs');

function ours() {
  const ex = fs.readFileSync('src/data/exercises.ts', 'utf8');
  const ym = fs.readFileSync('src/data/exerciseMedia.ts', 'utf8');
  const yoga = fs.readFileSync('src/data/yoga.ts', 'utf8');
  // our exerciseId -> folder
  const photoMap = {};
  const m = ym.match(/EXERCISE_PHOTOS: Record<string, ExercisePhotos> = \{([\s\S]*?)\};/);
  for (const mm of m[1].matchAll(/'([\w-]+)': F\('([\w-]+)'\)/g)) photoMap[mm[1]] = mm[2];
  const ymap = {};
  const y = ym.match(/YOGA_PHOTOS: Record<string, ExercisePhotos> = \{([\s\S]*?)\};/);
  for (const mm of y[1].matchAll(/'([\w-]+)': F\('([\w-]+)'\)/g)) ymap[mm[1]] = mm[2];
  // our names
  const exNames = {};
  for (const mm of ex.matchAll(/id:\s*'([\w-]+)', name: '([^']+)'/g)) exNames[mm[1]] = mm[2];
  const poseNames = {};
  for (const mm of yoga.matchAll(/\{\s*id:\s*'([\w-]+)', name: '([^']+)'/g)) poseNames[mm[1]] = mm[2];
  return { photoMap, ymap, exNames, poseNames };
}

const norm = (s) => s.toLowerCase().replace(/[^a-z]/g, '');
function overlap(a, b) {
  // share at least one significant word (>=4 chars)?
  const wa = new Set(norm(a).length ? a.toLowerCase().split(/[\s_-]+/).filter((w) => w.length >= 4) : []);
  const wb = new Set(b.toLowerCase().split(/[\s_-]+/).filter((w) => w.length >= 4));
  for (const w of wa) if ([...wb].some((v) => v.includes(w) || w.includes(v))) return w;
  return null;
}

async function official(folder) {
  // official folder list has <Folder>.json next to <Folder>/ dir
  const r = await fetch(`https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/${folder}.json`, {
    headers: { 'User-Agent': 'FitLife360-audit/1.0' },
  });
  if (!r.ok) return null;
  const j = await r.json();
  return { name: j.name, muscles: (j.primaryMuscles || []).join(','), level: j.level };
}

async function main() {
  const { photoMap, ymap, exNames, poseNames } = ours();
  console.log('== EXERCISES ==');
  for (const [id, folder] of Object.entries(photoMap)) {
    const off = await official(folder);
    const oursName = exNames[id] || '?';
    if (!off) { console.log(`NOJSON  ${id} (${oursName}) <- ${folder}`); continue; }
    const hit = overlap(oursName, off.name) || overlap(id, off.name);
    console.log(`${hit ? 'ok     ' : 'REVIEW '} ${id} ("${oursName}") <- ${folder} ("${off.name}" ${off.muscles})${hit ? '' : '  ~shared word: none'}`);
    await new Promise((r) => setTimeout(r, 150));
  }
  console.log('== YOGA ==');
  for (const [id, folder] of Object.entries(ymap)) {
    const off = await official(folder);
    const oursName = poseNames[id] || '?';
    if (!off) { console.log(`NOJSON  ${id} (${oursName}) <- ${folder}`); continue; }
    const hit = overlap(oursName, off.name) || overlap(id, off.name);
    console.log(`${hit ? 'ok     ' : 'REVIEW '} ${id} ("${oursName}") <- ${folder} ("${off.name}" ${off.muscles})`);
    await new Promise((r) => setTimeout(r, 150));
  }
}
main().catch((e) => console.log('FAILED:', e.message));
