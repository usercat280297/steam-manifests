const fs = require('fs');
const path = require('path');

const file = path.resolve(process.cwd(), 'games.json');
if (!fs.existsSync(file)) {
  console.error('games.json not found in', process.cwd());
  process.exit(1);
}

const raw = fs.readFileSync(file, 'utf8');
let arr;
try { arr = JSON.parse(raw); } catch (err) { console.error('Failed to parse games.json:', err.message); process.exit(1); }

if (!Array.isArray(arr)) { console.error('games.json is not an array'); process.exit(1); }

const total = arr.length;
let withApp = 0;
const missing = [];
for (let i = 0; i < arr.length; i++) {
  const g = arr[i];
  if (g && (g.appId !== undefined && g.appId !== null && String(g.appId).trim() !== '')) withApp++;
  else missing.push({ index: i, name: g && g.name ? g.name : null, raw: g });
}

console.log('Total entries in games.json:', total);
console.log('Entries with appId:', withApp);
console.log('Entries missing appId:', missing.length);
if (missing.length > 0) {
  console.log('\nList of entries missing appId:');
  missing.forEach(m => console.log(`- index=${m.index} name=${m.name} raw=${JSON.stringify(m.raw)}`));
}

if (withApp + missing.length !== total) {
  console.log('Note: counts do not add up (unexpected)');
}
