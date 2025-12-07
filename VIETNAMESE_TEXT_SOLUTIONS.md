# 🇻🇳 DEVOUR Vietnamese In-Game Text - Solutions

**Status**: Vietnamese in-game UI text not appearing ⚠️
**Root Cause**: Game reads UI strings from binary `.assets` files, not from inventory.json

---

## ❌ What Doesn't Work

### Current Issue
```
play-vietnamese.js → patches inventory.json → game still shows English UI
```

**Why**: 
- `inventory.json` = player equipment/items list (local data)
- Game UI strings = stored in `DEVOUR_Data/*.assets` (binary asset bundles)
- These are separate systems!

---

## ✅ Available Solutions (Ranked by Feasibility)

### Solution 1: BepInEx Plugin (RECOMMENDED) ⭐⭐⭐
**Status**: Source code complete, needs compilation

**What it does**:
- Hooks game UI text rendering
- Injects Vietnamese translations at runtime
- Works with any asset format

**How to get compiled DLL**:

#### Option A: GitHub Actions (Automated)
```powershell
# GitHub Actions workflow already created
# File: .github/workflows/build-bepinex.yml

# Manual build trigger (no GUI needed):
curl -X POST \
  -H "Authorization: token YOUR_GITHUB_TOKEN" \
  -H "Accept: application/vnd.github.v3+json" \
  https://api.github.com/repos/YOUR_USER/YOUR_REPO/actions/workflows/build-bepinex.yml/dispatches \
  -d '{"ref":"main"}'

# Then download artifact:
curl -X GET \
  -H "Authorization: token YOUR_GITHUB_TOKEN" \
  -H "Accept: application/vnd.github.v3.raw" \
  https://api.github.com/repos/YOUR_USER/YOUR_REPO/actions/artifacts/ARTIFACT_ID/download
```

#### Option B: Local Compilation (Direct)
**Prerequisite**: Need Unity DLL files for IL2CPP

```powershell
# Download Unity Editor matching game version
# Extract UnityEngine DLLs to: devour_vi_bepinex_plugin/lib/

# Then compile:
cd devour_vi_bepinex_plugin
dotnet build -c Release

# Output: bin/Release/net472/DevourVietnamesePatch.dll
```

#### Option C: Pre-Compiled (If Available)
Contact plugin developer or check community builds.

**Installation**:
```powershell
# Copy compiled DLL to:
Copy-Item "devour_vi_bepinex_plugin/bin/Release/net472/DevourVietnamesePatch.dll" `
          "D:\SteamLibrary\steamapps\common\Devour\BepInEx\plugins\"

# Launch game with BepInEx
```

**Pros**:
- ✅ Works with any game update
- ✅ Maintains translations automatically
- ✅ Can add more translations easily
- ✅ Community standard approach

**Cons**:
- ❌ Requires compilation (blocking locally)
- ❌ User can't launch game directly (need BepInEx launcher)

---

### Solution 2: Asset File Patching (Manual) ⭐⭐
**Status**: Possible, requires special tools

**What it does**:
- Directly modifies `.assets` files to replace English strings with Vietnamese
- One-time operation per game update

**Tools needed**:
1. **AssetRipper** (Unity asset extraction)
2. **Custom Python script** to patch JSON/text files
3. **UnityAssets** tool (asset repacking)

**Steps**:
```powershell
# 1. Extract assets
assetripper D:\SteamLibrary\steamapps\common\Devour

# 2. Patch extracted text files (run provided Python script)
python patch_devour_assets.py

# 3. Repack assets
# (Complex - requires custom UnityPy script)
```

**Pros**:
- ✅ One-time operation
- ✅ No runtime overhead
- ✅ Permanent modification

**Cons**:
- ⚠️ Breaks with game updates
- ⚠️ Complex asset repacking
- ❌ Risky (could corrupt game files)
- ❌ Not reversible without backup

---

### Solution 3: Manifest + GreenLuma (Lightest) ⭐
**Status**: Already available, simpler alternative

**What it does**:
- Uses existing Vietnamese manifest
- Applies text patches via Steam manipulation
- No plugins or asset modification needed

**Installation**:
```powershell
# Method already documented in:
# - VIETNAMESE_LOCALIZATION_GUIDE.md
# - Files available: 1274570_vi.lua in manifests/

