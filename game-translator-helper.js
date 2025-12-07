#!/usr/bin/env node
/**
 * 🎮 Game Translator Helper
 * Helps translate game inventory files to Vietnamese
 * 
 * Usage:
 *   node game-translator-helper.js <appid> <action>
 * 
 * Actions:
 *   - info      : Show game info và các file sẵn có
 *   - decrypt   : Giải mã/unpack inventory file
 *   - translate : Dịch sang tiếng Việt
 *   - pack      : Đóng gói lại thành Lua manifest
 *   - all       : Làm tất cả (decrypt -> translate -> pack)
 * 
 * Examples:
 *   node game-translator-helper.js 1274570 info
 *   node game-translator-helper.js 1274570 decrypt
 *   node game-translator-helper.js 1274570 translate
 *   node game-translator-helper.js 1274570 all
 */

const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

// ═══════════════════════════════════════════════════════════════════════════
// CONFIG
// ═══════════════════════════════════════════════════════════════════════════

const CONFIG = {
  INVENTORY_DIR: './translation_projects',
  MANIFESTS_DIR: './manifests',
  GAMES_JSON: './games.json'
};

// ═══════════════════════════════════════════════════════════════════════════
// Utility Functions
// ═══════════════════════════════════════════════════════════════════════════

async function fileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function getFileSize(filePath) {
  try {
    const stat = await fs.stat(filePath);
    return stat.size;
  } catch {
    return 0;
  }
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

// ═══════════════════════════════════════════════════════════════════════════
// Step 1: Game Info
// ═══════════════════════════════════════════════════════════════════════════

async function showGameInfo(appId) {
  console.log(`\n📋 Game Info: AppID ${appId}\n`);
  
  try {
    // Load games.json
    const gamesRaw = await fs.readFile(CONFIG.GAMES_JSON, 'utf8');
    const games = JSON.parse(gamesRaw);
    const game = games.find(g => String(g.appId) === String(appId));
    
    if (game) {
      console.log(`🎮 Game Name: ${game.name}`);
      console.log(`📌 App ID: ${game.appId}\n`);
    }
    
    // Check translation_projects folder
    const projectDir = path.join(CONFIG.INVENTORY_DIR, String(appId) + '_*');
    console.log(`📁 Project Directory: ${CONFIG.INVENTORY_DIR}/${appId}_<timestamp>`);
    
    // List available files in translation_projects
    try {
      const projects = await fs.readdir(CONFIG.INVENTORY_DIR);
      const appProjects = projects.filter(p => p.startsWith(String(appId) + '_'));
      
      if (appProjects.length > 0) {
        console.log(`\n📂 Found ${appProjects.length} project(s):\n`);
        
        for (const proj of appProjects) {
          const projPath = path.join(CONFIG.INVENTORY_DIR, proj);
          const files = await fs.readdir(projPath);
          console.log(`   📦 ${proj}/`);
          
          for (const file of files) {
            const filePath = path.join(projPath, file);
            const size = await getFileSize(filePath);
            console.log(`      └─ ${file} (${formatBytes(size)})`);
          }
        }
      } else {
        console.log(`❌ No projects found for AppID ${appId}`);
        console.log(`\n💡 Next Steps:`);
        console.log(`   1. Run: node auto-populate-games.js (để thêm game)`);
        console.log(`   2. Extract inventory file từ game`);
        console.log(`   3. Đặt vào: ${CONFIG.INVENTORY_DIR}/${appId}_<name>/inventory.json`);
      }
    } catch (e) {
      console.log(`\n❌ Error reading projects directory: ${e.message}`);
    }
    
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// Step 2: Decrypt/Unpack (placeholder - needs actual game decryption logic)
// ═══════════════════════════════════════════════════════════════════════════

async function decryptInventory(appId) {
  console.log(`\n🔓 Decrypt/Unpack Inventory\n`);
  console.log(`AppID: ${appId}\n`);
  
  console.log(`⚠️  Decryption method depends on game's protection:`);
  console.log(`\n1️⃣  For unencrypted JSON files:`);
  console.log(`    → File is already readable\n`);
  
  console.log(`2️⃣  For Lua-encoded files:`);
  console.log(`    → Use: luajit decode.lua <input> <output>\n`);
  
  console.log(`3️⃣  For binary/encrypted files:`);
  console.log(`    → Reverse engineer game code or use modding tools\n`);
  
  console.log(`💡 Common Format Conversions:`);
  console.log(`    .lua → .json    : Use lua-to-json converter`);
  console.log(`    .dat → .json    : Game-specific unpacker`);
  console.log(`    Binary → JSON   : Hex editor + pattern matching\n`);
  
  console.log(`📝 Example for DEVOUR:`);
  console.log(`    The game stores items in JSON format directly`);
  console.log(`    Just extract inventory.json from game files\n`);
}

// ═══════════════════════════════════════════════════════════════════════════
// Step 3: Translate using auto-translate-game.js
// ═══════════════════════════════════════════════════════════════════════════

async function translateGame(appId) {
  console.log(`\n🌐 Translate Game to Vietnamese\n`);
  console.log(`AppID: ${appId}\n`);
  
  console.log(`📖 Using auto-translate-game.js:\n`);
  console.log(`   node auto-translate-game.js <input_file> [output_file]\n`);
  
  console.log(`💡 Example:`);
  console.log(`   node auto-translate-game.js inventory.json inventory_vi.json\n`);
  
  console.log(`📝 The script will:`);
  console.log(`   1. Load inventory.json`);
  console.log(`   2. Use TRANSLATION_DICT to translate names & descriptions`);
  console.log(`   3. Apply smart pattern matching for common phrases`);
  console.log(`   4. Save as _vi.json\n`);
}

// ═══════════════════════════════════════════════════════════════════════════
// Step 4: Pack into Lua Manifest
// ═══════════════════════════════════════════════════════════════════════════

async function packManifest(appId) {
  console.log(`\n📦 Pack into Lua Manifest\n`);
  console.log(`AppID: ${appId}\n`);
  
  console.log(`Using create-game-package.js:\n`);
  console.log(`   node create-game-package.js <appId> <inventory_vi.json>\n`);
  
  console.log(`📝 This will:`);
  console.log(`   1. Create GreenLuma-compatible Lua file`);
  console.log(`   2. Include all items with Vietnamese names`);
  console.log(`   3. Generate manifest: manifests/${appId}.lua\n`);
}

// ═══════════════════════════════════════════════════════════════════════════
// Full Workflow
// ═══════════════════════════════════════════════════════════════════════════

async function runFullWorkflow(appId) {
  console.log(`\n${'═'.repeat(70)}`);
  console.log(`🎮 GAME TRANSLATION - FULL WORKFLOW`);
  console.log(`${'═'.repeat(70)}\n`);
  
  console.log(`📌 AppID: ${appId}\n`);
  
  console.log(`${'─'.repeat(70)}`);
  console.log(`STEP 1️⃣  - Prepare Inventory File`);
  console.log(`${'─'.repeat(70)}`);
  await showGameInfo(appId);
  
  console.log(`\n${'─'.repeat(70)}`);
  console.log(`STEP 2️⃣  - Decrypt/Extract Inventory`);
  console.log(`${'─'.repeat(70)}`);
  await decryptInventory(appId);
  
  console.log(`\n${'─'.repeat(70)}`);
  console.log(`STEP 3️⃣  - Translate to Vietnamese`);
  console.log(`${'─'.repeat(70)}`);
  await translateGame(appId);
  
  console.log(`\n${'─'.repeat(70)}`);
  console.log(`STEP 4️⃣  - Create Lua Manifest`);
  console.log(`${'─'.repeat(70)}`);
  await packManifest(appId);
  
  console.log(`\n${'═'.repeat(70)}`);
  console.log(`✅ WORKFLOW COMPLETE`);
  console.log(`${'═'.repeat(70)}\n`);
}

// ═══════════════════════════════════════════════════════════════════════════
// Main
// ═══════════════════════════════════════════════════════════════════════════

async function main() {
  const args = process.argv.slice(2);
  
  if (args.length < 1) {
    console.log(`\n🎮 Game Translator Helper\n`);
    console.log(`Usage: node game-translator-helper.js <appid> [action]\n`);
    console.log(`Actions:`);
    console.log(`  info       - Show game info`);
    console.log(`  decrypt    - Decrypt/unpack inventory`);
    console.log(`  translate  - Translate to Vietnamese`);
    console.log(`  pack       - Create Lua manifest`);
    console.log(`  all        - Do everything\n`);
    console.log(`Examples:`);
    console.log(`  node game-translator-helper.js 1274570 all\n`);
    process.exit(1);
  }
  
  const appId = args[0];
  const action = args[1] || 'all';
  
  try {
    switch (action.toLowerCase()) {
      case 'info':
        await showGameInfo(appId);
        break;
      case 'decrypt':
        await decryptInventory(appId);
        break;
      case 'translate':
        await translateGame(appId);
        break;
      case 'pack':
        await packManifest(appId);
        break;
      case 'all':
      default:
        await runFullWorkflow(appId);
    }
  } catch (error) {
    console.error(`\n❌ Error: ${error.message}\n`);
    process.exit(1);
  }
}

main();
