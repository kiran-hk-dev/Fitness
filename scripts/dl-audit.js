// Downloads photos for visual inspection into the temp dir.
const fs = require('fs');
const path = require('path');
const OUT = 'C:\\Users\\Admin\\AppData\\Local\\Temp\\opencode\\audit';
fs.mkdirSync(OUT, { recursive: true });

const EX_FOLDERS = [
  'Pushups', 'Plank', 'Seated_Cable_Rows', 'Jogging_Treadmill', 'Side_Bridge',
  'Butt_Lift_Bridge', 'Cat_Stretch', 'Childs_Pose', 'Ab_Roller', 'Dead_Bug',
  'Romanian_Deadlift', 'Goblet_Squat', 'Dumbbell_Bench_Press',
];
const FOOD_URLS = {
  dosa: 'https://images.openfoodfacts.org/images/products/890/602/058/0015/front_en.8.400.jpg',
  oats: 'https://images.openfoodfacts.org/images/products/541/118/812/4689/front_en.486.400.jpg',
  poha: 'https://images.openfoodfacts.org/images/products/890/336/300/2853/front_en.3.400.jpg',
  upma: 'https://images.openfoodfacts.org/images/products/890/104/296/8940/front_en.14.400.jpg',
  idli: 'https://images.openfoodfacts.org/images/products/890/124/220/2608/front_en.5.400.jpg',
  chana: 'https://images.openfoodfacts.org/images/products/890/404/392/6308/front_en.3.400.jpg',
};

async function dl(url, file) {
  const r = await fetch(url, { headers: { 'User-Agent': 'FitLife360-audit/1.0' } });
  if (!r.ok) { console.log('HTTP', r.status, url); return; }
  const buf = Buffer.from(await r.arrayBuffer());
  fs.writeFileSync(path.join(OUT, file), buf);
  console.log('saved', file, (buf.length / 1024).toFixed(0) + 'kb');
}
async function main() {
  for (const f of EX_FOLDERS) {
    await dl(`https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/${f}/0.jpg`, `${f}-0.jpg`);
    await dl(`https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/${f}/1.jpg`, `${f}-1.jpg`);
  }
  for (const [id, url] of Object.entries(FOOD_URLS)) {
    await dl(url, `food-${id}.jpg`);
  }
  console.log('done ->', OUT);
}
main().catch((e) => console.log('FAILED:', e.message));
