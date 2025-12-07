#!/usr/bin/env node
/**
 * 🎮 DEVOUR - All-in-One Setup & Deployment Tool
 * 
 * Nếu GreenLuma chưa cài, tôi sẽ:
 * 1. Tạo folder GreenLuma (hoặc copy vào custom path)
 * 2. Copy manifest files
 * 3. Hướng dẫn đầy đủ
 * 
 * Usage:
 *   node devour-deploy.js                    # Auto-setup
 *   node devour-deploy.js --path "C:\GL"    # Custom path
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

function log(emoji, message) {
  console.log(`${emoji} ${message}`);
}

function createGreenLumaFolder(customPath) {
  const defaultPath = 'C:\\Program Files\\GreenLuma';
  const targetPath = customPath || defaultPath;
  
  log('\n📁', `Setting up GreenLuma at: ${targetPath}\n`);
  
  const manifestsPath = path.join(targetPath, 'manifests');
  
  try {
    if (!fs.existsSync(manifestsPath)) {
      fs.mkdirSync(manifestsPath, { recursive: true });
      log('✅', `Created: ${manifestsPath}`);
    } else {
      log('ℹ️', `Folder already exists: ${manifestsPath}`);
    }
    
    return manifestsPath;
  } catch (error) {
    log('⚠️', `Cannot create at ${targetPath}: ${error.message}`);
    log('', 'Trying alternative location...\n');
    
    // Try alternative: local folder
    const localPath = path.join(process.cwd(), 'greenluma-manifests');
    fs.mkdirSync(localPath, { recursive: true });
    log('✅', `Created local folder: ${localPath}`);
    return localPath;
  }
}

function copyManifestFiles(destFolder) {
  log('\n📦', 'Copying manifest files...\n');
  
  const sourceFiles = [
    { src: 'manifests/1274570.lua', name: 'DEVOUR - English' },
    { src: 'manifests/1274570_vi.lua', name: 'DEVOUR - Vietnamese 🇻🇳' }
  ];
  
  let copiedCount = 0;
  
  for (const file of sourceFiles) {
    if (!fs.existsSync(file.src)) {
      log('⚠️', `${file.name}: Not found`);
      continue;
    }
    
    try {
      const destPath = path.join(destFolder, path.basename(file.src));
      fs.copyFileSync(file.src, destPath);
      const size = (fs.statSync(destPath).size / 1024).toFixed(1);
      log('✅', `${file.name} (${size} KB)`);
      copiedCount++;
    } catch (error) {
      log('❌', `${file.name}: ${error.message}`);
    }
  }
  
  return copiedCount;
}

function generateSetupGuide(manifestFolder) {
  const guideContent = `
╔════════════════════════════════════════════════════════════════════╗
║          🎮 DEVOUR - GreenLuma Setup Guide                         ║
╚════════════════════════════════════════════════════════════════════╝

📋 MANIFEST FILES LOCATION
═════════════════════════════════════════════════════════════════════

Path: ${manifestFolder}

Files:
  ✅ 1274570.lua       (English version)
  ✅ 1274570_vi.lua    (Vietnamese version 🇻🇳)

═════════════════════════════════════════════════════════════════════

🚀 INSTALLATION STEPS
═════════════════════════════════════════════════════════════════════

1️⃣  DOWNLOAD & INSTALL GreenLuma
   
   If not already installed, download from:
   → https://github.com/nbulischeck/GreenLuma/releases
   
   Download the latest release and install to:
   C:\\Program Files\\GreenLuma

2️⃣  COPY MANIFEST FILES

   Copy the .lua files to GreenLuma manifests folder:
   
   ${manifestFolder}
   
   Or use GreenLuma GUI to import manifests.

3️⃣  OPEN GreenLuma & ADD GAME

   a) Open GreenLuma application
   b) Click "Add Game"
   c) Enter AppID: 1274570
   d) Select manifest:
      - For English items: 1274570.lua
      - For Vietnamese items: 1274570_vi.lua 🇻🇳

4️⃣  UPDATE & PLAY

   a) Click "Update" button
   b) Wait for process to complete
   c) Launch Devour from Steam
   d) All items unlocked! ✨

═════════════════════════════════════════════════════════════════════

📝 NOTES
═════════════════════════════════════════════════════════════════════

✓ Make sure Devour is NOT running when updating
✓ GreenLuma needs admin rights to work
✓ First launch after update may take longer
✓ All unlocked items are local-only (single-player)

═════════════════════════════════════════════════════════════════════

🎯 WHAT YOU GET
═════════════════════════════════════════════════════════════════════

Choose English (1274570.lua):
  ✅ All Outfits unlocked (60+)
  ✅ All Perks unlocked (50+)
  ✅ All Emotes unlocked (20+)
  📝 Names in English

Or Choose Vietnamese (1274570_vi.lua):
  ✅ All Outfits unlocked (60+)
  ✅ All Perks unlocked (50+)
  ✅ All Emotes unlocked (20+)
  📝 Names in Vietnamese (Tiếng Việt) 🇻🇳

═════════════════════════════════════════════════════════════════════

❓ TROUBLESHOOTING
═════════════════════════════════════════════════════════════════════

Q: GreenLuma says "File not found"
A: Check manifest folder path and restart GreenLuma

Q: Items not unlocked after restart
A: Verify manifest in GreenLuma is selected and "Updated"
   Restart Devour (not just reload)

Q: Can't install GreenLuma on C:\\
A: Use portable version or install to different drive
   Edit manifest path in GreenLuma settings

Q: Want to switch between English/Vietnamese?
A: Just select different manifest in GreenLuma and update again

═════════════════════════════════════════════════════════════════════

Created: ${new Date().toLocaleString('vi-VN')}
Script: devour-deploy.js
Version: 1.0
`;
  
  const guideFile = 'DEVOUR_SETUP_GUIDE.txt';
  fs.writeFileSync(guideFile, guideContent, 'utf8');
  
  return guideFile;
}

function main() {
  console.log(`\n${'═'.repeat(70)}`);
  console.log('🎮 DEVOUR - Complete Setup & Deployment');
  console.log(`${'═'.repeat(70)}`);
  
  const args = process.argv.slice(2);
  const customPath = args.includes('--path')
    ? args[args.indexOf('--path') + 1]
    : null;
  
  // Create GreenLuma folder
  const manifestFolder = createGreenLumaFolder(customPath);
  
  // Copy files
  const copiedCount = copyManifestFiles(manifestFolder);
  
  if (copiedCount === 0) {
    log('\n❌', 'No manifest files found!');
    log('💡', 'Run: node devour-complete.js first\n');
    process.exit(1);
  }
  
  // Generate guide
  const guideFile = generateSetupGuide(manifestFolder);
  
  // Summary
  console.log(`\n${'═'.repeat(70)}`);
  console.log('✅ SETUP COMPLETE!');
  console.log(`${'═'.repeat(70)}\n`);
  
  log('📦', `Copied ${copiedCount} manifest files`);
  log('📁', `Location: ${manifestFolder}`);
  log('📝', `Guide: ${guideFile}`);
  
  log('\n🎯', 'NEXT STEP:');
  log('', `1. Open: ${guideFile}`);
  log('', '2. Follow the installation steps');
  log('', '3. Enjoy Devour with all items unlocked! ✨\n');
}

main();
