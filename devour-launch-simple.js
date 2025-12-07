#!/usr/bin/env node

/**
 * DEVOUR Vietnamese Injection Launcher
 * Tránh BepInEx complexity - thay vào đó modify inventory.json lúc runtime
 * 
 * How it works:
 * 1. Backup English inventory
 * 2. Swap với Vietnamese inventory
 * 3. Launch game
 * 4. Game loads Vietnamese names
 * 5. Auto-restore English on exit
 */

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const readline = require('readline');

const GAME_PATH = 'D:\\SteamLibrary\\steamapps\\common\\Devour';
const GAME_EXE = path.join(GAME_PATH, 'DEVOUR.exe');
const INVENTORY_EN = path.join(GAME_PATH, 'inventory.json.en.backup');
const INVENTORY_VI = path.join(GAME_PATH, 'inventory.json');
const INVENTORY_VI_MOD = path.join(__dirname, 'devour_mod_vi', 'content', 'vi', 'inventory_vi.json');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise(resolve => rl.question(prompt, resolve));
}

async function main() {
  console.log('\n' + '='.repeat(60));
  console.log('🎮 DEVOUR Vietnamese Game Launcher (Simple Version)');
  console.log('='.repeat(60) + '\n');

  // Check files
  console.log('📋 Checking files...\n');
  
  if (!fs.existsSync(GAME_EXE)) {
    console.error('❌ Game not found at:', GAME_EXE);
    process.exit(1);
  }
  console.log('✅ Game folder found');

  if (!fs.existsSync(INVENTORY_VI_MOD)) {
    console.error('❌ Vietnamese inventory not found at:', INVENTORY_VI_MOD);
    process.exit(1);
  }
  console.log('✅ Vietnamese inventory found');

  if (!fs.existsSync(INVENTORY_EN)) {
    console.log('💾 Creating English backup...');
    if (fs.existsSync(INVENTORY_VI)) {
      fs.copyFileSync(INVENTORY_VI, INVENTORY_EN);
      console.log('✅ Backup created\n');
    }
  } else {
    console.log('✅ English backup exists\n');
  }

  // Menu
  console.log('Choose language:');
  console.log('  1. Vietnamese (Tiếng Việt) 🇻🇳');
  console.log('  2. English');
  console.log('  0. Exit\n');
  
  const choice = await question('Enter choice (0-2): ');

  if (choice === '0') {
    console.log('\n👋 Goodbye!');
    rl.close();
    return;
  }

  let useVietnamese = false;
  if (choice === '1') {
    useVietnamese = true;
  } else if (choice === '2') {
    useVietnamese = false;
  } else {
    console.log('❌ Invalid choice');
    rl.close();
    return;
  }

  console.log('');

  // Prepare inventory
  if (useVietnamese) {
    console.log('🇻🇳 Preparing Vietnamese inventory...');
    const viContent = fs.readFileSync(INVENTORY_VI_MOD, 'utf8');
    fs.writeFileSync(INVENTORY_VI, viContent, 'utf8');
    console.log('✅ Vietnamese inventory loaded\n');
  } else {
    console.log('🇬🇧 Preparing English inventory...');
    const enContent = fs.readFileSync(INVENTORY_EN, 'utf8');
    fs.writeFileSync(INVENTORY_VI, enContent, 'utf8');
    console.log('✅ English inventory loaded\n');
  }

  // Launch game
  console.log('🎮 Launching DEVOUR...\n');
  
  try {
    const game = spawn(GAME_EXE, [], {
      detached: true,
      stdio: 'ignore',
      windowsHide: false,
    });

    game.unref();
    
    console.log('✅ Game launched!');
    console.log('   Enjoy your game in', useVietnamese ? 'Vietnamese' : 'English', '!\n');
    
    // Wait for game to close
    console.log('⏳ Waiting for game to close...\n');
    
    // Simple polling to detect game process close
    const checkGameProcess = setInterval(() => {
      try {
        require('child_process').execSync(`tasklist | find "DEVOUR.exe"`, { stdio: 'pipe' });
      } catch {
        // Process ended
        clearInterval(checkGameProcess);
        
        // Restore English
        console.log('\n🔄 Game closed. Restoring English...\n');
        if (fs.existsSync(INVENTORY_EN)) {
          const enContent = fs.readFileSync(INVENTORY_EN, 'utf8');
          fs.writeFileSync(INVENTORY_VI, enContent, 'utf8');
          console.log('✅ English restored\n');
        }
        
        console.log('👋 Goodbye!\n');
        rl.close();
        process.exit(0);
      }
    }, 2000);
    
  } catch (error) {
    console.error('❌ Failed to launch game:', error.message);
    rl.close();
    process.exit(1);
  }
}

main().catch(err => {
  console.error('Error:', err.message);
  rl.close();
  process.exit(1);
});
