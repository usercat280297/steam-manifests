#!/usr/bin/env node
/**
 * 🎮 DEVOUR - Complete Vietnamese Localization Kit
 * 
 * All-in-one tool to:
 * 1. Extract inventory từ game
 * 2. Dịch sang Tiếng Việt
 * 3. Tạo GreenLuma manifest
 * 
 * Usage:
 *   node devour-complete.js [--english-only] [--vi-only]
 * 
 * Flags:
 *   --english-only : Chỉ tạo English manifest (không dịch)
 *   --vi-only      : Chỉ tạo Vietnamese manifest
 */

const { execSync } = require('child_process');

function log(emoji, message) {
  console.log(`${emoji} ${message}`);
}

function runScript(scriptName, description) {
  try {
    log('\n', '─'.repeat(70));
    log('▶️', `${description}`);
    log('', '─'.repeat(70));
    execSync(`node ${scriptName}`, { stdio: 'inherit' });
    return true;
  } catch (error) {
    log('❌', `Failed to run ${scriptName}`);
    return false;
  }
}

function main() {
  const args = process.argv.slice(2);
  const englishOnly = args.includes('--english-only');
  const viOnly = args.includes('--vi-only');
  
  console.log(`\n${'═'.repeat(70)}`);
  console.log('🎮 DEVOUR - Complete Vietnamese Localization Kit');
  console.log(`${'═'.repeat(70)}`);
  
  if (!englishOnly && !viOnly) {
    log('', 'Creating both English and Vietnamese manifests...\n');
  } else if (englishOnly) {
    log('', 'Creating English manifest only...\n');
  } else {
    log('', 'Creating Vietnamese manifest only...\n');
  }
  
  // Step 1: Extract from game
  if (!viOnly) {
    if (!runScript('devour-greenluma-maker.js', 
        'STEP 1: Extract inventory from Devour game')) {
      process.exit(1);
    }
    
    if (englishOnly) {
      log('\n✅', 'Done! English manifest created at: manifests/1274570.lua\n');
      return;
    }
  }
  
  // Step 2: Translate
  if (!englishOnly) {
    if (!runScript('devour-vi-translator.js', 
        'STEP 2: Translate to Vietnamese')) {
      process.exit(1);
    }
    
    // Step 3: Create VI manifest
    if (!runScript('devour-vi-manifest.js', 
        'STEP 3: Create Vietnamese manifest')) {
      process.exit(1);
    }
  }
  
  // Summary
  console.log(`\n${'═'.repeat(70)}`);
  console.log('✅ COMPLETE LOCALIZATION KIT READY!');
  console.log(`${'═'.repeat(70)}\n`);
  
  log('📁', 'Files created:');
  
  if (!viOnly) {
    log('   ', '✅ manifests/1274570.lua (English)');
    log('   ', '✅ translation_projects/1274570_devour/inventory.json');
  }
  
  if (!englishOnly) {
    log('   ', '✅ manifests/1274570_vi.lua (Vietnamese) 🇻🇳');
    log('   ', '✅ translation_projects/1274570_devour/inventory_vi.json');
  }
  
  console.log();
  log('🎯', 'Next steps:');
  log('   ', '1. Copy .lua file to: C:\\Program Files\\GreenLuma\\manifests\\');
  log('   ', '2. Or use GreenLuma GUI to select the manifest');
  log('   ', '3. Click "Update" and restart Devour');
  log('   ', '4. All items unlocked! ✨\n');
}

main();
