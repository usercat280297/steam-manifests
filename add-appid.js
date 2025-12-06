#!/usr/bin/env node
const axios = require('axios');
const { MongoClient } = require('mongodb');
const readline = require('readline');

// Usage:
// node add-appid.js 271590
// or interactive: node add-appid.js

const MONGODB_URI = process.env.MONGODB_URI || null;
const MANIFEST_ADMIN_URL = process.env.MANIFEST_ADMIN_URL || null; // e.g. https://your-railway-app.fly.dev
const MANIFEST_ADMIN_TOKEN = process.env.MANIFEST_ADMIN_TOKEN || process.env.ADMIN_TOKEN || null; // token if your manifest-bot requires it
const DISCORD_WEBHOOK = process.env.DISCORD_WEBHOOK_URL || process.env.DISCORD_WEBHOOK || null;

function ask(question) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise(resolve => rl.question(question, ans => { rl.close(); resolve(ans); }));
}

async function fetchAppDetails(appId) {
  try {
    const url = `https://store.steampowered.com/api/appdetails?appids=${appId}&l=english&cc=US`;
    const res = await axios.get(url, { timeout: 10000 });
    if (!res.data || !res.data[appId] || !res.data[appId].success) return null;
    return res.data[appId].data;
  } catch (err) {
    console.warn('Failed to fetch app details:', err.message || err.toString());
    return null;
  }
}

async function upsertToMongo(appId, info) {
  if (!MONGODB_URI) throw new Error('MONGODB_URI not set');
  const client = new MongoClient(MONGODB_URI);
  await client.connect();
  const db = client.db();
  const col = db.collection('games');

  const doc = {
    appId: Number(appId),
    name: info?.name || null,
    short_description: info?.short_description || null,
    header_image: info?.header_image || null,
    genres: (info?.genres || []).map(g => g.description).filter(Boolean),
    platforms: info?.platforms || {},
    steam_appid: info?.steam_appid || Number(appId),
    source: 'manual-cli',
    updated_at: new Date()
  };

  const res = await col.updateOne({ appId: Number(appId) }, { $set: doc, $setOnInsert: { created_at: new Date() } }, { upsert: true });
  await client.close();
  return res;
}

async function getExistingDoc(appId) {
  if (!MONGODB_URI) return null;
  const client = new MongoClient(MONGODB_URI);
  await client.connect();
  const db = client.db();
  const col = db.collection('games');
  try {
    const doc = await col.findOne({ appId: Number(appId) });
    await client.close();
    return doc;
  } catch (err) {
    await client.close();
    throw err;
  }
}

async function promptChoice(question, choices) {
  // choices: array of { key: 's', desc: 'skip' }
  const prompt = `${question} (${choices.map(c=>c.key+':'+c.desc).join(', ')}) `;
  const ans = (await ask(prompt)).trim().toLowerCase();
  return ans;
}

async function notifyManifestBot(appId) {
  if (!MANIFEST_ADMIN_URL) return null;
  try {
    const url = MANIFEST_ADMIN_URL.replace(/\/$/, '') + '/process';
    const headers = { 'Content-Type': 'application/json' };
    if (MANIFEST_ADMIN_TOKEN) headers['Authorization'] = `Bearer ${MANIFEST_ADMIN_TOKEN}`;
    // include admin token in the way manifest-bot expects
    if (MANIFEST_ADMIN_TOKEN) headers['x-admin-token'] = MANIFEST_ADMIN_TOKEN;
    // Try POST first (include token in body as fallback)
    const body = { appId: Number(appId) };
    if (MANIFEST_ADMIN_TOKEN) body.token = MANIFEST_ADMIN_TOKEN;
    const res = await axios.post(url, body, { headers, timeout: 10000 });
    return res.data || res.status;
  } catch (err) {
    // Try GET fallback
    try {
      let url = MANIFEST_ADMIN_URL.replace(/\/$/, '') + `/process?appId=${encodeURIComponent(appId)}`;
      if (MANIFEST_ADMIN_TOKEN) url += `&token=${encodeURIComponent(MANIFEST_ADMIN_TOKEN)}`;
      const res2 = await axios.get(url, { timeout: 8000 });
      return res2.data || res2.status;
    } catch (err2) {
      // log more detailed errors for diagnosis
      console.warn('Notify manifest-bot failed (POST):', err.response?.status || err.message || err);
      if (err.response && err.response.data) console.warn('Response data:', JSON.stringify(err.response.data));
      console.warn('Notify manifest-bot failed (GET):', err2.response?.status || err2.message || err2);
      if (err2.response && err2.response.data) console.warn('GET response data:', JSON.stringify(err2.response.data));
      return null;
    }
  }
}

