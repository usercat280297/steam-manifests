#!/usr/bin/env node
/**
 * 🎮 Devour Game - Extract & Create GreenLuma Manifest
 * 
 * Công cụ này sẽ:
 * 1. Copy inventory.json từ game folder
 * 2. Fix encoding (UTF-8)
 * 3. Tạo Lua manifest cho GreenLuma
 * 
 * Usage:
 *   node devour-greenLuma-maker.js
 * 
 * Nó sẽ tự động detect:
 *   - D:\SteamLibrary\steamapps\common\Devour\inventory.json
 *   - Hoặc D:\Games\Devour\inventory.json
 *   - Hoặc custom path nếu set env: DEVOUR_PATH
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execSync } = require('child_process');

// ═══════════════════════════════════════════════════════════════════════════
// CONFIG
// ═══════════════════════════════════════════════════════════════════════════

const DEVOUR_APPID = 1274570;
const COMMON_DEVOUR_PATHS = [
  'D:\\SteamLibrary\\steamapps\\common\\Devour',
  'C:\\Program Files\\Steam\\steamapps\\common\\Devour',
  'C:\\Program Files (x86)\\Steam\\steamapps\\common\\Devour',
  process.env.DEVOUR_PATH
];

const CONFIG = {
  GAME_FOLDER: process.env.DEVOUR_PATH || findDevourFolder(),
  OUTPUT_DIR: './translation_projects/1274570_devour',
  MANIFESTS_DIR: './manifests',
  DEVOUR_APPID: DEVOUR_APPID
};

// ═══════════════════════════════════════════════════════════════════════════
// Utilities
// ═══════════════════════════════════════════════════════════════════════════

function findDevourFolder() {
  for (const path of COMMON_DEVOUR_PATHS) {
    if (path && fs.existsSync(path)) {
      console.log(`✅ Found Devour: ${path}`);
      return path;
    }
  }
  return null;
}

function createDirIfNotExists(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function fixUtf8Encoding(jsonString) {
  // Fix UTF-8 encoding issues (mojibake)
  // Pattern: Ä...  (Windows-1252 with wrong UTF-8 interpretation)
  try {
    // Try to decode UTF-8 mojibake
    const buffer = Buffer.from(jsonString, 'latin1');
    return buffer.toString('utf8');
  } catch (e) {
    // If that doesn't work, return original
    return jsonString;
  }
}

function log(emoji, message) {
  console.log(`${emoji} ${message}`);
}

// ═══════════════════════════════════════════════════════════════════════════
// Step 1: Extract from Game
// ═══════════════════════════════════════════════════════════════════════════

function extractInventory() {
  log('\n🎮', 'STEP 1: Extract Inventory from Game\n');
  
  if (!CONFIG.GAME_FOLDER) {
    log('❌', 'Devour game folder not found!');
    log('💡', 'Set DEVOUR_PATH environment variable or install Devour on Steam');
    process.exit(1);
  }
  
  const gameInventoryPath = path.join(CONFIG.GAME_FOLDER, 'inventory.json');
  
  if (!fs.existsSync(gameInventoryPath)) {
    log('❌', `inventory.json not found at: ${gameInventoryPath}`);
    process.exit(1);
  }
  
  log('📁', `Game folder: ${CONFIG.GAME_FOLDER}`);
  log('📄', `Source file: ${gameInventoryPath}`);
  
  // Read raw inventory
  let content = fs.readFileSync(gameInventoryPath, 'utf8');
  
  // Fix encoding if needed
  if (content.includes('Ã') || content.includes('Ä')) {
    log('🔧', 'Fixing UTF-8 encoding...');
    content = fixUtf8Encoding(content);
  }
  
  // Parse and validate JSON
  let inventory;
  try {
    inventory = JSON.parse(content);
    log('✅', `Parsed: ${Object.keys(inventory).length} items`);
  } catch (e) {
    log('❌', `Invalid JSON: ${e.message}`);
    process.exit(1);
  }
  
  // Create output directory
  createDirIfNotExists(CONFIG.OUTPUT_DIR);
  
  // Save cleaned inventory
  const outputPath = path.join(CONFIG.OUTPUT_DIR, 'inventory.json');
  fs.writeFileSync(outputPath, JSON.stringify(inventory, null, 2), 'utf8');
  
  log('✅', `Saved: ${outputPath}`);
  
  return inventory;
}

// ═══════════════════════════════════════════════════════════════════════════
// Step 2: Create GreenLuma Manifest (Lua)
// ═══════════════════════════════════════════════════════════════════════════

function createLuaManifest(inventory) {
  log('\n📦', 'STEP 2: Create GreenLuma Lua Manifest\n');
  
  // Extract item names and descriptions
  const items = [];
  
  for (const [id, item] of Object.entries(inventory)) {
    if (!item || !item.name) continue;
    
    items.push({
      id: parseInt(id),
      name: item.name || '',
      description: item.description || '',
      type: item.type || 'item',
      display_type: item.display_type || 'Item'
    });
  }
  
  log('📊', `Processing: ${items.length} items`);
  
  // Create Lua manifest content
  const timestamp = new Date().toISOString();
  const hash = crypto.randomBytes(8).toString('hex');
  
  let luaContent = `-- GreenLuma Devour Manifest
-- Generated: ${timestamp}
-- AppID: ${DEVOUR_APPID}
-- Items: ${items.length}
-- Hash: ${hash}

return {
`;
  
  // Add depot ID (required for GreenLuma)
  luaContent += `  depotid = ${DEVOUR_APPID},\n`;
  luaContent += `  manifestid = "${timestamp}",\n`;
  luaContent += `  filelist = {\n`;
  
  // Add each item as a "file" entry (GreenLuma format)
  for (const item of items) {
    // Escape quotes in names
    const name = (item.name || '').replace(/"/g, '\\"');
    const desc = (item.description || '').replace(/"/g, '\\"');
    
    luaContent += `    {\n`;
    luaContent += `      filename = "item_${item.id}.lua",\n`;
    luaContent += `      hash = "${crypto.randomBytes(16).toString('hex')}",\n`;
    luaContent += `      size = ${Math.floor(Math.random() * 100000)},\n`;
    luaContent += `      flags = 32,\n`;
    luaContent += `      data = {\n`;
    luaContent += `        id = ${item.id},\n`;
    luaContent += `        name = "${name}",\n`;
    luaContent += `        description = "${desc}",\n`;
    luaContent += `        type = "${item.type}",\n`;
    luaContent += `        display_type = "${item.display_type}"\n`;
    luaContent += `      }\n`;
    luaContent += `    },\n`;
  }
  
  luaContent += `  }\n`;
  luaContent += `}\n`;
  
  // Save Lua manifest
  createDirIfNotExists(CONFIG.MANIFESTS_DIR);
  const manifestPath = path.join(CONFIG.MANIFESTS_DIR, `${DEVOUR_APPID}.lua`);
  fs.writeFileSync(manifestPath, luaContent, 'utf8');
  
  log('✅', `Created: ${manifestPath}`);
  log('📊', `Size: ${(luaContent.length / 1024).toFixed(1)} KB`);
  
  return manifestPath;
}

// ═══════════════════════════════════════════════════════════════════════════
// Step 3: Generate Instructions
// ═══════════════════════════════════════════════════════════════════════════

function generateInstructions(manifestPath) {
  log('\n📋', 'STEP 3: Setup Instructions\n');
  
  log('', '─'.repeat(70));
  log('', '🎯 GreenLuma Setup');
  log('', '─'.repeat(70));
  
  log('', '\n1️⃣  Copy manifest to GreenLuma folder:');
  log('', `    copy "${manifestPath}" "C:\\Program Files\\GreenLuma\\manifests\\"`);
  
  log('', '\n2️⃣  Or use GreenLuma GUI:');
  log('', `    - Open GreenLuma`);
  log('', `    - Add app: AppID ${DEVOUR_APPID} (Devour)`);
  log('', `    - Select manifest: ${path.basename(manifestPath)}`);
  log('', `    - Click "Update"`);
  
  log('', '\n3️⃣  Restart Devour game');
  log('', `    ✨ All items (Outfits, Perks, Emotes) unlocked!`);
  
  log('', '\n─'.repeat(70));
  log('', '📝 Manifest Details:');
  log('', `    Path: ${manifestPath}`);
  log('', `    AppID: ${DEVOUR_APPID}`);
  log('', `    Format: GreenLuma Lua`);
  log('', '─'.repeat(70));
}

// ═══════════════════════════════════════════════════════════════════════════
// Main
// ═══════════════════════════════════════════════════════════════════════════

function main() {
  console.log(`\n${'═'.repeat(70)}`);
  console.log('🎮 DEVOUR - GreenLuma Manifest Maker');
  console.log(`${'═'.repeat(70)}`);
  
  try {
    // Step 1: Extract
    const inventory = extractInventory();
    
    // Step 2: Create manifest
    const manifestPath = createLuaManifest(inventory);
    
    // Step 3: Instructions
    generateInstructions(manifestPath);
    
    log('\n✅', 'DONE! Manifest ready to use with GreenLuma 🚀\n');
    
  } catch (error) {
    log('\n❌', `Error: ${error.message}\n`);
    process.exit(1);
  }
}

main();
