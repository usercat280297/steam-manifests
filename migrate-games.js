const fs = require('fs');
const path = require('path');
require('dotenv').config();

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL not set. Set it in your environment to run migrate-games.js');
  process.exit(1);
}

(async () => {
  const { Pool } = require('pg');
  const pool = new Pool({ connectionString: DATABASE_URL, ssl: { rejectUnauthorized: false } });

  try {
    console.log('🔌 Connecting to database...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS games (
        appid BIGINT PRIMARY KEY,
        name TEXT NOT NULL,
        meta JSONB,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    const file = path.join(__dirname, 'games.json');
    if (!fs.existsSync(file)) {
      console.error('❌ games.json not found in project root');
      process.exit(1);
    }

    const raw = fs.readFileSync(file, 'utf8');
    const list = JSON.parse(raw);
    console.log(`ℹ️ Found ${list.length} entries in games.json`);

    let inserted = 0;
    for (const g of list) {
      if (!g || !g.appId || !g.name) continue;
      const appId = String(g.appId);
      const name = g.name;
      const meta = Object.assign({}, g);
      delete meta.name; delete meta.appId;

      await pool.query(
        `INSERT INTO games(appid, name, meta) VALUES($1, $2, $3)
         ON CONFLICT (appid) DO UPDATE SET name = EXCLUDED.name, meta = EXCLUDED.meta`,
        [appId, name, Object.keys(meta).length ? meta : null]
      );
      inserted++;
    }

    console.log(`✅ Migration complete. Upserted ${inserted} games into DB.`);
    await pool.end();
    process.exit(0);
  } catch (err) {
    console.error('❌ Migration error:', err.message || err);
    await pool.end().catch(()=>{});
    process.exit(1);
  }
})();
