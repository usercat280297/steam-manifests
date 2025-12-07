#!/usr/bin/env node
/**
 * 🎮 Devour - Vietnamese Manifest Creator
 * 
 * Tạo GreenLuma manifest từ Vietnamese inventory
 * 
 * Usage:
 *   node devour-vi-manifest.js
 * 
 * Creates: manifests/1274570_vi.lua
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const DEVOUR_APPID = 1274570;

function main() {
  console.log(`\n${'═'.repeat(70)}`);
  console.log('📦 DEVOUR - Vietnamese Manifest Creator');
  console.log(`${'═'.repeat(70)}\n`);
  
  const inputPath = 'translation_projects/1274570_devour/inventory_vi.json';
  
  if (!fs.existsSync(inputPath)) {
    console.log(`❌ File not found: ${inputPath}`);
    console.log(`💡 Run: node devour-vi-translator.js first\n`);
    process.exit(1);
  }
  
  const inventory = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
  console.log(`✅ Loaded: ${Object.keys(inventory).length} items\n`);
  
  // Create manifest
  const timestamp = new Date().toISOString();
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
  
  // Create Lua content
  let luaContent = `-- GreenLuma Devour Manifest (Vietnamese)
-- Generated: ${timestamp}
-- AppID: ${DEVOUR_APPID}
-- Items: ${items.length}
-- Language: Tiếng Việt 🇻🇳

return {
  depotid = ${DEVOUR_APPID},
  manifestid = "${timestamp}",
  filelist = {
`;
  
  for (const item of items) {
    const name = (item.name || '').replace(/"/g, '\\"');
    const desc = (item.description || '').replace(/"/g, '\\"');
    
    luaContent += `    {
      filename = "item_${item.id}.lua",
      hash = "${crypto.randomBytes(16).toString('hex')}",
      size = ${Math.floor(Math.random() * 100000)},
      flags = 32,
      data = {
        id = ${item.id},
        name = "${name}",
        description = "${desc}",
        type = "${item.type}",
        display_type = "${item.display_type}"
      }
    },
`;
  }
  
  luaContent += `  }
}
`;
  
  // Save
  const manifestDir = './manifests';
  if (!fs.existsSync(manifestDir)) {
    fs.mkdirSync(manifestDir, { recursive: true });
  }
  
  const manifestPath = path.join(manifestDir, `${DEVOUR_APPID}_vi.lua`);
  fs.writeFileSync(manifestPath, luaContent, 'utf8');
  
  console.log(`✅ Created: ${manifestPath}`);
  console.log(`📊 Size: ${(luaContent.length / 1024).toFixed(1)} KB`);
  console.log(`📊 Items: ${items.length}\n`);
  
  console.log(`${'─'.repeat(70)}`);
  console.log('🎯 GreenLuma Setup');
  console.log(`${'─'.repeat(70)}`);
  console.log(`\n1️⃣  Copy manifest file:`);
  console.log(`    copy "${manifestPath}" "C:\\Program Files\\GreenLuma\\manifests\\"`);
  console.log(`\n2️⃣  Or use GreenLuma GUI:`);
  console.log(`    - Add app: AppID ${DEVOUR_APPID}`);
  console.log(`    - Select manifest: ${path.basename(manifestPath)}`);
  console.log(`    - Click "Update"`);
  console.log(`\n3️⃣  Restart Devour → All items Vietnamese! 🇻🇳\n`);
}

main();
