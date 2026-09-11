// Check every needed icon has an official SVG in ionicons@7.
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
let missing = [];
for (const n of NEED) {
  if (!fs.existsSync(path.join(DIR, n + '.svg'))) { missing.push(n); console.log('MISSING SVG:', n); }
}
console.log(`\n${NEED.length - missing.length}/${NEED.length} available`);
// show sample structure
const sample = fs.readFileSync(path.join(DIR, 'home.svg'), 'utf8');
console.log('\nsample home.svg:', sample.slice(0, 300));
