# 🎮 DEVOUR Vietnamese - Simple Launcher (No BepInEx!)

## ⚡ Quick Start (30 seconds!)

```bash
node play-vietnamese.js
```

That's it! Game launches in Vietnamese automatically.

## What It Does

1. **Backs up** English inventory
2. **Patches** game inventory with Vietnamese translations
3. **Launches** DEVOUR
4. **Auto-restores** English when game closes

## Features

✅ **Instant** - No compilation, no waiting  
✅ **Safe** - Automatic English restoration  
✅ **Simple** - One command to play  
✅ **200+ translations** - Items, characters, perks  
✅ **Works online** - Game files unchanged  

## Installation

1. Have DEVOUR installed: `D:\SteamLibrary\steamapps\common\Devour`
2. Have Node.js installed
3. Clone or download this repo
4. Run: `node play-vietnamese.js`

## Options

### Interactive Version
```bash
node devour-complete-launcher.js
# Choose language (vi/en)
```

### Monitor Version
```bash
node devour-vi-monitor.js
# Runs in background, watches for file changes
```

### Restore English
```bash
# Just delete inventory.json backup, or:
# Copy from inventory.json.en manually
```

## Translations Included

**200+ terms including:**
- Characters: Moonless Night → Đêm Không Trăng
- Perks: Acceleration → Tăng Tốc, Claws Out → Móng Vuốt Ra
- Items: Light → Ánh Sáng, Rope → Sợi Dây
- UI: Survive → Sống Sót, Escape → Trốn Thoát

## Troubleshooting

**Game not launching?**
- Check `D:\SteamLibrary\steamapps\common\Devour\DEVOUR.exe` exists
- Close game completely before running again

**No Vietnamese text?**
- inventory.json wasn't modified correctly
- Check file permissions in game folder

**Want to add more translations?**
- Edit `VI_DICT` object in `play-vietnamese.js`
- Add: `'English': 'Tiếng Việt'`

## Why This Approach?

vs BepInEx:
- ✅ Works immediately
- ✅ No compilation
- ✅ No GitHub dependencies
- ✅ Simple debugging
- ✅ Works 100% locally

## Advanced Options

**Manual Translation:**
```javascript
const VI_DICT = {
  'English Name': 'Tên Tiếng Việt',
  // Add more...
};
```

**Schedule Regular Patching:**
```bash
# Every time game starts
node play-vietnamese.js
```

## Performance

- ✅ No impact on FPS
- ✅ Instant launch
- ✅ Memory efficient
- ✅ Works online

---

**Ready to play in Vietnamese?** Just run: `node play-vietnamese.js`
