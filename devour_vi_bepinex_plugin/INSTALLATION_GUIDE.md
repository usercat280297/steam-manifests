# BepInEx Vietnamese Plugin Installation Guide

## 🎮 What is This?

A BepInEx plugin that patches DEVOUR game text to Vietnamese at runtime. No file modification needed - safe and fast!

## 📋 Prerequisites

- **Windows 10/11** (x64)
- **DEVOUR Game** (Steam, AppID 1274570)
- **~500MB free space** for BepInEx

## 🚀 Installation Steps

### Method 1: Automatic Installation (Recommended)

**Step 1: Download BepInEx**
- Visit: https://github.com/BepInEx/BepInEx/releases/tag/v5.4.21
- Download `BepInEx_x64_5.4.21.zip` (or higher)
- Extract to your game folder: `D:\SteamLibrary\steamapps\common\Devour`
  - After extraction, you should see: `D:\...\Devour\BepInEx\` folder

**Step 2: Run the Installer**
```powershell
cd devour_vi_bepinex_plugin
powershell -ExecutionPolicy Bypass -File install.ps1
```

**What it does:**
- ✅ Detects game folder
- ✅ Checks/downloads BepInEx
- ✅ Compiles or downloads plugin DLL
- ✅ Copies DLL to plugins folder

### Method 2: Manual Installation

If automatic fails:

**Step 1: Download/Extract BepInEx**
```bash
# BepInEx 5.4.21 (x64)
https://github.com/BepInEx/BepInEx/releases/download/v5.4.21/BepInEx_x64_5.4.21.zip
# Extract to: D:\SteamLibrary\steamapps\common\Devour
```

**Step 2: Get Plugin DLL**

Option A - Download from GitHub Actions:
```bash
cd devour_vi_bepinex_plugin
node download-dll.js
```

Option B - Compile locally:
```bash
# Requires .NET SDK 6.0+: https://dotnet.microsoft.com/
cd devour_vi_bepinex_plugin
powershell -ExecutionPolicy Bypass -File download-dependencies.ps1
dotnet build -c Release
```

**Step 3: Copy DLL**
```bash
# Copy the DLL to:
# D:\SteamLibrary\steamapps\common\Devour\BepInEx\plugins\

Copy-Item "bin\Release\net472\DevourVietnamesePatch.dll" `
  -Destination "D:\SteamLibrary\steamapps\common\Devour\BepInEx\plugins\" -Force
```

## 🎮 Running the Game

**With Plugin (Vietnamese):**
```bash
# Just launch normally from Steam
# BepInEx loads automatically
```

**Without Plugin (English):**
```bash
# Rename/move the plugins folder temporarily
# Or uninstall BepInEx
```

## 🐛 Troubleshooting

### Game crashes on startup
- **Check**: `D:\...\Devour\BepInEx\LogOutput.log`
- **Solution**: Update to latest Windows/graphics drivers

### Plugin doesn't work (no Vietnamese text)
- **Check**: Plugin DLL exists at `BepInEx\plugins\DevourVietnamesePatch.dll`
- **Solution**: Re-run installer or manually copy DLL

### "BepInEx not found" error
- **Check**: BepInEx folder exists at `D:\...\Devour\BepInEx\`
- **Solution**: Download BepInEx 5.4.21 manually from GitHub

### Compilation errors
- **Check**: .NET 6 SDK installed: `dotnet --version`
- **Solution**: Install from https://dotnet.microsoft.com/

## 📦 What Gets Installed

```
D:\SteamLibrary\steamapps\common\Devour\
├── BepInEx\
│   ├── core\                    (BepInEx runtime)
│   ├── plugins\
│   │   └── DevourVietnamesePatch.dll  (✨ Our plugin!)
│   ├── config\
│   └── LogOutput.log            (Debug logs)
├── winhttp.dll                  (BepInEx loader)
├── doorstop_config.ini          (BepInEx config)
└── [other game files...]
```

## 🔄 How It Works

The plugin **patches game text at runtime**:

1. BepInEx loads before game starts
2. Our plugin hooks into game text rendering
3. Vietnamese translations injected on-the-fly
4. Game displays Vietnamese UI/items/descriptions
5. No permanent file changes = safe!

## 📝 Supported Translations

- ✅ Item names (100+)
- ✅ Character names
- ✅ Outfit names  
- ✅ Perk descriptions
- ✅ UI strings
- ✅ Emote descriptions

Example translations:
- Moonless Night → Đêm Không Trăng
- Claws Out → Móng Vuốt Ra
- Acceleration → Tăng Tốc

## ⚙️ Advanced Configuration

### Disable Plugin Temporarily
```bash
# Rename the plugin folder
Rename-Item "BepInEx\plugins" "BepInEx\plugins_disabled"
# Launch game (English)
# Then rename back to re-enable
```

### Check Plugin Logs
```bash
notepad "D:\SteamLibrary\steamapps\common\Devour\BepInEx\LogOutput.log"
```

### Build from Source
```bash
cd devour_vi_bepinex_plugin
# Download dependencies
powershell -ExecutionPolicy Bypass -File download-dependencies.ps1
# Build
dotnet build -c Release
# Output: bin/Release/net472/DevourVietnamesePatch.dll
```

## 🆘 Getting Help

1. Check `BepInEx\LogOutput.log` for error details
2. Ensure BepInEx is properly extracted (should have `core`, `config` folders)
3. Verify game path is correct in install script
4. Try manual installation method

## 📄 License

This plugin is for personal use with DEVOUR game. Respect the game's terms of service.

## 🙏 Credits

- BepInEx: https://github.com/BepInEx/BepInEx
- Harmony: https://github.com/pardeike/Harmony
- Vietnamese community contributors

---

**Happy gaming! 🎮🇻🇳**
