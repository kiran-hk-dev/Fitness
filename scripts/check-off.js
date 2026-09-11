// Probe Open Food Facts for real photos of our 22 diet items.
const FOODS = {
  idli: 'idli mix', dosa: 'dosa mix', upma: 'upma mix', poha: 'poha flattened rice',
  chapati: 'whole wheat atta', rice: 'basmati rice', dal: 'toor dal',
  rajma: 'rajma kidney beans', chole: 'kabuli chana chickpeas', paneer: 'paneer',
  egg: 'eggs', chicken: 'chicken curry', fish: 'fish curry', curd: 'curd dahi',
  buttermilk: 'buttermilk', oats: 'oats', sprouts: 'sprouts',
  chana: 'roasted chana', nuts: 'mixed nuts', banana: 'banana', ragi: 'ragi malt',
};
async function one(id, term) {
  try {
    const u = `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(term)}&search_simple=1&action=process&json=1&page_size=4`;
    const r = await fetch(u, { headers: { 'User-Agent': 'FitLife360/1.0' } });
    const j = await r.json();
    const hit = (j.products || []).find((p) => p.image_url);
    if (hit) console.log(`OK    ${id} | ${(hit.product_name || '?').slice(0, 45)} | ${hit.image_url}`);
    else console.log(`MISS  ${id} | no image result`);
  } catch (e) { console.log(`ERR   ${id} | ${e.message}`); }
}
async function main() {
  for (const [id, term] of Object.entries(FOODS)) {
    await one(id, term);
    await new Promise((r) => setTimeout(r, 400)); // be polite to the free API
  }
}
main().catch((e) => console.log('FAILED:', e.message));