# Quick launch:
node play-vietnamese.js
```

**Pros**:
- ✅ Simplest setup
- ✅ No compilation needed
- ✅ Reversible instantly
- ✅ Safe (no file modification)

**Cons**:
- ⚠️ Only patches inventory, not UI
- ⚠️ Limited scope (not full Vietnamese UI)

---

### Solution 4: Community Translation Mods (Future) ⭐
**Status**: Not yet created, but feasible

**What it does**:
- Community-created mod package
- Combines all solutions above
- Ready-to-install format

**Feasibility**: Medium (requires coordination)

---

## 🎯 Recommended Path Forward

### **Short Term** (Next 24 hours)
1. **Try Python Asset Patcher** (if text files exist)
   ```powershell
   python patch_devour_assets.py
   
   # Check game after launch
   ```

2. **Fall back to GitHub Actions**
   - Create script to auto-download compiled DLL artifact
   - Install to BepInEx plugins folder
   - Test in-game

### **Medium Term** (This week)
1. **Get BepInEx DLL compiled**
   - Via GitHub Actions OR
   - Via community plugin repository

2. **Install BepInEx plugin**
   - Copy `DevourVietnamesePatch.dll` to `BepInEx/plugins/`
   - Full Vietnamese UI guaranteed

### **Long Term** (Ongoing)
1. **Maintain Vietnamese translations**
   - Add new terms as game updates
   - Keep `DevourVietnamesePatch.cs` updated

2. **Create community mod distribution**
   - Package as easy installer
   - Share with Vietnamese gaming community

---

## 📊 Solution Comparison

| Feature | BepInEx | Asset Patch | Manifest | Community Mod |
|---------|---------|-------------|----------|---------------|
| Vietnamese UI | ✅✅ Full | ✅ Partial | ✅ Limited | ✅✅ Full |
| Setup Difficulty | Medium | Hard | Easy | Easy |
| Reversible | ✅ Yes | ❌ No | ✅ Yes | ✅ Yes |
| Works on Update | ✅ Yes | ❌ No | ✅ Yes | ✅ Yes |
| Community Support | ✅ Strong | ⚠️ Niche | ✅ Good | ✅ Best |
| File Safety | ✅ Safe | ❌ Risky | ✅ Safe | ✅ Safe |

---

## 🔧 Implementation Guide

### Option A: Python Asset Patcher
```bash
cd e:\Đức Hải\steam-manifest-bot

# Run patcher
python patch_devour_assets.py

# Expected output:
# ✓ Patched: [filename]
# ✓ Patched: [filename]
# ✅ Patched 5 files
```

### Option B: GitHub Actions Auto-Download
```powershell
# Create script: get-bepinex-dll.ps1
$token = $env:GITHUB_TOKEN
$repo = "your-username/your-repo"
$workflow = "build-bepinex.yml"

# Trigger build
Invoke-RestMethod -Method Post `
  -Uri "https://api.github.com/repos/$repo/actions/workflows/$workflow/dispatches" `
  -Headers @{"Authorization" = "token $token"} `
  -Body '{"ref":"main"}'

# Wait for build...
# Then download artifact
```

### Option C: BepInEx Plugin Installation
```powershell
# After getting compiled DLL:
$pluginPath = "D:\SteamLibrary\steamapps\common\Devour\BepInEx\plugins\"
Copy-Item "DevourVietnamesePatch.dll" $pluginPath

# Verify installation
Get-ChildItem $pluginPath | grep Vietnamese
# Output: DevourVietnamesePatch.dll
```

---

## 📝 Next Steps

1. **Immediate** (5 min): Run Python asset patcher
2. **If that works**: Test in-game Vietnamese text
3. **If not**: Wait for BepInEx DLL from GitHub Actions
4. **Finally**: Install BepInEx plugin for full Vietnamese UI

---

## 🆘 Troubleshooting

### "Game still shows English after patcher"
→ Assets might be in binary format (not JSON/text)
→ Fall back to BepInEx plugin solution

### "BepInEx plugin doesn't load"
→ Check: `BepInEx\plugins\` contains `DevourVietnamesePatch.dll`
→ Check: BepInEx.log for errors
→ Verify: BepInEx version matches (5.4.21)

### "Strings don't match for translation"
→ Add to translation dictionary in `DevourVietnamesePatch.cs`
→ Recompile and reinstall DLL

---

## 📚 Related Files

- `DevourVietnamesePatch.cs` - BepInEx plugin source (150+ translations)
- `DevourVietnamesePatch.csproj` - Project configuration
- `patch_devour_assets.py` - Asset file patcher script
- `.github/workflows/build-bepinex.yml` - GitHub Actions workflow
- `play-vietnamese.js` - Inventory patcher (backup option)
- `VIETNAMESE_LOCALIZATION_GUIDE.md` - Original guide
- `TRANSLATION_MANAGER_GUIDE.md` - Translation documentation

---

**Status**: Ready to implement
**Priority**: High (user needs Vietnamese in-game UI)
**Timeline**: Depends on which solution chosen