async function notifyDiscord(appId, name) {
  if (!DISCORD_WEBHOOK) return null;
  try {
    const content = `Queued AppID ${appId}${name ? ` - ${name}` : ''} (added to DB)`;
    await axios.post(DISCORD_WEBHOOK, { content }, { timeout: 8000 });
    return true;
  } catch (err) {
    console.warn('Discord notify failed:', err.message || err);
    return null;
  }
}

(async function main(){
  try {
    let appId = process.argv[2];
    if (!appId) {
      appId = (await ask('Enter Steam AppID to add: ')).trim();
    }
    if (!appId || isNaN(Number(appId))) {
      console.error('Invalid AppID');
      process.exit(1);
    }

    console.log('Fetching app details...');
    const info = await fetchAppDetails(appId);
    if (!info) console.warn('Warning: Could not fetch details (app may be restricted/unavailable). Will still add appId to DB.');
    else console.log('Found:', info.name);

    if (!MONGODB_URI) {
      console.error('MONGODB_URI not configured. Set env var and retry.');
      process.exit(1);
    }

    const force = process.argv.includes('--force') || process.argv.includes('-f') || process.argv.includes('--yes') || process.argv.includes('-y');

    const existing = await getExistingDoc(appId);
    if (existing && !force) {
      console.log(`AppID ${appId} already exists in DB:`);
      console.log(`  name: ${existing.name || '(none)'}`);
      console.log(`  source: ${existing.source || '(unknown)'}`);
      console.log(`  created_at: ${existing.created_at || existing.createdAt || '(unknown)'}`);

      const choice = await promptChoice('Choose action', [
        { key: 's', desc: 'skip (do nothing)' },
        { key: 'u', desc: 'update metadata (merge)' },
        { key: 'o', desc: 'overwrite (replace)' },
        { key: 'd', desc: 'delete existing and exit' }
      ]);

      if (choice.startsWith('s')) {
        console.log('Skipping. No changes made.');
        process.exit(0);
      }

      if (choice.startsWith('d')) {
        // delete doc
        const client = new MongoClient(MONGODB_URI);
        await client.connect();
        const col = client.db().collection('games');
        const del = await col.deleteOne({ appId: Number(appId) });
        await client.close();
        console.log('Deleted existing document:', del.deletedCount);
        process.exit(0);
      }

      if (choice.startsWith('u')) {
        console.log('Updating metadata (merge)...');
        const mergedInfo = Object.assign({}, existing, {
          name: info?.name || existing.name,
          short_description: info?.short_description || existing.short_description,
          header_image: info?.header_image || existing.header_image,
          genres: (info?.genres || existing.genres || []).map(g => typeof g === 'object' ? g.description : g).filter(Boolean),
          platforms: info?.platforms || existing.platforms,
          updated_at: new Date(),
          source: existing.source || 'manual-cli'
        });
        // perform update
        const client = new MongoClient(MONGODB_URI);
        await client.connect();
        const col = client.db().collection('games');
        const r = await col.updateOne({ appId: Number(appId) }, { $set: mergedInfo });
        await client.close();
        console.log('Updated:', r.modifiedCount || 0);
        // continue to notify
      }

      if (choice.startsWith('o')) {
        console.log('Overwriting existing document...');
        const res = await upsertToMongo(appId, info);
        console.log('Overwrite upsert result:', res.result || res);
      }

    } else {
      console.log('Upserting into MongoDB...');
      const res = await upsertToMongo(appId, info);
      console.log('Upsert result:', res.result || res);
    }

    if (MANIFEST_ADMIN_URL) {
      console.log('Requesting manifest-bot to process this app...');
      const r = await notifyManifestBot(appId);
      console.log('Manifest-bot responded:', r);
    } else {
      console.log('No MANIFEST_ADMIN_URL configured. If your manifest-bot instance watches Mongo change-streams, it will pick up the new entry automatically.');
    }

    if (!MANIFEST_ADMIN_URL && DISCORD_WEBHOOK) {
      console.log('Sending confirmation to Discord webhook...');
      await notifyDiscord(appId, info?.name || null);
      console.log('Discord notified.');
    }

    console.log('Done.');
  } catch (err) {
    console.error('Error:', err.message || err);
    process.exit(1);
  }
})();
