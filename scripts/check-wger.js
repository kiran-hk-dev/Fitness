// One-off check: does the free wger API give us real exercise photos?
async function main() {
  // 1) search exercises
  let r = await fetch('https://wger.de/api/v2/exercise/?language=2&limit=5&search=push');
  console.log('exercise search HTTP:', r.status);
  const j = await r.json();
  const first = j.results && j.results[0];
  console.log('count:', j.count, '| first:', first && (first.id + ' / ' + (first.name || first.uuid)));

  // 2) images for that exercise
  if (first) {
    r = await fetch(`https://wger.de/api/v2/exerciseimage/?exercise=${first.id}&limit=5`);
    console.log('image HTTP:', r.status);
    const imgs = await r.json();
    console.log('images:', imgs.count);
    for (const im of (imgs.results || []).slice(0, 3)) console.log(' -', im.image);
  }

  // 3) ingredient (food photo) check
  r = await fetch('https://wger.de/api/v2/ingredient/?limit=3&search=rice');
  console.log('ingredient HTTP:', r.status);
  const ing = await r.json();
  for (const g of (ing.results || []).slice(0, 3)) console.log(' -', g.name, '|', g.image || '(no image)');
}
main().catch((e) => console.log('FAILED:', e.message));
