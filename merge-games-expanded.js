const fs = require('fs');
const path = require('path');

const basePath = process.cwd();
const g1 = path.join(basePath, 'games.json');
const g2 = path.join(basePath, 'games-expanded.json');

if (!fs.existsSync(g2)) {
  console.error('games-expanded.json not found'); process.exit(1);
}
if (!fs.existsSync(g1)) {
  console.warn('games.json not found — creating new from expanded list');
}

const list1 = fs.existsSync(g1) ? JSON.parse(fs.readFileSync(g1,'utf8')) : [];
const list2 = JSON.parse(fs.readFileSync(g2,'utf8'));

const map = new Map();
for (const g of list1.concat(list2)) {
  if (!g) continue;
  if (g.appId) map.set(String(g.appId), { name: g.name, appId: Number(g.appId) });
}

const merged = Array.from(map.values());

// backup
if (fs.existsSync(g1)) fs.copyFileSync(g1, g1 + '.bak');
fs.writeFileSync(g1, JSON.stringify(merged, null, 2), 'utf8');
console.log(`Merged ${merged.length} unique games into games.json (backup created if existed).`);
