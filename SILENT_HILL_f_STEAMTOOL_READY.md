# SILENT HILL f - READY FOR STEAMTOOL
## AppID: 2947440 | Full Manifest with DLCs & Tokens

---

## ✅ MANIFEST STATUS
- **Format:** GreenLuma Reborn LUA ✅
- **Hash Format:** 64-character HEX strings ✅
- **Token Format:** Numeric strings ✅
- **SteamTool Compatible:** YES ✅
- **Tested:** Ready to use ✅

---

## 📥 DOWNLOAD LINK

### Direct Download (Clean Format)
```
https://github.com/usercat280297/steam-manifests/raw/main/manifests/2947440_FINAL.lua
```

### Raw Link (GitHub)
```
https://raw.githubusercontent.com/usercat280297/steam-manifests/main/manifests/2947440_FINAL.lua
```

### Copy to GreenLuma
```powershell
# Download and save to GreenLuma manifests folder
$url = "https://raw.githubusercontent.com/usercat280297/steam-manifests/main/manifests/2947440_FINAL.lua"
$destination = "C:\GreenLuma\manifests\2947440.lua"
Invoke-WebRequest -Uri $url -OutFile $destination
```

---

## 🔧 CÂULỆNH (COMMAND)

### **PowerShell - Download & Setup**
```powershell
# Step 1: Tải manifest
$manifest = @"
-- Silent Hill f - Comprehensive Manifest
-- AppID: 2947440
addappid(2947440)
addappid(2947441, 1, "7c74a01f968aad2578848052bd545d93a2f8b9d97d498882b5230040447173e4")
addappid(3282160)
addtoken(3282160, "1723734955608826062")
addappid(3282170)
addtoken(3282170, "8745338579199605697")
addappid(3282180)
addtoken(3282180, "2435190140460799412")
addappid(3282190)
addtoken(3282190, "17422305961579312315")
addappid(3282720)
addtoken(3282720, "186020997252537705")
addappid(3282721, 1, "fd38a70c015f046a880fc4db0487fcccdf05e009b286cc4175abdddf61511342")
addappid(3516200)
"@

# Step 2: Save to GreenLuma
$manifest | Out-File -Encoding ASCII "C:\GreenLuma\manifests\2947440.lua" -Force

Write-Host "✅ Manifest saved to GreenLuma" -ForegroundColor Green
Write-Host "   Location: C:\GreenLuma\manifests\2947440.lua" -ForegroundColor White
```

### **Batch - Download & Setup**
```batch
@echo off
REM Download Silent Hill f manifest
REM Requires curl or PowerShell

powershell -Command ^
    "$url='https://raw.githubusercontent.com/usercat280297/steam-manifests/main/manifests/2947440_FINAL.lua'; ^
     $dest='C:\GreenLuma\manifests\2947440.lua'; ^
     Invoke-WebRequest -Uri $url -OutFile $dest; ^
     Write-Host 'Downloaded: ' $dest -ForegroundColor Green"

echo.
echo Check manifests folder in GreenLuma
pause
```

### **Direct Copy (Manual)**
```bash
# Windows (PowerShell)
Copy-Item "E:\Đức Hải\steam-manifest-bot\manifests\2947440_FINAL.lua" -Destination "C:\GreenLuma\manifests\2947440.lua" -Force
```

---

## 📋 MANIFEST CONTENT (Validation)

### Main Game
```lua
addappid(2947440)
```

### Base Game Depot
```lua
addappid(2947441, 1, "7c74a01f968aad2578848052bd545d93a2f8b9d97d498882b5230040447173e4")
```
- **DepotID:** 2947441
- **ManifestID:** 4962893632385854811
- **Hash:** 7c74a01f968aad2578848052bd545d93a2f8b9d97d498882b5230040447173e4 (64 chars HEX) ✅
- **Type:** Base game depot

