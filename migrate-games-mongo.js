#!/usr/bin/env node
// migrate-games-mongo.js
// Reads games.json and upserts into MongoDB collection `games`.
// WARNING: Do NOT commit credentials. Use MONGODB_URI in env.

const fs = require('fs');
const path = require('path');
const { MongoClient } = require('mongodb');

async function main(){
  const uri = process.env.MONGODB_URI;
  if(!uri){
    console.error('❌ MONGODB_URI not set. Set it in your environment before running.');
    process.exit(1);
  }

  const filePath = path.resolve(process.cwd(), 'games.json');
  if(!fs.existsSync(filePath)){
    console.error('❌ games.json not found in', process.cwd());
    process.exit(1);
  }

  const raw = fs.readFileSync(filePath, 'utf8');
  let games;
  try{ games = JSON.parse(raw); } catch(err){ console.error('❌ Failed to parse games.json', err.message); process.exit(1); }
  if(!Array.isArray(games)) { console.error('❌ games.json must be an array'); process.exit(1); }

  const client = new MongoClient(uri, { connectTimeoutMS: 10000, serverSelectionTimeoutMS: 10000 });
  try{
    await client.connect();
    console.log('🔗 Connected to MongoDB');
    const db = client.db();
    const coll = db.collection('games');

    let created = 0, updated = 0;
    for(const g of games){
      if(!g || !g.appId) continue;
      const filter = { appId: Number(g.appId) };
      const update = { $set: { appId: Number(g.appId), name: g.name || null, meta: g } };
      const res = await coll.updateOne(filter, update, { upsert: true });
      if(res.upsertedCount > 0) created++; else if(res.modifiedCount > 0) updated++;
      process.stdout.write(`.`);
    }
    console.log(`\n✨ Import complete! Created: ${created}, Updated: ${updated}`);
  }catch(err){
    console.error('\n❌ Migration failed:', err.message || err);
    process.exitCode = 1;
  }finally{
    await client.close();
  }
}

main();
