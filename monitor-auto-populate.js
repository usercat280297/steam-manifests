const fs = require('fs');
const path = require('path');
const { MongoClient } = require('mongodb');

const TARGET = parseInt(process.env.TARGET || '1000', 10);
const INTERVAL = parseInt(process.env.MONITOR_INTERVAL_MS || '60000', 10); // default 60s
const MONGODB_URI = process.env.MONGODB_URI || null;

async function mongoCount() {
  if (!MONGODB_URI) return null;
  try {
    const client = new MongoClient(MONGODB_URI);
    await client.connect();
    const db = client.db();
    const cnt = await db.collection('games').countDocuments();
    await client.close();
    return cnt;
  } catch (err) {
    console.error('Mongo count error:', err.message || err);
    return null;
  }
}

function jsonCount(file) {
  try {
    if (!fs.existsSync(file)) return 0;
    const raw = fs.readFileSync(file, 'utf8');
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr.length : 0;
  } catch (err) {
    return 0;
  }
}

async function main() {
  console.log(`Monitor started — target ${TARGET}. Poll interval ${INTERVAL}ms.`);
  const expandedPath = path.resolve('games-expanded.json');
  const gamesPath = path.resolve('games.json');

  while (true) {
    const expandedCount = jsonCount(expandedPath);
    const gamesCount = jsonCount(gamesPath);
    const mongoCnt = await mongoCount();

    const now = new Date().toISOString();
    console.log(`\n[${now}] counts -> games-expanded.json: ${expandedCount}, games.json: ${gamesCount}${mongoCnt!==null?`, mongo.games: ${mongoCnt}`:''}`);

    if (expandedCount >= TARGET || gamesCount >= TARGET || (mongoCnt!==null && mongoCnt >= TARGET)) {
      console.log(`\n🎉 TARGET reached. Stopping monitor.`);
      break;
    }

    await new Promise(r => setTimeout(r, INTERVAL));
  }
}

main().catch(err => { console.error('Monitor fatal error:', err); process.exit(1); });
