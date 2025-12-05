# Database Deployment & Testing Guide

Complete guide to testing PostgreSQL locally and deploying to Railway.

## Local Testing

### Prerequisites

- PostgreSQL installed locally (or Docker)
- Node.js v16+
- `.env` file with `DATABASE_URL` configured

### Starting PostgreSQL (If Using Docker)

```bash
# Start PostgreSQL container
docker run --name postgres-test \
  -e POSTGRES_PASSWORD=testpass \
  -e POSTGRES_DB=steam \
  -p 5432:5432 \
  -d postgres:15

# Wait 5 seconds for startup
sleep 5
```

### Setup Local DATABASE_URL

For local development, add to `.env`:

```bash
# Option 1: Local Docker PostgreSQL
DATABASE_URL="postgresql://postgres:testpass@localhost:5432/steam"

# Option 2: Local PostgreSQL installation
DATABASE_URL="postgresql://postgres:password@localhost:5432/steam"

# Option 3: Existing PostgreSQL server
DATABASE_URL="postgresql://user:pass@hostname:5432/dbname"
```

### Test 1: Database Connection

```bash
npm run test-db
```

**Expected Output:**
```
🧪 Starting DB tests...

📡 Test 1: Connection...
   ✅ Connected. Server time: 2024-01-15 10:30:45.123+00

📋 Test 2: Table creation...
   ✅ Games table ready

📝 Test 3: Insert test games...
   ✅ Inserted 3 test games

🔍 Test 4: Query games...
   ✅ Found 3 games
      • Cyberpunk 2077 (1091500)
      • The Witcher 3: Wild Hunt (292030)
      • Dota 2 (570)

✏️  Test 5: Update game...
   ✅ Updated. Name now: "Cyberpunk 2077 - Updated"

📊 Test 6: Statistics...
   ✅ Total games in DB: 3

🧹 Test 7: Cleanup test data...
   ✅ Deleted 3 test games

✨ All tests passed!

Connection closed.
```

### Test 2: Migration Script

```bash
# Import all 219 games from games.json to PostgreSQL
npm run migrate-games
```

**Expected Output:**
```
📋 Starting migration...
📂 Reading games.json...
   ✅ Found 219 games

🔗 Connecting to PostgreSQL...
   ✅ Connected

📊 Creating games table (if needed)...
   ✅ Table ready

💾 Importing games...
   ✅ 1029890 (Cyberpunk 2077) → inserted
   ✅ 292030 (The Witcher 3: Wild Hunt) → inserted
   ✅ 1113000 (PUBG: Battlegrounds) → inserted
   [... 216 more games ...]

✨ Import complete!
   • Total: 219 games imported
   • Created: 219 new records
   • Updated: 0 existing records

✅ Database migration successful!
```

### Test 3: Bot with Database

```bash
# Start the bot (will use PostgreSQL if DATABASE_URL is set)
npm start
```

**Expected Output (First Lines):**
```
🚀 Loading .env...
✅ Loaded .env

🔧 Using ADMIN_TOKEN (32+ chars)

💾 Database configured
   🔗 Connecting to PostgreSQL...
   ✅ Connected to database

📋 Games table ready

📚 Loading games...
   ✅ Loaded 219 games from database

🔧 Control server listening on port 3000 (ADMIN_TOKEN set)

🚀 Starting initial scan...

🔍 Fetching manifests for AppID 1091500 (Cyberpunk 2077)...
   ✅ Merged discovery: 28 unique depots from 2 sources
   Top 3 by confidence: 1091501(125), 1091502(125), 1091503(125)
   ...
```

### Test 4: Control API Locally

**Add a game via API:**

```bash
# Get your ADMIN_TOKEN (or use test token)
ADMIN_TOKEN="your_token_here"

# Add a new game to database
curl -X POST http://localhost:3000/games \
  -H "Content-Type: application/json" \
  -H "x-admin-token: $ADMIN_TOKEN" \
  -d '{
    "name": "Portal 2",
    "appId": 620
  }'

# Expected response:
# {"status":"queued","appId":620}
```

**List all games:**

```bash
curl "http://localhost:3000/api/games?token=$ADMIN_TOKEN" \
  -H "x-admin-token: $ADMIN_TOKEN" | jq '.[0:3]'

# Expected response (first 3 games):
# [
#   {"appId":1091500,"name":"Cyberpunk 2077","meta":{...}},
#   {"appId":292030,"name":"The Witcher 3: Wild Hunt","meta":{...}},
#   {"appId":1113000,"name":"PUBG: Battlegrounds","meta":{...}}
# ]
```

**Trigger single game processing:**

```bash
curl -X POST "http://localhost:3000/process?token=$ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -H "x-admin-token: $ADMIN_TOKEN" \
  -d '{"appId":1091500}'

# Expected response:
# {"status":"queued","appId":1091500}
```

### Test 5: Admin Web UI

Open in browser:

```
http://localhost:3000/admin?token=YOUR_ADMIN_TOKEN
```

You should see:
- List of all 219+ games from database
- Form to add new games
- "Force" button next to each game to trigger re-processing

---

## Railway Deployment

### Step 1: Prepare Repository

```bash
# Ensure all files are committed
git status

# Should show nothing to commit (working tree clean)
```

### Step 2: Add PostgreSQL Service in Railway

1. Go to Railway project dashboard
2. Click **"+ Add Service"** 
3. Select **PostgreSQL**
4. Wait for initialization (1-2 minutes)
5. Railway automatically adds `DATABASE_URL` to your environment

