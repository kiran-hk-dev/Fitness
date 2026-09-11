// Validates 0005 has no nested identical dollar-quote tags.
const fs = require('fs');
const t = fs.readFileSync('supabase/migrations/0005_retention.sql', 'utf8');
console.log('do $do$ blocks:', (t.match(/do \$do\$/g) || []).length);
console.log('leftover $$select:', (t.match(/\$\$select/g) || []).length);
console.log('$job$ tags:', (t.match(/\$job\$/g) || []).length);
console.log('end $do$:', (t.match(/end \$do\$;/g) || []).length);
// crude balance: every $tag$ must appear an even number of times
for (const tag of ['\\$do\\$', '\\$job\\$', '\\$\\$']) {
  const n = (t.match(new RegExp(tag, 'g')) || []).length;
  console.log(tag, 'count:', n, n % 2 === 0 ? '(balanced)' : '(UNBALANCED!)');
}
