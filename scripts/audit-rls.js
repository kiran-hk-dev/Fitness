// Audit: every public.* table must have RLS enabled + ≥1 policy.
const fs = require('fs');
const path = require('path');
const files = fs.readdirSync('supabase/migrations').filter((f) => f.endsWith('.sql')).sort();
let sql = '';
for (const f of files) sql += '\n' + fs.readFileSync(path.join('supabase/migrations', f), 'utf8');

const tables = new Set([...sql.matchAll(/create table if not exists public\.(\w+)/gi)].map((m) => m[1]));
// also tables referenced in policies
const rlsTables = new Set([...sql.matchAll(/alter table public\.(\w+) enable row level security/gi)].map((m) => m[1]));
const policies = {};
for (const m of sql.matchAll(/create policy "([^"]+)" on ([\w.]+)/gi)) {
  const t = m[2].replace('public.', '');
  policies[t] = policies[t] || [];
  policies[t].push(m[1]);
}
console.log('TABLES:', tables.size);
for (const t of [...tables].sort()) {
  const rls = rlsTables.has(t) ? 'RLS-ON ' : 'RLS-OFF!';
  const pol = (policies['public.' + t] || policies[t] || []).length;
  console.log(` ${rls} ${t}  policies:${pol} ${(policies['public.' + t] || policies[t] || []).join(' | ')}`);
}
// storage buckets + policies
console.log('\nBUCKETS:', [...sql.matchAll(/values \('([\w-]+)','([\w-]+)',\s*(true|false)\)/gi)].map((m) => `${m[1]}(public=${m[3]})`).join(', '));
console.log('STORAGE-POLICIES:', [...sql.matchAll(/create policy "([^"]+)" on storage\.objects/gi)].map((m) => m[1]).join(' | '));
