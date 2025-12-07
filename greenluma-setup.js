#!/usr/bin/env node

/**
 * GreenLuma Vietnamese Setup & Launcher
 * Tự động setup + launch GreenLuma với Vietnamese manifest
 */

const fs = require('fs');
const path = require('path');
const { spawn, execSync } = require('child_process');

// ============ CONFIG ============
const GREENLUMA_FOLDER = path.join(__dirname, 'greenluma-manifests');
const GREENLUMA_EXE = path.join(GREENLUMA_FOLDER, 'CN_GreenLumaGUI.exe');
const MANIFEST_VI = path.join(GREENLUMA_FOLDER, '1274570_vi.lua');
const MANIFEST_EN = path.join(GREENLUMA_FOLDER, '1274570.lua');
const GAME_PATH = 'D:\\SteamLibrary\\steamapps\\common\\Devour';
const GAME_APPID = '1274570';

console.log('\n' + '='.repeat(60));
console.log('🎮 GreenLuma Vietnamese Setup & Launcher');
console.log('='.repeat(60) + '\n');

// ============ STEP 1: Validate files ============
console.log('📋 Step 1: Validating files...\n');

const checks = [
  { name: 'GreenLuma GUI', path: GREENLUMA_EXE },
  { name: 'Vietnamese Manifest', path: MANIFEST_VI },
  { name: 'English Manifest', path: MANIFEST_EN },
  { name: 'Game folder', path: GAME_PATH },
];

let allValid = true;
for (const check of checks) {
  const exists = fs.existsSync(check.path);
  const icon = exists ? '✅' : '❌';
  console.log(`${icon} ${check.name}`);
  console.log(`   ${check.path}`);
  if (!exists) allValid = false;
}

if (!allValid) {
  console.error('\n❌ Some files not found!');
  process.exit(1);
}

console.log('\n✅ All files found!\n');

// ============ STEP 2: Instructions ============
console.log('='.repeat(60));
console.log('📖 SETUP INSTRUCTIONS');
console.log('='.repeat(60) + '\n');

console.log('GreenLuma is ready with Vietnamese manifest!\n');

console.log('📌 Option A: Vietnamese Items (Recommended)');
console.log('────────────────────────────────────────');
console.log('1. Click button below to open GreenLuma');
console.log('2. Add Game → AppID: 1274570');
console.log('3. Select manifest: 1274570_vi.lua (Vietnamese) ✓');
console.log('4. Click "Update" → "Inject"');
console.log('5. Launch game from GreenLuma');
console.log('6. All items unlock + Vietnamese names! 🇻🇳\n');

console.log('📌 Option B: English Items');
console.log('────────────────────────────────────────');
console.log('1. Same steps as above');
console.log('2. But select: 1274570.lua (English) instead');
console.log('3. Items unlock + English names\n');

console.log('='.repeat(60) + '\n');

// ============ STEP 3: Ask user ============
console.log('🚀 Launching GreenLuma in 3 seconds...\n');

setTimeout(() => {
  console.log('📂 GreenLuma window should open');
  console.log('📂 Manifests folder: ' + GREENLUMA_FOLDER);
  console.log('📂 Files ready:');
  console.log('   - 1274570.lua (English)');
  console.log('   - 1274570_vi.lua (Vietnamese) ⭐\n');
  
  // Launch GreenLuma
  try {
    const greenluma = spawn(GREENLUMA_EXE, [], {
      detached: true,
      stdio: 'ignore',
      cwd: GREENLUMA_FOLDER,
      windowsHide: false,
    });
    
    greenluma.unref();
    
    console.log('✅ GreenLuma launched!\n');
    console.log('📝 Quick Reference:');
    console.log('   Game AppID: ' + GAME_APPID);
    console.log('   Game Path: ' + GAME_PATH);
    console.log('   Vietnamese Manifest: 1274570_vi.lua');
    console.log('   English Manifest: 1274570.lua\n');
    
    console.log('After setup, run this to launch with mod:');
    console.log('   node greenluma-launch-vi.js\n');
    
  } catch (error) {
    console.error('❌ Failed to launch GreenLuma:', error.message);
    console.error('Please run: ' + GREENLUMA_EXE);
  }
}, 3000);
