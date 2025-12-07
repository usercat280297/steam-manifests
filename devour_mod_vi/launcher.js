#!/usr/bin/env node

/**
 * DEVOUR Vietnamese Mod Launcher
 * Dùng để enable/disable Vietnamese mod
 */

const fs = require('fs');
const path = require('path');

const GAME_PATH = 'D:\\SteamLibrary\\steamapps\\common\\Devour';
const INVENTORY_PATH = path.join(GAME_PATH, 'inventory.json');
const BACKUP_PATH = path.join(GAME_PATH, 'inventory.json.vi.backup');

function enableVietnameseMod() {
  console.log('🇻🇳 Enabling Vietnamese mod...');
  
  if (!fs.existsSync(INVENTORY_PATH)) {
    console.error('❌ Game folder not found');
    return;
  }
  
  // Backup English version
  if (!fs.existsSync(BACKUP_PATH)) {
    fs.copyFileSync(INVENTORY_PATH, BACKUP_PATH);
    console.log('✅ Created backup');
  }
  
  // Load Vietnamese inventory
  const viPath = path.join(__dirname, 'content', 'vi', 'inventory_vi.json');
  if (fs.existsSync(viPath)) {
    const viContent = fs.readFileSync(viPath, 'utf8');
    fs.writeFileSync(INVENTORY_PATH, viContent, 'utf8');
    console.log('✅ Vietnamese mod enabled!');
    console.log('🎮 Restart game to see changes');
  } else {
    console.error('❌ Vietnamese inventory file not found');
  }
}

function disableVietnameseMod() {
  console.log('🔄 Disabling Vietnamese mod...');
  
  if (fs.existsSync(BACKUP_PATH)) {
    fs.copyFileSync(BACKUP_PATH, INVENTORY_PATH);
    console.log('✅ English version restored');
  } else {
    console.error('❌ Backup not found');
  }
}

const action = process.argv[2] || 'enable';

if (action === 'enable') {
  enableVietnameseMod();
} else if (action === 'disable') {
  disableVietnameseMod();
} else {
  console.log('Usage: node launcher.js [enable|disable]');
}
