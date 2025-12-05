const fs = require('fs');
const path = require('path');

const root = __dirname;
const gamesPath = path.join(root, 'games.json');
const lastStatePath = path.join(root, 'last_manifest_state.json');
const cleanedPath = path.join(root, 'games.cleaned.json');

function readJson(p) {
  try {
    return JSON.parse(fs.readFileSync(p, 'utf8'));
  } catch (e) {
    console.error(`Failed to read/parse ${p}:`, e.message);
    process.exit(1);
  }
}

const games = readJson(gamesPath);
const lastState = readJson(lastStatePath);

const lastNames = new Set(Object.keys(lastState));
const gamesByName = new Map(games.map(g => [g.name, g]));

const onlyInGames = [];
const onlyInLast = [];

for (const g of games) {
  if (!lastNames.has(g.name)) onlyInGames.push(g.name);
}
for (const name of lastNames) {
  if (!gamesByName.has(name)) onlyInLast.push(name);
}

const cleaned = games.filter(g => lastNames.has(g.name));

fs.writeFileSync(cleanedPath, JSON.stringify(cleaned, null, 2), 'utf8');

console.log('Reconciliation report:');
console.log(`  games.json total: ${games.length}`);
console.log(`  last_manifest_state total: ${lastNames.size}`);
console.log(`  cleaned (written to ${path.basename(cleanedPath)}): ${cleaned.length}`);
console.log(`  only in games.json (not processed): ${onlyInGames.length}`);
console.log(`  only in last_manifest_state (not in games.json): ${onlyInLast.length}`);

if (onlyInGames.length > 0) console.log('  Sample not-processed (games.json):', onlyInGames.slice(0,10));
if (onlyInLast.length > 0) console.log('  Sample not-listed (last_manifest_state):', onlyInLast.slice(0,10));

console.log('\nCreated cleaned games file. Review before deleting originals.');
