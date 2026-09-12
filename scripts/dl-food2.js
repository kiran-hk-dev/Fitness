// Download remaining unviewed food photos for inspection.
const fs = require('fs');
const JOBS = {
  'food-dal': 'https://images.openfoodfacts.org/images/products/890/404/392/6216/front_en.5.400.jpg',
  'food-rajma': 'https://images.openfoodfacts.org/images/products/890/606/685/2206/front_en.3.400.jpg',
  'food-chole': 'https://images.openfoodfacts.org/images/products/890/600/881/5184/front_en.3.400.jpg',
  'food-paneer': 'https://images.openfoodfacts.org/images/products/890/126/218/0115/front_en.6.400.jpg',
  'food-buttermilk': 'https://images.openfoodfacts.org/images/products/890/126/220/2244/front_en.3.400.jpg',
  'food-nuts': 'https://images.openfoodfacts.org/images/products/000/002/081/6445/front_en.99.400.jpg',
  'food-ragi': 'https://images.openfoodfacts.org/images/products/890/600/835/0388/front_en.3.400.jpg',
};
async function main() {
  for (const [id, url] of Object.entries(JOBS)) {
    const r = await fetch(url, { headers: { 'User-Agent': 'FitLife360-audit/1.0' } });
    if (!r.ok) { console.log('HTTP', r.status, id); continue; }
    const buf = Buffer.from(await r.arrayBuffer());
    fs.writeFileSync(`C:/Users/Admin/AppData/Local/Temp/opencode/audit/${id}.jpg`, buf);
    console.log('saved', id, (buf.length / 1024).toFixed(0) + 'kb');
  }
}
main().catch((e) => console.log('FAILED:', e.message));
