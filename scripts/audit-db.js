// Audit: every supabase.from('T') + column refs must exist in migrations schema.
const fs = require('fs');
const path = require('path');

// ---- 1. build schema from migrations ----
const migDir = 'supabase/migrations';
let sql = fs.readdirSync(migDir).filter((f) => f.endsWith('.sql')).sort()
  .map((f) => fs.readFileSync(path.join(migDir, f), 'utf8')).join('\n');
sql += '\n' + (fs.existsSync('supabase/seed.sql') ? '' : '');

const schema = {}; // table -> Set(columns)
// CREATE TABLE blocks (balance parens)
const creRe = /create table if not exists public\.(\w+)\s*\(/gi;
let cm;
while ((cm = creRe.exec(sql)) !== null) {
  const table = cm[1];
  let depth = 0, i = creRe.lastIndex - 1, body = '';
  for (; i < sql.length; i++) {
    const ch = sql[i];
    if (ch === '(') depth++;
    else if (ch === ')') { depth--; if (depth === 0) break; }
    body += ch;
  }
  const cols = new Set();
  let cur = '', d2 = 0;
  const parts = [];
  for (const ch of body.slice(1)) {
    if (ch === '(') d2++;
    if (ch === ')') d2--;
    if (ch === ',' && d2 === 0) { parts.push(cur); cur = ''; } else cur += ch;
  }
  if (cur.trim()) parts.push(cur);
  for (const p of parts) {
    const name = p.trim().split(/\s+/)[0].replace(/["`]/g, '');
    if (!/^(primary|foreign|check|unique|constraint)$/i.test(name)) cols.add(name);
  }
  schema[table] = cols;
}
// ALTER TABLE ... ADD COLUMN IF NOT EXISTS col
for (const m of sql.matchAll(/alter table public\.(\w+)\s+add column if not exists (\w+)/gi)) {
  if (schema[m[1]]) schema[m[1]].add(m[2]);
}
console.log('schema tables:', Object.keys(schema).length);

// ---- 2. scan app/src queries ----
const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => {
  const p = path.join(d, e.name);
  if (e.isDirectory()) {
    if (['node_modules', '.expo', '.git'].includes(e.name)) return [];
    return walk(p);
  }
  return p.endsWith('.ts') || p.endsWith('.tsx') ? [p] : [];
});

let badT = 0, badC = 0;
const seenTables = new Set();
for (const f of [...walk('app'), ...walk('src')]) {
  const t = fs.readFileSync(f, 'utf8');
  const fre = /\.from\('([\w-]+)'\)/g;
  let fm;
  while ((fm = fre.exec(t)) !== null) {
    const table = fm[1];
    seenTables.add(table);
    if (table === 'storage') continue;
    if (!schema[table]) { console.log(`BAD-TABLE ${f}: ${table}`); badT++; continue; }
    // find chained call span: next ~600 chars for column refs
    const span = t.slice(fm.index, fm.index + 900);
    const cols = schema[table];
    const check = (col, ctx) => {
      if (!col || ['*', 'id'].includes(col)) { if (col === 'id' && !cols.has('id')) { console.log(`BAD-COL ${f}: ${table}.${col} (${ctx})`); badC++; } return; }
      if (!cols.has(col)) { console.log(`BAD-COL ${f}: ${table}.${col} (${ctx})`); badC++; }
    };
    // .select('a,b') / .select("*")
    for (const sm of span.matchAll(/\.select\('([^']*)'\)/g)) {
      if (sm[1].trim() === '*') continue;
      for (const c of sm[1].split(',')) check(c.trim(), 'select');
    }
    // .eq/.neq/.gt/.gte/.lt/.lte/.like/.ilike/.order('col'
    for (const sm of span.matchAll(/\.(eq|neq|gt|gte|lt|lte|like|ilike|order)\('([^']*)'/g)) check(sm[2], sm[1]);
    // .insert({ / .update({ / .upsert({ -> keys at depth 1 (best effort: identifiers before : on lines)
    for (const sm of span.matchAll(/\.(insert|update|upsert)\(\{/g)) {
      let d3 = 0, j = sm.index + sm[0].length - 1, inner = '';
      for (; j < span.length && j < sm.index + 1500; j++) {
        const ch = span[j];
        if (ch === '{') d3++;
        else if (ch === '}') { d3--; if (d3 === 0) break; }
        inner += ch;
      }
      for (const km of inner.matchAll(/^(\s*)([A-Za-z_][\w]*)\s*:/gm)) {
        const k = km[2];
        if (['user_id'].includes(k) && !cols.has(k)) { console.log(`BAD-COL ${f}: ${table}.${k} (payload)`); badC++; continue; }
        if (!cols.has(k) && !['user_id'].includes(k)) { console.log(`BAD-COL ${f}: ${table}.${k} (payload)`); badC++; }
      }
    }
  }
}
console.log(`\ntables referenced: ${seenTables.size}, unknown tables: ${badT}, unknown columns: ${badC}`);
console.log(badT + badC === 0 ? 'DB REFS ALL OK' : 'FIX NEEDED ABOVE');
