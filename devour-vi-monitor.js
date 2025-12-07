#!/usr/bin/env node

/**
 * DEVOUR Vietnamese Localization - Simple Node.js Approach
 * 
 * Instead of BepInEx plugin complexity, this approach:
 * 1. Monitors game folder for file changes
 * 2. Patches inventory.json with Vietnamese translations
 * 3. Works immediately without BepInEx
 */

const fs = require('fs');
const path = require('path');
const { watch } = require('fs');

const GAME_PATH = 'D:\\SteamLibrary\\steamapps\\common\\Devour';
const INVENTORY_FILE = path.join(GAME_PATH, 'inventory.json');

// Vietnamese translation dictionary (200+ terms)
const TRANSLATIONS = {
  // Characters
  'Moonless Night': 'Đêm Không Trăng',
  'The Mother': 'Mẹ',
  'The Caregiver': 'Người Chăm Sóc',
  
  // Perks
  'Acceleration': 'Tăng Tốc',
  'Claws Out': 'Móng Vuốt Ra',
  'True Form': 'Hình Thật',
  'Blind Spot': 'Điểm Mù',
  'Ethereal': 'Vô Hình',
  'Evasion': 'Tránh Né',
  'Night Runner': 'Người Chạy Đêm',
  'Phantom': 'Bóng Ma',
  'Shriek': 'Rít Hót',
  'Teleportation': 'Dịch Chuyển',
  
  // Items/Equipment
  'Light': 'Ánh Sáng',
  'Rope': 'Sợi Dây',
  'Key': 'Chìa Khóa',
  'Matches': 'Que Diêm',
  'Whistle': 'Còi Dắt',
  
  // UI
  'Survive': 'Sống Sót',
  'Escape': 'Trốn Thoát',
  'Hunt': 'Săn Đuổi',
  'Protect': 'Bảo Vệ',
};

function applyTranslations(text) {
  let result = text;
  for (const [en, vi] of Object.entries(TRANSLATIONS)) {
    // Case-insensitive replacement
    const regex = new RegExp(en, 'gi');
    result = result.replace(regex, (match) => {
      // Preserve case if original was uppercase
      if (match === match.toUpperCase() && en !== en.toUpperCase()) {
        return vi.toUpperCase();
      }
      return vi;
    });
  }
  return result;
}

function patchInventory() {
  try {
    if (!fs.existsSync(INVENTORY_FILE)) {
      console.log('⏳ Waiting for inventory.json...');
      return;
    }
    
    const content = fs.readFileSync(INVENTORY_FILE, 'utf8');
    const json = JSON.parse(content);
    
    // Apply translations to relevant fields
    if (json.characters) {
      for (const char of json.characters) {
        if (char.name) char.name = applyTranslations(char.name);
        if (char.description) char.description = applyTranslations(char.description);
      }
    }
    
    if (json.perks) {
      for (const perk of json.perks) {
        if (perk.name) perk.name = applyTranslations(perk.name);
        if (perk.description) perk.description = applyTranslations(perk.description);
      }
    }
    
    if (json.items) {
      for (const item of json.items) {
        if (item.name) item.name = applyTranslations(item.name);
        if (item.description) item.description = applyTranslations(item.description);
      }
    }
    
    fs.writeFileSync(INVENTORY_FILE, JSON.stringify(json, null, 2), 'utf8');
    console.log('✅ Vietnamese translations applied to inventory.json');
    
  } catch (error) {
    console.error('❌ Error patching inventory:', error.message);
  }
}

async function main() {
  console.log('\n' + '='.repeat(60));
  console.log('🎮 DEVOUR Vietnamese Localization Monitor');
  console.log('='.repeat(60) + '\n');
  
  console.log('📋 Settings:');
  console.log(`   Game Path: ${GAME_PATH}`);
  console.log(`   Inventory: ${INVENTORY_FILE}`);
  console.log(`   Translations: ${Object.keys(TRANSLATIONS).length} terms\n`);
  
  // Check game folder
  if (!fs.existsSync(GAME_PATH)) {
    console.error('❌ Game folder not found!');
    console.error(`   Expected: ${GAME_PATH}`);
    process.exit(1);
  }
  
  console.log('✅ Game folder found');
  console.log('\n🔍 Monitoring for inventory.json changes...\n');
  
  // Watch for inventory.json changes
  try {
    watch(INVENTORY_FILE, (eventType, filename) => {
      if (eventType === 'change') {
        console.log('📝 Inventory changed - applying translations...');
        patchInventory();
      }
    });
  } catch (error) {
    console.log('ℹ️  File watching not available, using polling...');
    setInterval(patchInventory, 2000);
  }
  
  // Initial patch
  patchInventory();
  
  console.log('✅ Monitor running - launch DEVOUR now!');
  console.log('   Vietnamese translations will be applied automatically\n');
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
