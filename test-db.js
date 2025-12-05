#!/usr/bin/env node

/**
 * test-db.js - Local database testing utility
 * 
 * Tests PostgreSQL connection, table creation, and basic operations.
 * 
 * Usage:
 *   DATABASE_URL="postgresql://user:pass@localhost:5432/steam" node test-db.js
 * 
 * Expected output:
 *   ✅ Connected to PostgreSQL
 *   ✅ Games table ready
 *   ✅ Inserted 3 test games
 *   ✅ Queried 3 games from DB
 *   ✅ All tests passed!
 */

const { Pool } = require('pg');

async function main() {
  const DATABASE_URL = process.env.DATABASE_URL;
  
  if (!DATABASE_URL) {
    console.error('❌ DATABASE_URL not set');
    console.error('Usage: DATABASE_URL="postgresql://..." node test-db.js');
    process.exit(1);
  }

  console.log('🧪 Starting DB tests...\n');
  
  const pool = new Pool({ connectionString: DATABASE_URL, max: 1 });
  
  try {
    // Test 1: Connect
    console.log('📡 Test 1: Connection...');
    const conn = await pool.connect();
    const result = await conn.query('SELECT NOW()');
    console.log('   ✅ Connected. Server time:', result.rows[0].now);
    conn.release();

    // Test 2: Create table
    console.log('\n📋 Test 2: Table creation...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS games (
        appid INTEGER PRIMARY KEY,
        name TEXT NOT NULL,
        meta JSONB,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('   ✅ Games table ready');

    // Test 3: Insert test data
    console.log('\n📝 Test 3: Insert test games...');
    const testGames = [
      { appId: 1091500, name: 'Cyberpunk 2077' },
      { appId: 292030, name: 'The Witcher 3: Wild Hunt' },
      { appId: 570, name: 'Dota 2' }
    ];

    for (const game of testGames) {
      await pool.query(
        `INSERT INTO games (appid, name, meta) 
         VALUES ($1, $2, $3)
         ON CONFLICT (appid) DO UPDATE 
         SET name = EXCLUDED.name, updated_at = NOW()`,
        [game.appId, game.name, JSON.stringify(game)]
      );
    }
    console.log(`   ✅ Inserted ${testGames.length} test games`);

    // Test 4: Query data
    console.log('\n🔍 Test 4: Query games...');
    const queryResult = await pool.query('SELECT appid, name FROM games ORDER BY appid DESC LIMIT 3');
    console.log(`   ✅ Found ${queryResult.rowCount} games`);
    queryResult.rows.forEach(row => {
      console.log(`      • ${row.name} (${row.appid})`);
    });

    // Test 5: Update
    console.log('\n✏️  Test 5: Update game...');
    await pool.query(
      'UPDATE games SET name = $1 WHERE appid = $2',
      ['Cyberpunk 2077 - Updated', 1091500]
    );
    const updated = await pool.query('SELECT name FROM games WHERE appid = $1', [1091500]);
    console.log(`   ✅ Updated. Name now: "${updated.rows[0].name}"`);

    // Test 6: Count
    console.log('\n📊 Test 6: Statistics...');
    const stats = await pool.query('SELECT COUNT(*) as total FROM games');
    console.log(`   ✅ Total games in DB: ${stats.rows[0].total}`);

    // Test 7: Cleanup
    console.log('\n🧹 Test 7: Cleanup test data...');
    const deleted = await pool.query('DELETE FROM games WHERE appid IN ($1, $2, $3)', 
      [1091500, 292030, 570]);
    console.log(`   ✅ Deleted ${deleted.rowCount} test games`);

    console.log('\n✨ All tests passed!\n');

  } catch (err) {
    console.error('\n❌ Test failed:', err.message);
    console.error('   Check your DATABASE_URL and ensure PostgreSQL is running');
    process.exit(1);
  } finally {
    await pool.end();
    console.log('Connection closed.');
  }
}

main();
