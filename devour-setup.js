#!/usr/bin/env node
/**
 * 🎮 Devour - Smart GreenLuma Setup Helper
 * 
 * Tự động detect GreenLuma folder hoặc hỗ trợ custom path
 * 
 * Usage:
 *   node devour-setup.js
 *   node devour-setup.js --greenluma-path "C:\path\to\GreenLuma"
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const COMMON_GREENLUMA_PATHS = [
  'C:\\Program Files\\GreenLuma',
  'C:\\Program Files (x86)\\GreenLuma',
  'D:\\GreenLuma',
  'E:\\GreenLuma',
  process.env.GREENLUMA_PATH
];

function log(emoji, message) {
  console.log(`${emoji} ${message}`);
}

function findGreenLuma() {
  log('\n🔍', 'Searching for GreenLuma installation...\n');
  
  for (const folderPath of COMMON_GREENLUMA_PATHS) {
    if (!folderPath) continue;
    
    if (fs.existsSync(folderPath)) {
      log('✅', `Found: ${folderPath}`);
      return folderPath;
    }
  }
  
  return null;
}

function getManifestsFolder(greenlumaPath) {
  const manifestsPath = path.join(greenlumaPath, 'manifests');
  
  if (!fs.existsSync(manifestsPath)) {
    log('📁', `Creating manifests folder: ${manifestsPath}`);
    fs.mkdirSync(manifestsPath, { recursive: true });
    log('✅', 'Folder created');
  }
  
  return manifestsPath;
}

function copyManifest(sourceFile, destFolder) {
  const fileName = path.basename(sourceFile);
  const destPath = path.join(destFolder, fileName);
  
  if (!fs.existsSync(sourceFile)) {
    log('❌', `Source file not found: ${sourceFile}`);
    return false;
  }
  
  try {
    fs.copyFileSync(sourceFile, destPath);
    log('✅', `Copied: ${fileName}`);
    log('   ', `Destination: ${destPath}`);
    return true;
  } catch (error) {
    log('❌', `Copy failed: ${error.message}`);
    return false;
  }
}

function main() {
  console.log(`\n${'═'.repeat(70)}`);
  console.log('🎮 DEVOUR - Smart GreenLuma Setup Helper');
  console.log(`${'═'.repeat(70)}`);
  
  const args = process.argv.slice(2);
  const customPath = args.includes('--greenluma-path') 
    ? args[args.indexOf('--greenluma-path') + 1] 
    : null;
  
  // Find GreenLuma
  let greenlumaPath = customPath || findGreenLuma();
  
  if (!greenlumaPath) {
    log('\n❌', 'GreenLuma not found!');
    log('\n💡', 'Please specify the path:');
    log('   ', 'node devour-setup.js --greenluma-path "C:\\path\\to\\GreenLuma"');
    log('\n📥', 'Or download GreenLuma:');
    log('   ', 'https://github.com/nbulischeck/GreenLuma/releases\n');
    process.exit(1);
  }
  
  log('\n', '─'.repeat(70));
  log('📋', 'Setup Options');
  log('', '─'.repeat(70));
  
  // Get manifests folder
  const manifestsFolder = getManifestsFolder(greenlumaPath);
  
  log('\n', '─'.repeat(70));
  log('📦', 'Copy Manifest Files');
  log('', '─'.repeat(70) + '\n');
  
  // List available manifests
  const localManifests = [
    'manifests/1274570.lua',
    'manifests/1274570_vi.lua'
  ];
  
  const existingManifests = localManifests.filter(m => fs.existsSync(m));
  
  if (existingManifests.length === 0) {
    log('❌', 'No manifest files found locally!');
    log('💡', 'Run: node devour-complete.js first\n');
    process.exit(1);
  }
  
  log('📂', 'Available manifests:\n');
  
  existingManifests.forEach((manifest, idx) => {
    const size = fs.statSync(manifest).size;
    const sizeKB = (size / 1024).toFixed(1);
    log('', `${idx + 1}. ${path.basename(manifest)} (${sizeKB} KB)`);
  });
  
  log('\n', '─'.repeat(70));
  log('', 'Choose which to copy:');
  log('', '─'.repeat(70) + '\n');
  
  // Interactive selection (simplified - copy all)
  let copiedCount = 0;
  
  for (const manifest of existingManifests) {
    if (copyManifest(manifest, manifestsFolder)) {
      copiedCount++;
    }
  }
  
  if (copiedCount === 0) {
    log('\n❌', 'No files copied!\n');
    process.exit(1);
  }
  
  // Final instructions
  log('\n', '═'.repeat(70));
  log('✅', 'SETUP COMPLETE!');
  log('', '═'.repeat(70) + '\n');
  
  log('🎯', 'Next Steps:');
  log('', '1. Open GreenLuma');
  log('', '2. Add new game:');
  log('', '   - AppID: 1274570 (Devour)');
  log('', `   - Select manifest from: ${manifestsFolder}`);
  log('', '3. Click "Update"');
  log('', '4. Restart Devour game');
  log('', '5. All items unlocked! ✨\n');
  
  log('📂', `GreenLuma Manifests: ${manifestsFolder}\n`);
}

main();
