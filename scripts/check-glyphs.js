const fs = require('fs');
const t = fs.readFileSync('src/components/AppIcon.tsx', 'utf8');
for (const n of ['eye-outline', 'eye-off-outline', 'add-circle', 'search-outline']) {
  console.log(n + ':', t.includes(n) ? 'present' : 'MISSING');
}
