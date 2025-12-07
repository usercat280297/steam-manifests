#!/usr/bin/env node

/**
 * BepInEx Plugin Installation Verification
 * Checks all requirements and installation steps
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const GAME_PATH = 'D:\\SteamLibrary\\steamapps\\common\\Devour';

function check(label, condition, fix = null) {
  if (condition) {
    console.log(`  ✅ ${label}`);
    return true;
  } else {
    console.log(`  ❌ ${label}`);
    if (fix) console.log(`     💡 ${fix}`);
    return false;
  }
}

function main() {
  console.log('\n' + '='.repeat(65));
  console.log('  🔍 BepInEx Vietnamese Plugin - Installation Check');
  console.log('='.repeat(65) + '\n');

  let allGood = true;

  // ============================================================
  // STEP 1: Game Installation
  // ============================================================
  console.log('📦 Game Installation\n');
  
  const gameExists = fs.existsSync(GAME_PATH);
  allGood &= check(
    'DEVOUR game found',
    gameExists,
    `Download from Steam or check game path: ${GAME_PATH}`
  );

  if (!gameExists) {
    console.log('\n⚠️  Cannot continue without game folder\n');
    process.exit(1);
  }

  // ============================================================
  // STEP 2: BepInEx Installation
  // ============================================================
  console.log('\n🔧 BepInEx Installation\n');
  
  const bepinexDir = path.join(GAME_PATH, 'BepInEx');
  const bepinexCore = path.join(bepinexDir, 'core');
  const winhttp = path.join(GAME_PATH, 'winhttp.dll');
  
  const bepExists = fs.existsSync(bepinexDir);
  const coreExists = fs.existsSync(bepinexCore);
  const winhttpExists = fs.existsSync(winhttp);

  allGood &= check(
    'BepInEx folder exists',
    bepExists,
    'Download BepInEx 5.4.21 from: https://github.com/BepInEx/BepInEx/releases'
  );

  if (bepExists) {
    allGood &= check(
      'BepInEx core modules found',
      coreExists,
      'Re-extract BepInEx to game folder'
    );

    allGood &= check(
      'BepInEx loader (winhttp.dll) installed',
      winhttpExists,
      'BepInEx extraction incomplete - try again'
    );
  }

  // ============================================================
  // STEP 3: Plugin DLL
  // ============================================================
  console.log('\n🎮 Plugin Installation\n');
  
  const pluginsDir = path.join(bepinexDir, 'plugins');
  const pluginDll = path.join(pluginsDir, 'DevourVietnamesePatch.dll');

  if (bepExists) {
    const pluginDirExists = fs.existsSync(pluginsDir);
    allGood &= check(
      'Plugins folder exists',
      pluginDirExists,
      'Creating plugins folder...'
    );

    if (!pluginDirExists) {
      try {
        require('child_process').execSync(`mkdir "${pluginsDir}"`);
        console.log('     ✅ Created plugins folder');
      } catch (e) {
        console.log('     ❌ Failed to create plugins folder');
        allGood = false;
      }
    }

    const dllExists = fs.existsSync(pluginDll);
    allGood &= check(
      'DevourVietnamesePatch.dll installed',
      dllExists,
      'Run: powershell -ExecutionPolicy Bypass -File install.ps1'
    );

    if (dllExists) {
      const stat = fs.statSync(pluginDll);
      const sizeMB = (stat.size / 1024 / 1024).toFixed(2);
      console.log(`     📊 File size: ${sizeMB} MB`);
    }
  }

  // ============================================================
  // STEP 4: System Requirements
  // ============================================================
  console.log('\n💻 System Requirements\n');

  try {
    const dotnet = execSync('dotnet --version', { encoding: 'utf8' }).trim();
    allGood &= check(
      `.NET SDK installed (${dotnet.split(' ')[0]})`,
      dotnet.includes('6.') || dotnet.includes('7.') || dotnet.includes('8.'),
      'Install .NET 6+: https://dotnet.microsoft.com/download'
    );
  } catch (e) {
    allGood &= check(
      '.NET SDK installed',
      false,
      'Install .NET 6+: https://dotnet.microsoft.com/download'
    );
  }

  // ============================================================
  // STEP 5: Disk Space
  // ============================================================
  console.log('\n💾 Disk Space\n');
  
  try {
    const cmd = `powershell -Command "(Get-Volume -DriveLetter D).SizeRemaining / 1GB"`;
    const freeSpace = parseFloat(execSync(cmd, { encoding: 'utf8' }));
    const hasSpace = freeSpace >= 0.5;
    
    allGood &= check(
      `Free space available (${freeSpace.toFixed(1)} GB)`,
      hasSpace,
      'Free up at least 500 MB'
    );
  } catch (e) {
    console.log('  ⚠️  Could not check disk space');
  }

  // ============================================================
  // SUMMARY
  // ============================================================
  console.log('\n' + '='.repeat(65));
  if (allGood) {
    console.log('  ✅ ALL CHECKS PASSED - Ready to play!');
    console.log('\n  Launch DEVOUR from Steam and enjoy Vietnamese text!');
  } else {
    console.log('  ⚠️  SOME CHECKS FAILED - Please fix issues above');
    console.log('\n  Run installer: powershell -ExecutionPolicy Bypass -File install.ps1');
  }
  console.log('='.repeat(65) + '\n');

  process.exit(allGood ? 0 : 1);
}

main();
