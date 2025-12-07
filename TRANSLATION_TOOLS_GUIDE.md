# 🎮 Game Translation Tools & Workflow

Complete guide to translate any game into Vietnamese using the translation system.

## 📋 Table of Contents
1. [Tools You Need](#tools-you-need)
2. [Workflow Overview](#workflow-overview)
3. [Step-by-Step Tutorial](#step-by-step-tutorial)
4. [File Extraction Tools](#file-extraction-tools)
5. [Translation Management](#translation-management)
6. [Discord Integration](#discord-integration)
7. [Testing & Deployment](#testing--deployment)

---

## 🛠️ Tools You Need

### 1. **translation-manager.js** ✅ (Already Have)
   - Manages translation projects
   - Parses JSON, CSV, .po files
   - Tracks progress in MongoDB
   - Exports in original format

### 2. **discord-translation-bot.js** ✅ (Just Created)
   - Discord integration for project tracking
   - Status updates via embeds
   - Slash commands for management
   - Real-time progress notifications

### 3. **File Extraction Tools** (Need to Set Up)
   - **Game File Extractors** per game type
   - **Translation Memory (TM)** tools
   - **QA Checkers** for consistency

### 4. **Text Editors for Translators**
   - Visual Studio Code (with i18n extensions)
   - CAT Tools (Poedit, OmegaT - optional)
   - Online tools (DeepL, Google Translate for reference)

---

## 📊 Workflow Overview

```
┌─────────────────────────────────────────┐
│  1. Create Translation Project          │
│     node translation-manager.js create  │
└──────────────┬──────────────────────────┘
               ↓
┌─────────────────────────────────────────┐
│  2. Extract Game Files                  │
│     (JSON, CSV, .po from game)          │
└──────────────┬──────────────────────────┘
               ↓
┌─────────────────────────────────────────┐
│  3. Add Files to Project                │
│     node translation-manager.js add     │
└──────────────┬──────────────────────────┘
               ↓
┌─────────────────────────────────────────┐
│  4. Translate Strings                   │
│     (JSON editor / .po editor)          │
└──────────────┬──────────────────────────┘
               ↓
┌─────────────────────────────────────────┐
│  5. Review & QA                         │
│     (Check consistency, typos)          │
└──────────────┬──────────────────────────┘
               ↓
┌─────────────────────────────────────────┐
│  6. Export to Game Format               │
│     node translation-manager.js export  │
└──────────────┬──────────────────────────┘
               ↓
┌─────────────────────────────────────────┐
│  7. Test in Game                        │
│     Replace files + test gameplay       │
└──────────────┬──────────────────────────┘
               ↓
┌─────────────────────────────────────────┐
│  8. Deploy to GitHub/Discord            │
│     Share Vietnamese mod/patch          │
└─────────────────────────────────────────┘
```

---

## 📝 Step-by-Step Tutorial

### Step 1: Create Translation Project

```bash
# Create a new translation project for a game
node translation-manager.js create 1274570 "Devour" "YourName"

# Output will show:
# ✅ Project created
# ProjectID: 1274570_1234567890
```

### Step 2: Find & Extract Game Files

**Popular Game File Locations:**

#### Unity Games
```
Game_Data/
├── StreamingAssets/
│   └── [Language files in JSON/YAML]
├── Managed/
│   └── Assembly-CSharp.dll (contains strings)
└── Resources/
    └── [Localization data]
```

**Extract with:**
```bash
# If game uses JSON
# Simply copy StreamingAssets/[language] folder

# If game uses YAML
# Use yaml2json converter (npm install -g js-yaml-cli)
yaml2json config.yaml > config.json

# If game uses .po files
# Copy directly - our tool handles them
```

#### Unreal Engine Games
```
[Game]/Content/
├── Localization/
│   └── [Language]/
│       └── *.po files
└── L10N/
    └── [format specific]
```

**Extract Unreal strings:**
```bash
# Unreal Engine Localization Export
# Open UE Editor → Tools → Localization Dashboard
# Export to .po or JSON format
```

#### Godot/Custom Engines
```
- Check game's data folder structure
- Common formats: JSON, CSV, .po, XML
- Look for "localization", "lang", "strings" folders
```

### Step 3: Add Files to Project

```bash
# Add a JSON translation file
node translation-manager.js add 1274570_1234567890 ./game_strings.json localization

# Add a CSV spreadsheet
node translation-manager.js add 1274570_1234567890 ./dialogues.csv dialogue

# Add a .po file (Gettext)
node translation-manager.js add 1274570_1234567890 ./messages.po menu
```

**File Format Examples:**

#### JSON Format
```json
{
  "ui": {
    "menu": {
      "play": "Play Game",
      "settings": "Settings",
      "quit": "Quit"
    },
    "dialogue": {
      "npc_greet": "Hello, welcome!",
      "npc_farewell": "See you later!"
    }
  }
}
```

After extraction, you'll translate to:
```json
{
  "ui": {
    "menu": {
      "play": "Chơi Game",
      "settings": "Cài Đặt",
      "quit": "Thoát"
    },
    "dialogue": {
      "npc_greet": "Xin chào, chào mừng!",
      "npc_farewell": "Tạm biệt!"
    }
  }
}
```

#### CSV Format
```csv
Key,English,Vietnamese,Status
ui.menu.play,Play Game,Chơi Game,Completed
ui.menu.settings,Settings,Cài Đặt,Completed
ui.menu.quit,Quit,Thoát,Completed
ui.dialogue.npc_greet,Hello welcome!,Xin chào chào mừng!,Pending
```

#### .po Format (Gettext)
```po
#: ui/menu.c:42
msgid "Play Game"
msgstr "Chơi Game"

#: ui/menu.c:43
msgid "Settings"
msgstr "Cài Đặt"

#: ui/dialogue.c:100
msgid "Hello, welcome!"
msgstr "Xin chào, chào mừng!"
```

### Step 4: Translate Strings

#### Option A: Edit JSON in VS Code
1. Open exported JSON file
2. Edit Vietnamese values
3. Save file
4. Tool automatically tracks changes

```json
{
  "greeting": "Hello" → "Xin chào",
  "farewell": "Goodbye" → "Tạm biệt"
}
```

#### Option B: Use CSV in Excel/Google Sheets
1. Edit Vietnamese column
2. Save as CSV
3. Tool re-imports changes

#### Option C: Use Poedit for .po Files
1. Download: https://poedit.net/
2. Open .po file
3. Edit msgstr values
4. Save file
5. Tool handles rest

#### Option D: Online Tools (for quick reference)
- **DeepL:** https://www.deepl.com/translator (better quality)
- **Google Translate:** https://translate.google.com (good for reference)
- **Lingvanex:** For specific gaming terminology

**Translation Tips:**
```
❌ Bad: Literal word-by-word translation
✅ Good: Natural, context-aware Vietnamese

Example - "Defeat All Enemies"
❌ Dịch máy: "Đánh bại Tất cả Kẻ thù"
✅ Tốt hơn: "Tiêu diệt Tất cả Địch"

Example - "Level Up"
❌ Dịch máy: "Nâng cấp Cấp độ"
✅ Tốt hơn: "Lên Level"
```

### Step 5: Review & QA

**Consistency Check:**
```bash
# Before export, check for duplicates/inconsistencies
grep -E '"[^"]*":' translations.json | sort | uniq -d

# Use online tools for spell check
# Common Vietnamese gaming terms should match:
- NPC → NPC (không dịch)
- Boss → Boss (không dịch)
- Quest → Nhiệm vụ
- Dungeon → Hầm/Tháp
- Item → Vật phẩm
- Skill → Kỹ năng
```

**Testing Checklist:**
- [ ] No untranslated strings (marked as "")
- [ ] Consistent terminology across files
- [ ] No broken Unicode characters
- [ ] Vietnamese tone marks correct (à, á, ả, ã, ạ)
- [ ] Game-specific terms match glossary
- [ ] Character limit not exceeded (if any)

### Step 6: Export to Game Format

```bash
# Export back to original JSON format
node translation-manager.js export 1274570_1234567890 file_id ./output_vi.json

# Export as CSV for backup
node translation-manager.js export 1274570_1234567890 file_id ./output_vi.csv

# Export as .po for Gettext
node translation-manager.js export 1274570_1234567890 file_id ./output_vi.po
```

### Step 7: Test in Game

```
1. Backup original game files
   Copy [Game]/data/ → [Game]/data_backup/

2. Replace with Vietnamese versions
   Copy output_vi.json → [Game]/StreamingAssets/[language]/

3. Launch game and test
   - Check all UI text
   - Check all dialogues
   - Check all menus
   - Verify formatting

4. Report any issues
   - Take screenshots
   - Note exact location
   - Update translation
   - Re-export and test

5. Final QA
   - Play through main story
   - Test all dialogue options
   - Check all menu items
   - Verify item descriptions
```

### Step 8: Deploy & Share

```bash
# Update MongoDB with completion status
# Commit to GitHub

git add output_vi.json
git commit -m "Vietnamese translation for Devour (1274570) - 100% complete"
git push origin main

# Share on Discord via bot
/project_status [projectid]
/translation_progress [projectid]

# Create mod installer (optional)
# Provide download link for players
```

---

## 📁 File Extraction Tools

### Tool 1: **Game File Finder Script**
```bash
# Create file: find-game-strings.js
# Scans game folder for common translation files

node find-game-strings.js "C:\Path\To\Game"

# Output:
# ✅ Found: game_data.json (2500 strings)
# ✅ Found: ui_strings.json (400 strings)
# ✅ Found: dialogue.csv (800 strings)
# ✅ Found: messages.po (1200 strings)
```

### Tool 2: **Batch File Converter**
```bash
# Create file: convert-game-files.js
# Convert between JSON/CSV/.po formats

node convert-game-files.js input.json output.csv

# Handles nested JSON flattening
# Preserves all string data
# Maintains ID/context information
```

### Tool 3: **String Statistics Tool**
```bash
# Create file: count-strings.js
# Count and analyze strings in project

node count-strings.js projectid

# Output:
# Total strings: 5,000
# Translated: 3,200 (64%)
# Pending: 1,800 (36%)
# By category:
#   - Dialogue: 2,500 (1,600 done)
#   - UI: 1,500 (1,000 done)
#   - Items: 1,000 (600 done)
```

---

## 🎯 Translation Management

### Progress Tracking
```bash
# Check project progress
node translation-manager.js list

# Get detailed stats
node translation-manager.js status projectid

# Export progress report
node translation-manager.js report projectid > report.json
```

### Team Collaboration (If you add team members later)
```bash
# Assign translator to file
node translation-manager.js assign projectid file_id translator

# Lock file to prevent conflicts
node translation-manager.js lock projectid file_id

# Merge multiple translations
node translation-manager.js merge projectid [file1, file2, ...]
```

---

## 🤖 Discord Integration

### Setup Discord Bot

**Prerequisites:**
```bash
npm install discord.js dotenv

# Create .env file
DISCORD_BOT_TOKEN=your_bot_token
DISCORD_GUILD_ID=your_guild_id
TRANSLATION_CHANNEL_ID=your_channel_id
```

**Get Bot Token:**
1. Go to https://discord.com/developers/applications
2. Create New Application
3. Go to Bot section
4. Copy Token
5. Enable "Message Content Intent"
6. Add to your server with link

**Run Bot:**
```bash
node discord-translation-bot.js

# Bot will respond to:
/project_create [appid] [game] [translator]
/project_list
/project_status [projectid]
/translation_progress [projectid]
/file_add [projectid] [filetype]
```

### Discord Features
- ✅ Create projects from Discord
- ✅ Track progress in real-time
- ✅ Get notifications on milestones (50%, 100%)
- ✅ View project statistics
- ✅ Manage team assignments
- ✅ Automatic status updates hourly

---

## 🧪 Testing & Deployment

### Local Testing
```bash
# Test with sample game
npm test

# Test translation with mock data
node translation-manager.js create 999999 "TestGame" "Tester"
node translation-manager.js add 999999_* ./test_strings.json test

# Verify MongoDB integration
mongosh steam-manifest --eval "db.translation_projects.find({})"
```

### Quality Assurance
```
1. ✅ All strings translated
2. ✅ No corruption in special characters
3. ✅ Game loads without errors
4. ✅ All menus readable
5. ✅ Dialogues flow naturally
6. ✅ Items/descriptions make sense
7. ✅ No overlapping text in UI
8. ✅ Game performance same as original
```

### Deployment Checklist
```
Before Release:
- [ ] All strings 100% translated
- [ ] QA testing complete
- [ ] No crashes or errors
- [ ] Discord bot confirms completion
- [ ] GitHub release created
- [ ] Download link working
- [ ] Installation instructions clear
- [ ] Screenshots provided
- [ ] Credits to translators added
```

---

## 📚 Glossary of Gaming Terms

**Common Vietnamese Gaming Translations:**

```
English → Vietnamese (Recommended)
=========================================
RPG → RPG / Nhập vai
Quest → Nhiệm vụ
Dungeon → Hầm
Boss → Boss / Trùm
NPC → NPC
Item → Vật phẩm
Skill → Kỹ năng
Level → Level / Cấp độ
Experience → Kinh nghiệm
Equipment → Trang bị
Inventory → Túi đồ
Shop → Cửa hàng
Weapon → Vũ khí
Armor → Áo giáp
Health → Máu / Sinh lực
Mana → Mana / Năng lượng
Strength → Sức mạnh
Agility → Nhanh nhạy
Intelligence → Trí tuệ
Attack → Tấn công
Defense → Phòng thủ
Critical Hit → Chí mạng
Status Effect → Hiệu ứng trạng thái
Buff → Tăng cường
Debuff → Suy yếu
Poison → Độc
Freeze → Đóng băng
Fire → Lửa
Water → Nước
Wind → Gió
Earth → Đất
Lightning → Sét / Điện
```

---

## 🚀 Next Steps

1. **Start with a small game** (e.g., Devour - 1274570)
2. **Create project** and add first file
3. **Translate small section** (50-100 strings)
4. **Test in game** to verify format
5. **Fix any issues** discovered
6. **Scale up** to full translation
7. **Deploy** to GitHub/Discord
8. **Share** with community

---

## ❓ Troubleshooting

### Problem: "MongoDB connection failed"
```bash
# Check MongoDB is running
mongosh

# If not installed, install:
# Windows: Download from https://www.mongodb.com/try/download/community
# Mac: brew install mongodb-community
```

### Problem: "Cannot parse JSON file"
```bash
# Validate JSON format
cat strings.json | jq .

# If invalid, fix syntax and retry
```

### Problem: "Special characters corrupted"
```bash
# Ensure file is saved as UTF-8
# In VS Code: File → Save with Encoding → UTF-8

# Check string encoding
file -i strings.json
# Should show: text/plain; charset=utf-8
```

### Problem: "Game doesn't load translation"
```bash
# 1. Verify file location matches game's expectation
# 2. Check file format matches original
# 3. Verify JSON/CSV/po syntax is correct
# 4. Check permissions on file
# 5. Try with original file first to confirm path
```

---

## 📞 Support & Resources

- **Discord Bot Issues:** Check bot logs in Discord
- **Translation Questions:** Refer to glossary section
- **MongoDB Issues:** Check MongoDB documentation
- **Game-Specific:** Research game modding community

---

**Created:** December 2025
**Last Updated:** December 7, 2025
**Language:** English/Vietnamese
