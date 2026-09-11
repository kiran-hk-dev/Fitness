// Stats: element types + fill/stroke usage across needed SVGs.
const fs = require('fs');
const path = require('path');
const DIR = 'node_modules/ionicons/dist/svg';
const NEED = [
  'add', 'add-circle-outline', 'alert-circle', 'arrow-forward', 'bar-chart-outline',
  'barbell', 'barbell-outline', 'basket-outline', 'body-outline', 'calendar-outline',
  'camera-outline', 'cart-outline', 'checkmark', 'checkmark-circle',
  'checkmark-circle-outline', 'checkmark-done', 'chevron-forward', 'clipboard-outline',
  'close', 'close-circle-outline', 'cloud-offline-outline', 'cloud-outline',
  'cloud-upload-outline', 'download-outline', 'egg-outline', 'ellipse',
  'ellipse-outline', 'fitness-outline', 'heart-outline', 'home', 'home-outline',
  'images-outline', 'information-circle', 'layers-outline', 'leaf-outline',
  'list-outline', 'log-out-outline', 'nutrition', 'nutrition-outline',
  'pause-circle-outline', 'people-outline', 'person', 'person-outline',
  'pie-chart-outline', 'pizza-outline', 'play', 'receipt-outline',
  'refresh-outline', 'repeat-outline', 'restaurant-outline', 'scale-outline',
  'search', 'search-outline', 'share-social-outline', 'speedometer-outline',
  'stats-chart', 'stats-chart-outline', 'sunny-outline', 'time-outline',
  'today-outline', 'trash', 'trash-outline', 'trending-up-outline',
  'trophy-outline', 'walk-outline', 'water-outline',
  'log-in-outline', 'person-add-outline', 'mail-outline', 'send',
];
const els = {}, fills = {}, strokes = {};
let strokeFiles = [];
for (const n of NEED) {
  const t = fs.readFileSync(path.join(DIR, n + '.svg'), 'utf8');
  const inner = t.replace(/<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '');
  for (const m of inner.matchAll(/<(\w+)([^>]*)\/?>/g)) {
    els[m[1]] = (els[m[1]] || 0) + 1;
    const fm = m[2].match(/fill="([^"]*)"/);
    if (fm) fills[fm[1]] = (fills[fm[1]] || 0) + 1;
    else fills['(absent)'] = (fills['(absent)'] || 0) + 1;
    const sm = m[2].match(/stroke="([^"]*)"/);
    if (sm) { strokes[sm[1]] = (strokes[sm[1]] || 0) + 1; if (!strokeFiles.includes(n)) strokeFiles.push(n); }
  }
  if (/<(defs|linearGradient|radialGradient|style|title|mask|clipPath)/.test(inner)) console.log('COMPLEX:', n);
}
console.log('elements:', JSON.stringify(els));
console.log('fills:', JSON.stringify(fills));
console.log('strokes:', JSON.stringify(strokes), strokeFiles.join(','));