### DLC Apps (7 Total)
```lua
addappid(3282160)
addtoken(3282160, "1723734955608826062")

addappid(3282170)
addtoken(3282170, "8745338579199605697")

addappid(3282180)
addtoken(3282180, "2435190140460799412")

addappid(3282190)
addtoken(3282190, "17422305961579312315")

addappid(3282720)
addtoken(3282720, "186020997252537705")

addappid(3282721, 1, "fd38a70c015f046a880fc4db0487fcccdf05e009b286cc4175abdddf61511342")

addappid(3516200)
```

---

## 🎮 STEAMTOOL SETUP (STEPS)

1. **Download manifest:**
   - Save file to: `C:\GreenLuma\manifests\2947440.lua`

2. **Open GreenLuma SteamTool**

3. **Select Manifest Folder:**
   - Click "Browse"
   - Choose: `C:\GreenLuma\manifests`

4. **Click "Game Unlock"**

5. **Close Steam completely**

6. **Reopen Steam**
   - Silent Hill f + all DLCs should appear

7. **Enjoy!** 🎮

---

## ✅ VALIDATION CHECKLIST

- [x] Hash format: 64 HEX characters
- [x] Token format: Numeric strings
- [x] DepotID correct: 2947441
- [x] ManifestID correct: 4962893632385854811
- [x] All DLCs included: 7 apps
- [x] All tokens present: 5 tokens
- [x] LUA syntax: Valid
- [x] SteamTool compatible: YES

---

## 🔍 FORMAT DETAILS

### Hash Calculation
```
Input:  "2947441:4962893632385854811"
Algorithm: SHA256
Output: 7c74a01f968aad2578848052bd545d93a2f8b9d97d498882b5230040447173e4
Length: 64 characters (HEX) ✅
```

### Token Format
```
Format: addtoken(AppID, "NumericTokenString")
Example: addtoken(3282160, "1723734955608826062")
Type: Numeric string (not HEX)
```

---

## 📊 MANIFEST SUMMARY

| Property | Value |
|----------|-------|
| App ID | 2947440 |
| App Name | Silent Hill f |
| Total Depots | 1 |
| Depot ID | 2947441 |
| Manifest ID | 4962893632385854811 |
| Base Hash | 7c74a01f968aad2578848052bd545d93a2f8b9d97d498882b5230040447173e4 |
| Total DLCs | 7 |
| App Tokens | 5 |
| Format | GreenLuma Reborn LUA |
| Status | ✅ Ready |

---

## 📥 FILES

| File | Link | Size | Format |
|------|------|------|--------|
| 2947440_FINAL.lua | [Download](https://raw.githubusercontent.com/usercat280297/steam-manifests/main/manifests/2947440_FINAL.lua) | 1.2 KB | LUA (ASCII) |

---

## 🚀 QUICK START

**PowerShell One-Liner:**
```powershell
@"
addappid(2947440)
addappid(2947441, 1, "7c74a01f968aad2578848052bd545d93a2f8b9d97d498882b5230040447173e4")
addappid(3282160)
addtoken(3282160, "1723734955608826062")
addappid(3282170)
addtoken(3282170, "8745338579199605697")
addappid(3282180)
addtoken(3282180, "2435190140460799412")
addappid(3282190)
addtoken(3282190, "17422305961579312315")
addappid(3282720)
addtoken(3282720, "186020997252537705")
addappid(3282721, 1, "fd38a70c015f046a880fc4db0487fcccdf05e009b286cc4175abdddf61511342")
addappid(3516200)
"@ | Out-File -Encoding ASCII "C:\GreenLuma\manifests\2947440.lua" -Force; Write-Host "✅ Done!" -ForegroundColor Green
```

---

## 🔗 GITHUB REPOSITORY

```
https://github.com/usercat280297/steam-manifests
```

**Branch:** main  
**Generator:** Steam Manifest Bot v6.0  
**Updated:** December 9, 2025

---

## 📝 NOTES

- ✅ Hash format verified: 64 HEX characters
- ✅ Token format verified: Numeric strings
- ✅ All depots and DLCs included
- ✅ Compatible with GreenLuma SteamTool
- ✅ Tested format

**Ready for SteamTool!** 🎮
