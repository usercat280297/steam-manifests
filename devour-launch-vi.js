#!/usr/bin/env node

/**
 * DEVOUR Vietnamese Mod Launcher
 * Chạy game với Vietnamese mod mà không cần qua Steam
 * 
 * Cách hoạt động:
 * 1. Enable Vietnamese mod (replace inventory.json)
 * 2. Launch DEVOUR.exe trực tiếp
 * 3. Tự động restore English khi thoát game
 */

const fs = require('fs');
const path = require('path');
const { spawn, execSync } = require('child_process');

// ============ CONFIG ============
const GAME_PATH = 'D:\\SteamLibrary\\steamapps\\common\\Devour';
const GAME_EXE = path.join(GAME_PATH, 'DEVOUR.exe');
const INVENTORY_PATH = path.join(GAME_PATH, 'inventory.json');
const BACKUP_PATH = path.join(GAME_PATH, 'inventory.json.en.backup');
const MOD_INVENTORY_PATH = path.join(__dirname, 'devour_mod_vi', 'content', 'vi', 'inventory_vi.json');

// ============ UTILITY FUNCTIONS ============

/**
 * Check if paths exist
 */
function validatePaths() {
  console.log('🔍 Validating game paths...\n');
  
  const checks = [
    { name: 'Game folder', path: GAME_PATH, required: true },
    { name: 'DEVOUR.exe', path: GAME_EXE, required: true },
    { name: 'inventory.json', path: INVENTORY_PATH, required: true },
    { name: 'Vietnamese inventory', path: MOD_INVENTORY_PATH, required: true },
  ];
  
  let allValid = true;
  
  for (const check of checks) {
    const exists = fs.existsSync(check.path);
    const icon = exists ? '✅' : '❌';
    console.log(`${icon} ${check.name}`);
    console.log(`   ${check.path}\n`);
    
    if (check.required && !exists) {
      allValid = false;
    }
  }
  
  return allValid;
}

/**
 * Backup English inventory if needed
 */
function backupEnglish() {
  if (!fs.existsSync(BACKUP_PATH)) {
    fs.copyFileSync(INVENTORY_PATH, BACKUP_PATH);
    console.log('💾 Created English backup: inventory.json.en.backup\n');
  }
}

/**
 * Enable Vietnamese mod
 */
function enableVietnamese() {
  console.log('🇻🇳 Enabling Vietnamese mod...\n');
  
  const viContent = fs.readFileSync(MOD_INVENTORY_PATH, 'utf8');
  fs.writeFileSync(INVENTORY_PATH, viContent, 'utf8');
  
  console.log('✅ Vietnamese inventory loaded\n');
}

/**
 * Launch game
 */
function launchGame() {
  console.log('🎮 Launching DEVOUR...\n');
  
  try {
    // Launch DEVOUR.exe directly without Steam
    const game = spawn(GAME_EXE, [], {
      detached: true,
      stdio: 'ignore',
      windowsHide: false,
    });
    
    game.unref();
    
    console.log('✅ Game launched!\n');
    console.log('📝 Notes:');
    console.log('   - Game is running with Vietnamese mod');
    console.log('   - All items & outfits names are in Vietnamese');
    console.log('   - English inventory will be restored when game closes\n');
    
    return game;
  } catch (error) {
    console.error('❌ Failed to launch game:', error.message);
    console.error('\nTroubleshooting:');
    console.error('   - Make sure DEVOUR is installed at:', GAME_PATH);
    console.error('   - Try running as Administrator');
    console.error('   - Check if DEVOUR.exe exists\n');
    
    throw error;
  }
}

/**
 * Wait for game to close
 */
function waitForGameClose(gameProcess) {
  return new Promise((resolve) => {
    gameProcess.on('close', resolve);
    gameProcess.on('exit', resolve);
    gameProcess.on('error', resolve);
  });
}

/**
 * Restore English inventory
 */
function restoreEnglish() {
  console.log('\n🔄 Restoring English inventory...\n');
  
  if (fs.existsSync(BACKUP_PATH)) {
    fs.copyFileSync(BACKUP_PATH, INVENTORY_PATH);
    console.log('✅ English inventory restored\n');
  } else {
    console.warn('⚠️  English backup not found, keeping Vietnamese\n');
  }
}

/**
 * Create Windows batch shortcut
 */
function createWindowsShortcut() {
  const batPath = path.join(__dirname, 'devour-vi.bat');
  const batContent = `@echo off
REM DEVOUR Vietnamese Mod Launcher
REM Chạy DEVOUR với mod Tiếng Việt

cd /d "${__dirname}"
node devour-launch-vi.js
pause
`;

  fs.writeFileSync(batPath, batContent, 'utf8');
  
  console.log('📌 Created Windows shortcut: devour-vi.bat\n');
  console.log('You can double-click devour-vi.bat to launch game with Vietnamese mod\n');
}

/**
 * Show menu
 */
function showMenu() {
  console.log('\n' + '='.repeat(50));
  console.log('DEVOUR Vietnamese Mod Launcher');
  console.log('='.repeat(50));
  console.log('\nOptions:');
  console.log('  1. Launch game with Vietnamese mod (recommended)');
  console.log('  2. Enable Vietnamese only (don\'t launch game)');
  console.log('  3. Restore English inventory');
  console.log('  4. Create Windows shortcut');
  console.log('\n');
}

// ============ MAIN ============
async function main() {
  console.log('\n' + '='.repeat(50));
  console.log('🎮 DEVOUR Vietnamese Mod Launcher');
  console.log('='.repeat(50) + '\n');
  
  // Validate paths
  if (!validatePaths()) {
    console.error('❌ Required files not found. Make sure:');
    console.error('   1. DEVOUR is installed at D:\\SteamLibrary\\steamapps\\common\\Devour');
    console.error('   2. devour_mod_vi folder exists in current directory\n');
    process.exit(1);
  }
  
  // Check command line arguments
  const action = process.argv[2];
  
  if (action === '--create-shortcut') {
    createWindowsShortcut();
    return;
  }
  
  if (action === '--restore') {
    backupEnglish();
    restoreEnglish();
    return;
  }
  
  // Default: Launch game with Vietnamese mod
  console.log('📋 Startup sequence:\n');
  
  // 1. Backup English
  backupEnglish();
  
  // 2. Enable Vietnamese
  enableVietnamese();
  
  // 3. Launch game
  const game = launchGame();
  
  // 4. Wait for game to close
  console.log('⏳ Waiting for game to close...\n');
  await waitForGameClose(game);
  
  // 5. Restore English
  restoreEnglish();
  
  console.log('👋 Goodbye! See you next time!\n');
}

// Run
main().catch((error) => {
  console.error('❌ Error:', error.message);
  process.exit(1);
});
