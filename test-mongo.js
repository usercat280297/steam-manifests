#!/usr/bin/env node
// test-mongo.js
// Simple MongoDB connectivity/test script.
// IMPORTANT: Do NOT hardcode credentials. Set MONGODB_URI in environment.
// Example (PowerShell):
// $env:MONGODB_URI = "mongodb+srv://manifest-bot:PA55@host/dbname"

const { MongoClient } = require('mongodb');

async function main(){
  const uri = process.env.MONGODB_URI;
  if(!uri){
    console.error('❌ MONGODB_URI not set. Set it in your environment before running.');
    process.exit(1);
  }

  console.log('🧪 Testing MongoDB connection...');
  const client = new MongoClient(uri, { connectTimeoutMS: 10000, serverSelectionTimeoutMS: 10000 });
  try{
    await client.connect();
    console.log('✅ Connected to MongoDB');

    const db = client.db();
    const coll = db.collection('test_manifest_bot');

    // Insert sample docs
    console.log('📝 Inserting sample documents...');
    await coll.insertMany([
      { name: 'test-1', ts: new Date() },
      { name: 'test-2', ts: new Date() }
    ]);
    console.log('   ✅ Inserted sample documents');

    // Query back
    const count = await coll.countDocuments();
    console.log(`🔍 Documents in collection: ${count}`);

    // Cleanup
    await coll.deleteMany({ name: { $in: ['test-1','test-2'] } });
    console.log('🧹 Cleanup done');

    console.log('\n✨ MongoDB tests passed');
  }catch(err){
    console.error('\n❌ MongoDB test failed:', err.message || err);
    process.exitCode = 1;
  }finally{
    await client.close();
  }
}

main();
