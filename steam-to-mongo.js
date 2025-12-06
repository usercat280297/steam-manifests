const axios = require('axios');
const { MongoClient } = require('mongodb');

// Usage:
// node steam-to-mongo.js 271590 570
// node steam-to-mongo.js --file apps.txt

const MONGODB_URI = process.env.MONGODB_URI || null;
if (!MONGODB_URI) {
  console.error('Please set MONGODB_URI environment variable.');
  process.exit(1);
}

function parseArgs() {
  const args = process.argv.slice(2);
  if (args.length === 0) {
    console.error('Provide at least one appId or use --file <path>');
    process.exit(1);
  }

  if (args[0] === '--file') {
    const fs = require('fs');
    const p = args[1];
    if (!p) {
      console.error('Missing file path after --file');
      process.exit(1);
    }
    const raw = fs.readFileSync(p, 'utf8');
    return raw.split(/\r?\n/).map(l => l.trim()).filter(Boolean).map(Number);
  }

  return args.map(a => Number(a)).filter(Boolean);
}

async function fetchApp(appId) {
  try {
    const url = `https://store.steampowered.com/api/appdetails?appids=${appId}&l=english&cc=US`;
    const res = await axios.get(url, { timeout: 10000 });
    if (!res.data || !res.data[appId] || !res.data[appId].success) return null;
    return res.data[appId].data;
  } catch (err) {
    console.warn('Failed fetch for', appId, err.message || err);
    return null;
  }
}

async function main() {
  const appIds = parseArgs();
  console.log('Will import appIds:', appIds.slice(0, 100));

  const client = new MongoClient(MONGODB_URI);
  await client.connect();
  const db = client.db();
  const col = db.collection('games');

  let created = 0, updated = 0;
  for (const id of appIds) {
    console.log('Fetching', id);
    const info = await fetchApp(id);
    if (!info) continue;

    const doc = {
      appId: Number(id),
      name: info.name || null,
      short_description: info.short_description || null,
      header_image: info.header_image || null,
      genres: (info.genres || []).map(g => g.description).filter(Boolean),
      platforms: info.platforms || {},
      steam_appid: info.steam_appid || Number(id),
      last_imported_at: new Date()
    };

    try {
      const res = await col.updateOne({ appId: Number(id) }, { $set: doc, $setOnInsert: { created_at: new Date() } }, { upsert: true });
      if (res.upsertedCount && res.upsertedCount > 0) created++;
      else if (res.modifiedCount && res.modifiedCount > 0) updated++;
      console.log(`Upserted ${id} -> ${doc.name}`);
    } catch (err) {
      console.error('Mongo upsert error for', id, err.message || err);
    }

    // small delay to be gentle
    await new Promise(r => setTimeout(r, 300));
  }

  console.log(`Done. Created: ${created}, Updated: ${updated}`);
  await client.close();
}

main().catch(err => { console.error(err); process.exit(1); });
