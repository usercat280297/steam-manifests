#!/usr/bin/env node

/**
 * DEVOUR Vietnamese Mod Launcher - Fixed Version
 * Sửa lỗi crash: Replace inventory AFTER game starts, not before
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
const DELAY_MS = 3000; // Wait 3 seconds after game launch before replacing

// ============ UTILITY FUNCTIONS ============

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

function backupEnglish() {
  if (!fs.existsSync(BACKUP_PATH)) {
    fs.copyFileSync(INVENTORY_PATH, BACKUP_PATH);
    console.log('💾 Created English backup: inventory.json.en.backup\n');
  }
}

function launchGame() {
  console.log('🎮 Launching DEVOUR...\n');
  
  try {
    const game = spawn(GAME_EXE, [], {
      detached: true,
      stdio: 'ignore',
      windowsHide: false,
    });
    
    game.unref();
    console.log('✅ Game launched!\n');
    console.log('⏳ Waiting 3 seconds before applying Vietnamese mod...\n');
    
    return game;
  } catch (error) {
    console.error('❌ Failed to launch game:', error.message);
    throw error;
  }
}

function enableVietnameseAfterDelay() {
  return new Promise((resolve) => {
    setTimeout(() => {
      console.log('🇻🇳 Applying Vietnamese mod now...\n');
      
      try {
        const viContent = fs.readFileSync(MOD_INVENTORY_PATH, 'utf8');
        fs.writeFileSync(INVENTORY_PATH, viContent, 'utf8');
        console.log('✅ Vietnamese inventory loaded\n');
        console.log('📝 All items are now in Vietnamese!');
        console.log('   - Outfits: "Đêm Không Trăng", "Móng Vuốt Ra", etc.');
        console.log('   - Perks: "Tăng Tốc", "Khát Máu", etc.');
        console.log('   - You may need to restart game to see changes\n');
      } catch (error) {
        console.error('❌ Error applying Vietnamese mod:', error.message);
      }
      
      resolve();
    }, DELAY_MS);
  });
}

function restoreEnglish() {
  console.log('\n🔄 Restoring English inventory...\n');
  
  if (fs.existsSync(BACKUP_PATH)) {
    fs.copyFileSync(BACKUP_PATH, INVENTORY_PATH);
    console.log('✅ English inventory restored\n');
  }
}

// ============ MAIN ============
async function main() {
  console.log('\n' + '='.repeat(50));
  console.log('🎮 DEVOUR Vietnamese Mod Launcher (Fixed)');
  console.log('='.repeat(50) + '\n');
  
  // Validate paths
  if (!validatePaths()) {
    console.error('❌ Required files not found');
    process.exit(1);
  }
  
  // Backup English
  backupEnglish();
  
  // Launch game
  const game = launchGame();
  
  // Wait then apply Vietnamese mod
  await enableVietnameseAfterDelay();
  
  // Wait for game to close
  console.log('⏳ Waiting for game to close...\n');
  await new Promise((resolve) => {
    game.on('close', resolve);
    game.on('exit', resolve);
    game.on('error', resolve);
  });
  
  // Restore English
  restoreEnglish();
  
  console.log('👋 Goodbye! See you next time!\n');
}

main().catch((error) => {
  console.error('❌ Error:', error.message);
  process.exit(1);
});
