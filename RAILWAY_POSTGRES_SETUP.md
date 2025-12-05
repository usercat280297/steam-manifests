# Railway PostgreSQL Setup Guide

This guide walks you through setting up PostgreSQL on Railway for the Steam Manifest Bot.

## Prerequisites

- Railway account (https://railway.app)
- Project created on Railway
- Environment variables already set: `DISCORD_WEBHOOK_URL`, `GITHUB_TOKEN`, `GITHUB_REPO_OWNER`, `GITHUB_REPO_NAME`, `ADMIN_TOKEN`, `API_PORT`

## Step 1: Add PostgreSQL Plugin to Railway

1. Go to your Railway project dashboard
2. Click **"+ Add Service"** (top right)
3. Search for **PostgreSQL** and select it
4. Wait for the service to initialize (30-60 seconds)
5. Railway will automatically add the `DATABASE_URL` environment variable to your app

## Step 2: Verify DATABASE_URL Connection String

1. In Railway, click on the **PostgreSQL** service
2. Go to the **"Variables"** tab
3. You should see `DATABASE_URL` with a connection string like:
   ```
   postgresql://postgres:password@host:port/railway
   ```
4. Copy this value and verify it's automatically set in your Node.js app

## Step 3: Deploy the Bot with Database Support

1. Commit your latest changes:
   ```bash
   git add .
   git commit -m "feat: Railway PostgreSQL setup"
   git push
   ```

2. Railway will auto-deploy when it detects a push to your repo

3. Check the **Deployments** tab in Railway to see logs:
   - Look for: `✅ Games table created/ready`
   - Look for: `✅ Loaded X games from database`
   - Look for: `🔧 Control server listening on port 3000`

## Step 4: Populate Database (First Time)

### Option A: Auto-Import via npm Script

If you have Node.js locally:

```bash
# Set local DATABASE_URL
export DATABASE_URL="your_railway_postgres_url"

# Run the migration script
npm run migrate-games
```

Output will show:
```
Importing 219 games from games.json → PostgreSQL...
✅ Game 1029890 (Cyberpunk 2077) inserted/updated
✅ Game 292030 (The Witcher 3: Wild Hunt) inserted/updated
... (219 total)
✅ Import complete! 219 games in database.
```

### Option B: Manual Database Query

1. Use Railway's PostgreSQL explorer:
   - Click PostgreSQL service → "Data" tab
   
2. Run manual import:
   ```sql
   INSERT INTO games (appid, name, meta, created_at)
   SELECT 
     (meta->>'appId')::integer,
     meta->>'name',
     meta,
     NOW()
   FROM (
     SELECT jsonb_each(to_jsonb(games_array)) AS meta
   ) t
   ON CONFLICT (appid) DO UPDATE SET meta = EXCLUDED.meta;
   ```

### Option C: Use Control API

1. Get your ADMIN_TOKEN:
   ```bash
   echo $ADMIN_TOKEN
   ```

2. Use curl to add games individually:
   ```bash
   curl -X POST http://your-railway-url/games \
     -H "Content-Type: application/json" \
     -H "x-admin-token: $ADMIN_TOKEN" \
     -d '{"name":"Cyberpunk 2077","appId":1091500}'
   ```

## Step 5: Verify Database is Working

### Via Control Admin UI

1. Open: `http://your-railway-url/admin?token=YOUR_ADMIN_TOKEN`
2. You should see list of all games loaded from database
3. Try adding a test game via the form

### Via API Query

```bash
curl "http://your-railway-url/api/games?token=YOUR_ADMIN_TOKEN" \
  -H "x-admin-token: YOUR_ADMIN_TOKEN"
```

Expected response:
```json
[
  {"appId": 1091500, "name": "Cyberpunk 2077", ...},
  {"appId": 292030, "name": "The Witcher 3: Wild Hunt", ...},
  ...
]
```

### Via Railroad CLI

```bash
# Login to Railway
railway login

# Check your postgres service
railway postgres connect

# Query games table
SELECT COUNT(*) FROM games;
SELECT name, appid FROM games LIMIT 5;
```

## Step 6: Monitor Deployment

Watch logs in Railway dashboard:

```
[Logs]
✅ Connected to PostgreSQL
✅ Games table ready
✅ Loaded 219 games from database
🚀 Starting initial scan...
🔍 Fetching manifests for AppID 1091500 (Cyberpunk 2077)...
   ✅ Merged discovery: 28 unique depots
   📝 Generated: 1091500.lua
   ✅ GitHub upload SUCCESS!
   ✅ Sent to Discord (204)
```

## Troubleshooting

### Error: "Cannot connect to database"

**Cause:** `DATABASE_URL` not set or invalid  
**Fix:**
1. Check Railway PostgreSQL service is running (green status)
2. Manually copy `DATABASE_URL` from PostgreSQL Variables tab to your app Variables
3. Re-deploy

### Error: "Games table does not exist"

**Cause:** Database hasn't initialized yet  
**Fix:**
1. Wait 2-3 minutes for bot to create table
2. Or manually run migration script: `npm run migrate-games`
3. Check logs for any SQL errors

### Error: "ADMIN_TOKEN not set"

**Cause:** Control server won't start without ADMIN_TOKEN  
**Fix:**
1. Set `ADMIN_TOKEN` in Railway environment variables (generate new one if needed)
2. Restart deployment

### Games loading from JSON instead of DB

**Cause:** `DATABASE_URL` not set; bot falling back to `games.json`  
**Fix:**
1. Verify `DATABASE_URL` is in Railway environment
2. Restart bot
3. Check logs for `✅ Loaded X games from database` (not `from file`)

## Monitoring & Maintenance

### Regular Checks

```bash
# Check game count
curl "http://your-railway-url/api/games?token=TOKEN" | jq 'length'

# Check manifest discovery
curl "http://your-railway-url/admin?token=TOKEN"

# View recent manifests
ls -ltr /app/manifests/ | tail -20
```

### Database Backups

Railway automatically backs up your PostgreSQL database. To restore:

1. Go to PostgreSQL service → "Backups"
2. Select a backup point
3. Click "Restore"

### Scaling the Bot

If manifest discovery is slow:

1. Increase `CHECK_INTERVAL` in bot (default: 1 hour)
2. Or manually trigger processing via `/process` endpoint

## Performance Tips

1. **Use DB for persistence** (you are!) - survives Railway restarts
2. **Keep games.json updated** - fallback if DB unavailable
3. **Monitor manifest count** - if < 20 per game, check discovery sources
4. **Archive old manifests** - monthly cleanup of 6+ month old Lua files

## Next Steps

1. ✅ Deploy bot with PostgreSQL
2. ✅ Import 219 games via migration script
3. ✅ Test control API and admin UI
4. ✅ Verify GitHub uploads working
5. ✅ Verify Discord notifications working
6. ✅ Set up Railway scheduled task for periodic scans (optional)

---

**Questions?** Check `QUICK_START.md` and `ENHANCEMENT_REPORT.md` for additional deployment details.
