#!/usr/bin/env node

/**
 * DEVOUR Vietnamese Launcher - Simple No-Prompt Version
 * Just run it to play in Vietnamese!
 */

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const GAME_PATH = 'D:\\SteamLibrary\\steamapps\\common\\Devour';
const GAME_EXE = path.join(GAME_PATH, 'DEVOUR.exe');
const INVENTORY = path.join(GAME_PATH, 'inventory.json');
const INVENTORY_EN = path.join(GAME_PATH, 'inventory.json.en');

// Vietnamese translations (extensive dictionary)
const VI_DICT = {
  'Moonless Night': 'Đêm Không Trăng',
  'The Mother': 'Mẹ',
  'The Caregiver': 'Người Chăm Sóc',
  'Acceleration': 'Tăng Tốc',
  'Claws Out': 'Móng Vuốt Ra',
  'Blind Spot': 'Điểm Mù',
  'Ethereal': 'Vô Hình',
  'Evasion': 'Tránh Né',
  'Night Runner': 'Người Chạy Đêm',
  'Phantom': 'Bóng Ma',
  'Shriek': 'Rít Hót',
  'Teleportation': 'Dịch Chuyển',
  'Light': 'Ánh Sáng',
  'Rope': 'Sợi Dây',
  'Key': 'Chìa Khóa',
  'Survive': 'Sống Sót',
  'Escape': 'Trốn Thoát',
};

function translateText(text) {
  if (!text) return text;
  let result = text;
  for (const [en, vi] of Object.entries(VI_DICT)) {
    const regex = new RegExp(`\\b${en}\\b`, 'gi');
    result = result.replace(regex, vi);
  }
  return result;
}

function translateObj(obj) {
  if (!obj || typeof obj !== 'object') return obj;
  for (const key in obj) {
    if (typeof obj[key] === 'string') {
      obj[key] = translateText(obj[key]);
    } else if (typeof obj[key] === 'object') {
      translateObj(obj[key]);
    }
  }
  return obj;
}

async function main() {
  console.log('\n🎮 DEVOUR Vietnamese Launcher\n');

  if (!fs.existsSync(GAME_EXE)) {
    console.error('❌ Game not found!');
    process.exit(1);
  }

  // Backup English if needed
  if (!fs.existsSync(INVENTORY_EN)) {
    fs.copyFileSync(INVENTORY, INVENTORY_EN);
  }

  // Load and translate
  const enData = JSON.parse(fs.readFileSync(INVENTORY_EN, 'utf8'));
  translateObj(enData);
  fs.writeFileSync(INVENTORY, JSON.stringify(enData, null, 2));

  console.log('✅ Vietnamese loaded');
  console.log('🎮 Launching game...\n');

  spawn(GAME_EXE, [], { detached: true, stdio: 'ignore' }).unref();

  // Wait then restore
  await new Promise(resolve => setTimeout(resolve, 120000));
  
  console.log('🔄 Restoring English...');
  fs.copyFileSync(INVENTORY_EN, INVENTORY);
  console.log('✅ Done\n');
}

main().catch(console.error);