### Step 3: Deploy Bot

```bash
# Push changes to trigger Railway deployment
git add .
git commit -m "feat: PostgreSQL setup and testing utilities"
git push
```

Railway will:
1. Detect push
2. Build Docker image
3. Deploy to Railway instance
4. Set `DATABASE_URL` environment variable
5. Start the bot

### Step 4: Monitor Deployment

In Railway dashboard, click your Node.js service and view "Logs":

**Watch for these success indicators:**

✅ `💾 Database configured`
✅ `✅ Connected to database`
✅ `📋 Games table ready`
✅ `✅ Loaded 219 games from database`
✅ `🔧 Control server listening on port 3000`
✅ `✅ GitHub upload SUCCESS!`
✅ `✅ Sent to Discord (204)`

**If you see DB errors:**

```
❌ Cannot connect to database
❌ ECONNREFUSED
❌ Games table does not exist
```

→ Check DATABASE_URL is set in Railway Variables
→ Wait 2-3 minutes for PostgreSQL service to fully initialize
→ Restart deployment

### Step 5: First Time Data Import

After bot deploys successfully, populate the database:

#### Option A: Via Bot Admin UI

1. Get your Railway app URL (e.g., `https://steam-manifest-bot-prod.railway.app`)
2. Open admin: `https://steam-manifest-bot-prod.railway.app/admin?token=YOUR_ADMIN_TOKEN`
3. Import games via the UI form (or manually add each)

#### Option B: Via Migration Script (If you have Node.js locally)

```bash
# Set remote DATABASE_URL
export DATABASE_URL="postgresql://postgres:PASSWORD@YOUR_RAILWAY_HOST:5432/railway"

# Run migration
npm run migrate-games

# Verify
npm run test-db
```

#### Option C: Via Control API

```bash
# Bulk import by calling API multiple times
for appid in 1091500 292030 1113000 1214490; do
  curl -X POST https://your-railway-url/games \
    -H "Content-Type: application/json" \
    -H "x-admin-token: $ADMIN_TOKEN" \
    -d "{\"appId\":$appid,\"name\":\"Game $appid\"}"
  sleep 1
done
```

### Step 6: Verify Railway Deployment

**Check API is responding:**

```bash
curl "https://your-railway-url/api/games?token=YOUR_ADMIN_TOKEN" | jq '.[0]'
```

**Check admin UI loads:**

```bash
curl "https://your-railway-url/admin?token=YOUR_ADMIN_TOKEN" -s | head -20
```

**Check Discord notifications:**

Watch your Discord channel for manifest discovery logs (should appear every ~1 hour based on CHECK_INTERVAL)

---

## Troubleshooting

### Problem: "Cannot connect to database" in Railway logs

**Solution:**
1. Go to Railway PostgreSQL service → Variables
2. Copy the `DATABASE_URL` value
3. Go to Node.js service → Variables
4. Add/update `DATABASE_URL` with the value from step 2
5. Redeploy the Node.js service

### Problem: "Games table does not exist"

**Solution:**
1. Wait 3-5 minutes for bot to auto-create table
2. Or manually trigger migration (see Step 5 above)
3. Check logs for table creation SQL errors

### Problem: No games appear in `/api/games`

**Solution:**
1. Import games using migration script (see Step 5)
2. Or add games manually via `/games` POST endpoint
3. Verify in Railway PostgreSQL explorer: `SELECT COUNT(*) FROM games;`

### Problem: Control API returns 403 Forbidden

**Solution:**
1. Verify ADMIN_TOKEN is set in Railway Variables
2. Use exact same token in request headers
3. Check token format (should be 64+ character hex string)

### Problem: Discord notifications not sending

**Solution:**
1. Verify `DISCORD_WEBHOOK_URL` is set correctly
2. Test webhook manually: `curl -X POST "$DISCORD_WEBHOOK_URL" -d '{...}'`
3. Check Railways logs for webhook errors

---

## Performance Monitoring

### Check Database Size

```bash
# Via Railway PostgreSQL UI
SELECT pg_size_pretty(pg_database_size(current_database()));
```

### Monitor Recent Games

```bash
SELECT name, appid, created_at FROM games 
ORDER BY created_at DESC LIMIT 10;
```

### Count by Type

```bash
SELECT COUNT(*) as total FROM games;
SELECT COUNT(DISTINCT appid) as unique_games FROM games;
```

---

## Scaling Up

**If bot gets slow:**

1. Increase `CHECK_INTERVAL` in manifest-bot.js (currently 1 hour)
2. Use Railway scheduled jobs for periodic scans
3. Archive old manifests monthly

**If database gets large:**

1. Export old manifests to S3 (optional)
2. Partition games table by year
3. Add indexes on `appid`, `created_at`

---

## Final Checklist

Before considering setup complete:

- [ ] Local `test-db.js` passes all tests
- [ ] Local `npm run migrate-games` imports 219 games
- [ ] Local bot starts and loads games from database
- [ ] Local `/admin` UI shows all games
- [ ] Railway PostgreSQL service is green/running
- [ ] Railway DATABASE_URL is set in Variables
- [ ] Railway bot deployment completed successfully
- [ ] Railway bot logs show "✅ Loaded X games from database"
- [ ] Railway admin UI is accessible with ADMIN_TOKEN
- [ ] Discord received at least 1 notification
- [ ] GitHub manifests uploaded successfully

✅ All complete → Setup is production-ready!
