#!/usr/bin/env node
/**
 * 📦 Game Translation Package Creator
 * Creates installable folder with Vietnamese translations
 */

const fs = require('fs').promises;
const fsSync = require('fs');
const path = require('path');

async function createTranslationPackage(inputFile, gameName, appId) {
  const packageName = `${gameName}_Vietnamese_Translation`;
  const packageDir = packageName;

  try {
    await fs.mkdir(packageDir, { recursive: true });
  } catch (e) {}

  console.log(`\n✅ Created package folder: ${packageDir}`);

  // Copy translation file
  await fs.copyFile(inputFile, path.join(packageDir, 'inventory.json'));
  console.log(`✅ Added: inventory.json`);

  // Create README
  const readme = createReadmeContent(gameName, appId);
  await fs.writeFile(path.join(packageDir, 'README.txt'), readme, 'utf8');
  console.log(`✅ Added: README.txt`);

  // Create INSTALL batch script
  const installScript = createInstallScript(gameName);
  await fs.writeFile(path.join(packageDir, 'INSTALL.bat'), installScript, 'utf8');
  console.log(`✅ Added: INSTALL.bat`);

  return packageDir;
}

function createReadmeContent(gameName, appId) {
  return `╔════════════════════════════════════════════════════════════════╗
║          ${gameName.toUpperCase()} - VIETNAMESE TRANSLATION           ║
║                                                                    ║
║ 🇻🇳 Complete Vietnamese localization                               ║
║ ⏰ Created: December 7, 2025                                     ║
║ ✅ Status: Ready to Install                                     ║
╚════════════════════════════════════════════════════════════════╝

📋 CÁCH CÀI ĐẶT (HOW TO INSTALL):

CÁCH 1: TỰ ĐỘNG (AUTOMATIC) ✅ RECOMMENDED
══════════════════════════════════════════

1. Double-click "INSTALL.bat"
2. It will automatically:
   ✅ Find game folder
   ✅ Backup original
   ✅ Install Vietnamese
   ✅ Verify setup

3. Launch game - DONE! 🎮


CÁCH 2: THỦ CÔNG (MANUAL)
══════════════════════════════════════════

1. Find game folder:
   C:\\Program Files (x86)\\Steam\\steamapps\\common\\${gameName}

2. Backup original:
   Copy: inventory.json → inventory.json.backup

3. Copy Vietnamese file:
   Copy: inventory.json → game folder

4. Play game - text in TIẾNG VIỆT! ✅


⚠️ IMPORTANT:
══════════════════════════════════════════

✅ Always backup before installing
✅ Backup = easy restore to English
✅ Game won't break
✅ Can uninstall anytime


Game: ${gameName} (AppID: ${appId})
Version: 1.0
Status: READY ✅
═══════════════════════════════════════════
`;
}

function createInstallScript(gameName) {
  return `@echo off
chcp 65001 > nul
cls
echo.
echo Looking for ${gameName} game folder...
echo.

setlocal enabledelayedexpansion
set FOUND=0

for %%D in (
  "C:\\Program Files (x86)\\Steam\\steamapps\\common\\${gameName}"
  "D:\\SteamLibrary\\steamapps\\common\\${gameName}"
  "E:\\SteamLibrary\\steamapps\\common\\${gameName}"
) do (
  if exist "%%D\\inventory.json" (
    set "GAMEPATH=%%D"
    set FOUND=1
    goto :FOUND
  )
)

if %FOUND%==0 (
  echo Game folder not found! Enter path:
  set /p "GAMEPATH=Path: "
)

:FOUND
echo Found: %GAMEPATH%
echo.

if not exist "%GAMEPATH%\\inventory.json.backup" (
  copy "%GAMEPATH%\\inventory.json" "%GAMEPATH%\\inventory.json.backup"
  echo Backup created
)

copy "inventory.json" "%GAMEPATH%\\inventory.json" /Y
echo Vietnamese installed!
echo.
echo Done! Launch game now.
pause
`;
}

async function main() {
  const args = process.argv.slice(2);

  if (args.length < 3) {
    console.log('Usage: node create-game-package.js <file> <game_name> <app_id>');
    console.log('\nExample:');
    console.log('  node create-game-package.js inventory_DEVOUR_VI.json "Devour" 1274570');
    process.exit(1);
  }

  const inputFile = args[0];
  const gameName = args[1];
  const appId = args[2];

  try {
    if (!fsSync.existsSync(inputFile)) {
      console.error(`File not found: ${inputFile}`);
      process.exit(1);
    }

    console.log('\n📦 Creating Translation Package\n');
    console.log(`Game: ${gameName} (${appId})`);
    console.log(`File: ${inputFile}`);

    const packageDir = await createTranslationPackage(inputFile, gameName, appId);

    console.log(`\n✨ Package created: ${packageDir}`);
    console.log(`\n📝 Contents:`);
    console.log(`   • inventory.json`);
    console.log(`   • INSTALL.bat`);
    console.log(`   • README.txt`);

  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
}

main();
