# 🚀 Quick Start Guide - Steam Manifest Bot v4.0

## 🎯 What This Bot Does
- Discovers Steam game manifests using **6 parallel sources**
- Generates Lua files for each game with depot/manifest info
- Uploads to GitHub Releases for distribution
- Notifies Discord when manifests update
- Supports online games with official manifest coverage

## 🔧 Local Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure `.env`
```env
# Required
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/YOUR_WEBHOOK
GITHUB_TOKEN=ghp_YOUR_TOKEN_HERE          # Generate on https://github.com/settings/tokens
GITHUB_REPO_OWNER=yourname
GITHUB_REPO_NAME=steam-manifests

# Security
ADMIN_TOKEN=9f8d6c4b2a1e7f0c3b9d4e6f8a7c2b1d  # Use value from local .env

# Optional
DATABASE_URL=postgresql://user:pass@host/db  # For Postgres mode
IMPORT_GAMES_JSON=false                       # Import games.json on startup
FORCE_FIRST_SEND=true                        # Send even if no change (testing)
NOTIFY_FAILURES=false                        # Discord notification on errors
```

### 3. Run Locally
```bash
# File-backed mode (uses games.json)
node manifest-bot.js

# DB-backed mode (uses Postgres)
export DATABASE_URL=postgresql://...
npm run migrate-games    # One-time import
node manifest-bot.js
```

---

## 🚁 Railway Deployment

### 1. Create Railway Variables
Set in Railway dashboard (no `.env` commit):
```
DISCORD_WEBHOOK_URL = ...
GITHUB_TOKEN = ghp_...        # ⚠️ ROTATE IMMEDIATELY! (was exposed)
GITHUB_REPO_OWNER = usercat280297
GITHUB_REPO_NAME = steam-manifests
ADMIN_TOKEN = [from local .env]
NODE_ENV = production
API_PORT = 3000
RAILWAY_ENVIRONMENT = production
```

### 2. Add Postgres (Optional)
- Railway → Add Service → Postgres
- Railway auto-populates `DATABASE_URL`
- Set `IMPORT_GAMES_JSON=true` for first deployment

### 3. Deploy
- Connect GitHub repo to Railway
- Railway auto-deploys on push to `main`

---

## 📊 Games List

**Current:** 219 curated games
- File: `games.json` (file-backed mode)
- DB: `games` table in Postgres (DB-backed mode)

### Add a Game
```bash
# Via API endpoint (requires ADMIN_TOKEN)
curl -X POST http://localhost:3000/games \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "New Game", "appId": 123456}'

# Via games.json (file-backed)
# Edit games.json, bot detects changes automatically
```

---

## 🎮 Control Panel (`/admin`)

Access at `http://localhost:3000/admin` (requires `ADMIN_TOKEN`)

### Features
- 📋 View all games
- ➕ Add new game
- ⚡ Trigger manifest fetch for specific appId
- 📊 View statistics

### Security
- Protected by `ADMIN_TOKEN` header or query param
- Set in `.env` or Railway
- Do NOT commit to repo

---

## 🔍 Manifest Discovery (6 Methods)

Bot probes all sources in parallel:

1. **Steam CDN API** (Confidence: 100)
   - Official Steam depot info
   - Usually has public branch

2. **SteamCMD Info API** (Confidence: 95)
   - All available branches
   - Best for multi-branch games

3. **Steam Content API** (Confidence: 90)
   - Official depot listing
   - Includes DLC info

4. **SteamDB Scraper** (Confidence: 85)
   - Community-sourced data
   - Good for hidden depots

5. **Steam Store API** (Confidence: 80)
   - Package info
   - Handles region variants

6. **Community Fallback** (Confidence: 60)
   - Last resort
   - May have stale data

### Result
- All results merged and deduplicated
- Ranked by confidence + branch type
- Returns 20-100+ manifests per game

**Example:**
```
✅ Merged discovery: 64 unique depots from 3 sources
   Top 3 by confidence: 292031(125), 292032(125), 292033(125)
```

---

## 📈 Features

### ✅ Smart Ranking
- Public/Live branches prioritized
- Beta branches secondary
- Dev branches deprioritized
- Per-source confidence weighting

### ✅ Automatic Retry
- Retries discovery if < 2 manifests found
- 2-second delay between attempts
- Logs attempt count

### ✅ File Watcher (Optional)
- Watches `games.json` for changes
- Auto-detects added/updated entries
- Triggers processing without restart

### ✅ Persistent State
- `last_manifest_state.json` — tracks processed manifests
- `last_build_state.json` — build history
- Auto-saves every 10 games

### ✅ Error Handling
- Timeout per probe (8s)
- Graceful fallbacks
- Detailed logging (enable with `DETAILED_LOGGING=true`)

### ✅ Rate Limiting
- Configurable delays between API calls
- Random user agents
- Batch processing with pauses

---

## 🔐 Security Best Practices

### ✅ DO:
- Set `ADMIN_TOKEN` in Railway (never commit `.env`)
- Rotate `GITHUB_TOKEN` immediately (exposed in repo history)
- Use strong webhook URLs
- Enable GitHub push protection

### ❌ DON'T:
- Commit `.env` file with secrets
- Use the same token across projects
- Share webhook URLs publicly
- Disable push protection

---

## 📋 Common Commands

```bash
# Run locally (file-backed)
node manifest-bot.js

# Run with DB (after setup)
DATABASE_URL=postgresql://... node manifest-bot.js

# Migrate games.json to Postgres (one-time)
npm run migrate-games

# Reconcile games/state files
node reconcile-games.js

# Check syntax
node -c manifest-bot.js

# List all games
node -e "console.log(require('./games.json').length)"
```

---

## 🐛 Troubleshooting

### Bot fails to start
```
❌ Error: Cannot find module 'pg'
→ Solution: npm install pg
```

### No Discord notifications
```
✅ Check: DISCORD_WEBHOOK_URL is valid
✅ Check: Bot queued messages (see queue processor logs)
✅ Check: Discord webhook permissions
```

### GitHub upload fails
```
✅ Check: GITHUB_TOKEN is valid and not expired
✅ Check: Repo exists and you have push access
✅ Check: GitHub push protection (allow the secret)
```

### Manifests not found
```
✅ Check: AppId is correct (Steam page URL: https://store.steampowered.com/app/APPID)
✅ Check: Game supports manifests (many indie/online games don't)
✅ Check: Discovery probes completed (see logs)
```

---

## 📞 Support

### Documentation
- `ENHANCEMENT_REPORT.md` — Technical details
- `manifest-template.README.md` — Testing templates
- `README.md` — Original docs

### Logs
- Console output shows all processing steps
- Enable `DETAILED_LOGGING=true` for verbose output
- Check `last_manifest_state.json` for processed games

---

## 🎯 Next Steps

1. **Rotate GitHub Token** (URGENT)
   - Go to https://github.com/settings/tokens
   - Revoke the exposed token
   - Create a new PAT with `repo` scope
   - Update `.env` and Railway

2. **Deploy to Railway**
   - Set all environment variables
   - Deploy from main branch
   - Monitor console logs

3. **Add More Games** (Optional)
   - Use `/admin` UI to add via browser
   - Or edit `games.json` directly (file-backed mode)

4. **Monitor Performance**
   - Watch Discord for notifications
   - Check GitHub Releases for uploads
   - Review console logs for errors

---

**Bot Version:** v4.0 - Ultra Detailed  
**Last Updated:** 2025-12-06  
**Status:** 🟢 Production Ready
