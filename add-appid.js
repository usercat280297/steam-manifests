#!/usr/bin/env node
const axios = require('axios');
// Load env files: .env then .env.local (if present)
require('dotenv').config();
require('dotenv').config({ path: '.env.local' });
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

function isFreeGame(appInfo) {
  // Check if game is free-to-play or free on Steam
  if (!appInfo) return false;
  
  // Check if price is free (0) or null for free-to-play games
  const isFree = appInfo.is_free === true || appInfo.price_overview?.initial === 0 || !appInfo.price_overview;
  
  // Check if it's marked as Free to Play in categories or description
  const isFreeToPlay = /free.?to.?play|f2p/i.test(appInfo.genres?.map(g => g.description).join(' ') || '');
  const isFreeDemoOrContent = /free|demo|traile/i.test(appInfo.name || '');
  
  return isFree || isFreeToPlay || (isFreeDemoOrContent && isFreeToPlay);
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
  // Delegate to the more robust implementation so we get consistent diagnostics
  if (!MANIFEST_ADMIN_URL) return null;
  console.log('DEBUG: MANIFEST_ADMIN_URL present:', !!MANIFEST_ADMIN_URL, 'MANIFEST_ADMIN_TOKEN present:', !!MANIFEST_ADMIN_TOKEN);
  return await notifyManifestBotWith(MANIFEST_ADMIN_URL, MANIFEST_ADMIN_TOKEN, appId);
}

