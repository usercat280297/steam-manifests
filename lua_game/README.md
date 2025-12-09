# 🎮 LUA GAME MANIFESTS

Folder này chứa **manifest files** cho GreenLuma - định dạng `.lua` sẵn sàng dùng cho SteamTool.

---

## 📥 AVAILABLE GAMES

### **1. Silent Hill f (2947440)**
- **File:** `2947440_SilentHillf.lua`
- **Size:** 810 bytes
- **Features:** Base game + 7 DLCs + 5 app tokens
- **Status:** ✅ Tested & Ready
- **Hash Format:** 64-char HEX ✅

```lua
addappid(2947440)
addappid(2947441, 1, "7c74a01f968aad2578848052bd545d93a2f8b9d97d498882b5230040447173e4")
-- + 7 DLCs with tokens
```

---

### **2. Silent Hill 2 (2124490)**
- **File:** `2124490_SilentHill2.lua`
- **Size:** 2445 bytes
- **Features:** Base game
- **Status:** ✅ Ready

```lua
addappid(2124490)
addappid(2124491, 1, "...")
```

---

### **3. Sushi House (3687470)**
- **File:** `3687470_SushiHouse.lua`
- **Size:** 197 bytes
- **Features:** Base game
- **Status:** ✅ Ready

```lua
addappid(3687470)
addappid(3687471, 1, "7c74a01f968aad2578848052bd545d93a2f8b9d97d498882b5230040447173e4")
```

---

### **4. Realm of the Mad God (200210)**
- **File:** `200210_RealmMadGod.lua`
- **Size:** 3527 bytes
- **Features:** 2 base depots + 6 DLCs
- **Status:** ✅ Ready

```lua
addappid(200210)
addappid(200211, 0, "e01ad1313cae36070b7cf01e260842cf00679ef43feef692bf98609b208b96cc")
addappid(200212, 0, "d3f02f52ec4c8ab99d771a29d8c66cf04eca4a8fd4444565c157f1e30b9adbfd")
-- + 6 DLC apps
```

---

## 🚀 USAGE

### **Option 1: Direct Copy**
```powershell
Copy-Item "lua_game/2947440_SilentHillf.lua" "C:\GreenLuma\manifests\2947440.lua" -Force
```

### **Option 2: From GitHub**
```powershell
$url = "https://github.com/usercat280297/steam-manifests/raw/main/lua_game/2947440_SilentHillf.lua"
Invoke-WebRequest -Uri $url -OutFile "C:\GreenLuma\manifests\2947440.lua" -UseBasicParsing
```

### **Option 3: Manual**
1. Open folder: `E:\Đức Hải\steam-manifest-bot\lua_game`
2. Copy desired `.lua` file
3. Paste to: `C:\GreenLuma\manifests\`
4. Rename to: `{AppID}.lua` (e.g., `2947440.lua`)

---

## 🔧 STEAMTOOL SETUP

1. **Copy manifest file** to `GreenLuma\manifests\`
2. **Rename** to `{AppID}.lua`
3. **Open GreenLuma SteamTool**
4. **Select manifest folder** → `C:\GreenLuma\manifests`
5. **Click "Game Unlock"**
6. **Restart Steam**
7. **Game appears in library** 🎮

---

## 📊 FILE REFERENCE

| AppID | Game | File | Depots | DLCs | Tokens |
|-------|------|------|--------|------|--------|
| 2947440 | Silent Hill f | `2947440_SilentHillf.lua` | 1 | 7 | 5 ✅ |
| 2124490 | Silent Hill 2 | `2124490_SilentHill2.lua` | 1 | - | - |
| 3687470 | Sushi House | `3687470_SushiHouse.lua` | 1 | - | - |
| 200210 | Realm of Mad God | `200210_RealmMadGod.lua` | 2 | 6 | - |

---

## ✅ VERIFICATION

### Hash Format
- **Type:** SHA256
- **Length:** 64 characters (HEX)
- **Format:** `addappid(DepotID, 1, "hash")`

### Token Format
- **Type:** Numeric string
- **Format:** `addtoken(AppID, "token_number")`

### Example (Silent Hill f)
```lua
-- Base Depot
addappid(2947441, 1, "7c74a01f968aad2578848052bd545d93a2f8b9d97d498882b5230040447173e4")

-- DLC with Token
addappid(3282160)
addtoken(3282160, "1723734955608826062")
```

---

## 🔗 GITHUB LINKS

### Raw Files (Download)
```
https://github.com/usercat280297/steam-manifests/raw/main/lua_game/2947440_SilentHillf.lua
https://github.com/usercat280297/steam-manifests/raw/main/lua_game/2124490_SilentHill2.lua
https://github.com/usercat280297/steam-manifests/raw/main/lua_game/3687470_SushiHouse.lua
https://github.com/usercat280297/steam-manifests/raw/main/lua_game/200210_RealmMadGod.lua
```

### View Files
```
https://github.com/usercat280297/steam-manifests/tree/main/lua_game
```

---

## 📝 NAMING CONVENTION

Files follow format: `{AppID}_{GameName}.lua`

Examples:
- `2947440_SilentHillf.lua` → AppID 2947440 = Silent Hill f
- `2124490_SilentHill2.lua` → AppID 2124490 = Silent Hill 2
- `3687470_SushiHouse.lua` → AppID 3687470 = Sushi House

---

## 🎯 QUICK COMMANDS

### PowerShell Download All
```powershell
$games = @(
    "2947440_SilentHillf",
    "2124490_SilentHill2",
    "3687470_SushiHouse",
    "200210_RealmMadGod"
)

$baseUrl = "https://github.com/usercat280297/steam-manifests/raw/main/lua_game"

foreach ($game in $games) {
    $url = "$baseUrl/${game}.lua"
    $dest = "C:\GreenLuma\manifests\${game}.lua"
    Invoke-WebRequest -Uri $url -OutFile $dest -UseBasicParsing
    Write-Host "✓ Downloaded: $game" -ForegroundColor Green
}
```

---

## ⚙️ TROUBLESHOOTING

### ❌ File not working in SteamTool
1. Check filename = AppID: `2947440.lua`
2. Check folder: `GreenLuma\manifests\`
3. Verify hash format: 64 HEX characters
4. Restart SteamTool

### ❌ 404 Error
- Use GitHub raw links: `github.com/...raw/main/...`
- Or copy from local folder

### ❌ Game not appearing
- Copy file to `GreenLuma\manifests\`
- Restart Steam completely
- Run SteamTool "Game Unlock"

---

**Last Updated:** December 9, 2025  
**Repository:** https://github.com/usercat280297/steam-manifests  
**Generator:** Steam Manifest Bot v6.0
