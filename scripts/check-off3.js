// Final retry for 3 missing staples (2s spacing to dodge rate limits).
const FOODS = {
  upma: 'MTR upma', rice: 'india gate basmati rice', buttermilk: 'amul chaas',
};
async function one(id, term) {
  try {
    const u = `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(term)}&search_simple=1&action=process&json=1&page_size=10`;
    const r = await fetch(u, { headers: { 'User-Agent': 'FitLife360/1.0' } });
    const j = await r.json();
    const prods = (j.products || []).filter((p) => p.image_url);
    const hit = prods.find((p) => (p.code || '').startsWith('890')) || prods[0];
    if (hit) console.log(`OK    ${id} | ${hit.code} | ${(hit.product_name || '?').slice(0, 45)} | ${hit.image_url}`);
    else console.log(`MISS  ${id} | no image result`);
  } catch (e) { console.log(`ERR   ${id} | ${e.message.slice(0, 60)}`); }
}
async function main() {
  for (const [id, term] of Object.entries(FOODS)) {
    await one(id, term);
    await new Promise((r) => setTimeout(r, 2000));
  }
}
main().catch((e) => console.log('FAILED:', e.message));