async function notifyManifestBotWith(urlBase, token, appId) {
  if (!urlBase) return null;
  // normalize URL: ensure protocol present
  let base = String(urlBase).trim();
  if (!/^https?:\/\//i.test(base)) base = 'https://' + base;

  try {
    const url = base.replace(/\/$/, '') + '/process';
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    if (token) headers['x-admin-token'] = token;
    const body = { appId: Number(appId) };
    if (token) body.token = token;

    // optional quick connectivity probe (ignore failures)
    try { await axios.head(base, { timeout: 3000 }); } catch (e) {}

    const res = await axios.post(url, body, { headers, timeout: 10000 });
    return res.data || res.status;
  } catch (err) {
    // fallback to GET with query params
    try {
      // Try API style: POST /process/:appId
      const urlProcessId = base.replace(/\/$/, '') + `/process/${encodeURIComponent(appId)}`;
      try {
        const resPid = await axios.post(urlProcessId, {}, { headers: { 'x-admin-token': token }, timeout: 8000 });
        return resPid.data || resPid.status;
      } catch (pidErr) {
        // If POST /process/:appId isn't allowed, try GET equivalent
        try {
          const resPidGet = await axios.get(urlProcessId, { headers: { 'x-admin-token': token }, timeout: 8000 });
          return resPidGet.data || resPidGet.status;
        } catch (pidGetErr) {
          // continue to other fallbacks
        }
      }

      // Next, try POST /games (add endpoint expects name+appId) or /games/add
      const urlGamesAdd = base.replace(/\/$/, '') + '/games/add';
      try {
        const resGamesAdd = await axios.post(urlGamesAdd, { appId: Number(appId), name: `App ${appId}` }, { headers: { 'Content-Type': 'application/json', 'x-admin-token': token }, timeout: 8000 });
        return resGamesAdd.data || resGamesAdd.status;
      } catch (gamesAddErr) {
        // POST /games (generic) as last resort
        try {
          const urlGames = base.replace(/\/$/, '') + '/games';
          const resGames = await axios.post(urlGames, { appId: Number(appId), name: `App ${appId}` }, { headers: { 'Content-Type': 'application/json', 'x-admin-token': token }, timeout: 8000 });
          return resGames.data || resGames.status;
        } catch (gamesErr) {
          // give up and report
        }
      }
    } catch (err2) {
      // rich diagnostics
      console.warn('Notify manifest-bot POST failed:');
      if (err) {
        if (err.code) console.warn('  code:', err.code);
        if (err.message) console.warn('  message:', err.message);
        if (err.response) {
          console.warn('  status:', err.response.status);
          try { console.warn('  data:', JSON.stringify(err.response.data)); } catch (e) { console.warn('  data: [unserializable]'); }
        }
        if (err.stack) console.debug('  stack:', err.stack);
      }

      console.warn('Notify manifest-bot GET fallback failed:');
      if (err2) {
        if (err2.code) console.warn('  code:', err2.code);
        if (err2.message) console.warn('  message:', err2.message);
        if (err2.response) {
          console.warn('  status:', err2.response.status);
          try { console.warn('  data:', JSON.stringify(err2.response.data)); } catch (e) { console.warn('  data: [unserializable]'); }
        }
        if (err2.stack) console.debug('  stack:', err2.stack);
      }
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

    // Check if game is free-to-play (skip if free unless forced)
    if (info && isFreeGame(info)) {
      const isForced = process.argv.includes('--force-free') || process.argv.includes('-ff');
      if (!isForced) {
        console.log('\n❌ GAME KHÔNG HỢP LỆ: Game này là Free-to-Play hoặc miễn phí trên Steam');
        console.log('   Tên: ' + info.name);
        console.log('   Chỉ xử lý các game có phí (Paid games)\n');
        console.log('Để thêm dù là game free, hãy dùng flag: --force-free\n');
        process.exit(1);
      }
    }

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
      // show configured URL (mask token)
      try {
        const masked = MANIFEST_ADMIN_URL.replace(/(https?:\/\/)/i, '$1').replace(/:\/\/.+@/, '://[masked@]');
        console.log('Configured MANIFEST_ADMIN_URL:', masked);
      } catch (e) { console.log('Configured MANIFEST_ADMIN_URL present'); }

      console.log('Requesting manifest-bot to process this app...');
      const r = await notifyManifestBot(appId);
      console.log('Manifest-bot responded:', r);

      // If notify failed, offer interactive retry with alternate URL/token
      if (r == null) {
        const tryNow = (await ask('Notification to configured MANIFEST_ADMIN_URL failed. Try alternate URL/token now? (y/N): ')).trim().toLowerCase();
        if (tryNow.startsWith('y')) {
          const url = (await ask('Enter manifest-bot base URL (e.g. https://your-app.up.railway.app): ')).trim();
          const token = (await ask('Enter ADMIN token for manifest-bot (leave empty if none): ')).trim();
          if (!url) {
            console.log('No URL provided, skipping notification.');
          } else {
            console.log('Requesting manifest-bot to process this app (alternate URL)...');
            const r2 = await notifyManifestBotWith(url, token || null, appId);
            console.log('Manifest-bot responded:', r2);
            const save = (await ask('Save this MANIFEST_ADMIN_URL and token to a local .env.local for future runs? (y/N): ')).trim().toLowerCase();
            if (save.startsWith('y')) {
              const fs = require('fs');
              const envFile = '.env.local';
              let content = '';
              content += `MANIFEST_ADMIN_URL=${url}\n`;
              if (token) content += `MANIFEST_ADMIN_TOKEN=${token}\n`;
              try {
                fs.writeFileSync(envFile, content, { encoding: 'utf8', flag: 'w' });
                console.log(`Saved to ${envFile}`);
                try {
                  const gi = '.gitignore';
                  let giContent = '';
                  if (fs.existsSync(gi)) giContent = fs.readFileSync(gi, 'utf8');
                  if (!giContent.includes(envFile)) {
                    fs.appendFileSync(gi, `\n${envFile}\n`, { encoding: 'utf8' });
                    console.log(`Appended ${envFile} to .gitignore`);
                  }
                } catch (e) {}
              } catch (e) {
                console.warn('Failed to save .env.local:', e.message || e);
              }
            }
          }
        }
      }
    } else {
      // Interactive fallback: prompt user to optionally notify a running bot now
      const want = (await ask('MANIFEST_ADMIN_URL not configured. Do you want to notify a running manifest-bot now? (y/N): ')).trim().toLowerCase();
      if (want.startsWith('y')) {
        const url = (await ask('Enter manifest-bot base URL (e.g. https://your-app.up.railway.app): ')).trim();
        const token = (await ask('Enter ADMIN token for manifest-bot (leave empty if none): ')).trim();
        if (!url) {
          console.log('No URL provided, skipping notification.');
        } else {
          console.log('Requesting manifest-bot to process this app...');
          const r = await notifyManifestBotWith(url, token || null, appId);
          console.log('Manifest-bot responded:', r);

          const save = (await ask('Save this MANIFEST_ADMIN_URL and token to a local .env.local for future runs? (y/N): ')).trim().toLowerCase();
          if (save.startsWith('y')) {
            const fs = require('fs');
            const envFile = '.env.local';
            let content = '';
            content += `MANIFEST_ADMIN_URL=${url}\n`;
            if (token) content += `MANIFEST_ADMIN_TOKEN=${token}\n`;
            try {
              fs.writeFileSync(envFile, content, { encoding: 'utf8', flag: 'w' });
              console.log(`Saved to ${envFile}`);
              // ensure .env.local is gitignored
              try {
                const gi = '.gitignore';
                let giContent = '';
                if (fs.existsSync(gi)) giContent = fs.readFileSync(gi, 'utf8');
                if (!giContent.includes(envFile)) {
                  fs.appendFileSync(gi, `\n${envFile}\n`, { encoding: 'utf8' });
                  console.log(`Appended ${envFile} to .gitignore`);
                }
              } catch (e) {
                // ignore gitignore write errors
              }
            } catch (e) {
              console.warn('Failed to save .env.local:', e.message || e);
            }
          }
        }
      } else {
        console.log('No MANIFEST_ADMIN_URL configured. If your manifest-bot instance watches Mongo change-streams, it will pick up the new entry automatically.');
      }
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
