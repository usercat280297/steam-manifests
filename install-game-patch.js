#!/usr/bin/env node
/**
 * 🎮 Game Vietnamese Patcher
 * Automatically installs Vietnamese translation into game folder
 */

const fs = require('fs').promises;
const path = require('path');

async function installVietnamesePatch(gamePath, translationFile) {
  try {
    console.log(`\n🎮 Game Vietnamese Patcher\n`);
    console.log(`📂 Game Path: ${gamePath}`);
    console.log(`📄 Translation File: ${translationFile}`);
    
    // Check if game path exists
    try {
      await fs.access(gamePath);
    } catch {
      console.error(`❌ Game folder not found: ${gamePath}`);
      process.exit(1);
    }
    
    // Check if translation file exists
    try {
      await fs.access(translationFile);
    } catch {
      console.error(`❌ Translation file not found: ${translationFile}`);
      process.exit(1);
    }
    
    const originalFile = path.join(gamePath, 'inventory.json');
    const backupFile = path.join(gamePath, 'inventory.json.backup');
    
    console.log(`\n⏳ Installing Vietnamese translation...`);
    
    // Backup original
    console.log(`   1️⃣  Backing up original file...`);
    try {
      await fs.access(originalFile);
      await fs.copyFile(originalFile, backupFile);
      console.log(`      ✅ Backup created: inventory.json.backup`);
    } catch (error) {
      console.error(`      ⚠️  Could not backup (file may not exist)`);
    }
    
    // Copy Vietnamese file
    console.log(`   2️⃣  Installing Vietnamese translation...`);
    const translationContent = await fs.readFile(translationFile, 'utf8');
    await fs.writeFile(originalFile, translationContent, 'utf8');
    console.log(`      ✅ Vietnamese version installed!`);
    
    // Verify
    console.log(`   3️⃣  Verifying installation...`);
    const verifyContent = await fs.readFile(originalFile, 'utf8');
    if (verifyContent.includes('Đêm Không Trăng')) {
      console.log(`      ✅ Verified - Vietnamese text found!`);
    } else {
      console.log(`      ⚠️  Could not verify Vietnamese content`);
    }
    
    console.log(`\n✅ INSTALLATION COMPLETE!\n`);
    console.log(`🎮 Next steps:`);
    console.log(`   1. Launch your game`);
    console.log(`   2. All items should now show Vietnamese names!`);
    console.log(`   3. To restore English: copy inventory.json.backup → inventory.json`);
    
    console.log(`\n💾 Backup location: ${backupFile}`);
    console.log(`   If anything goes wrong, you can restore the backup.`);
    
  } catch (error) {
    console.error(`\n❌ Error: ${error.message}`);
    process.exit(1);
  }
}

async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log(`Usage: node install-game-patch.js <game_folder> <translation_file>`);
    console.log(`\nExample:`);
    console.log(`  node install-game-patch.js "D:\\SteamLibrary\\steamapps\\common\\Devour" inventory_DEVOUR_VI.json`);
    console.log(`\nWhat it does:`);
    console.log(`  1. Backs up your original inventory.json`);
    console.log(`  2. Installs the Vietnamese translation`);
    console.log(`  3. You can restore anytime from the backup`);
    process.exit(1);
  }
  
  const gamePath = args[0];
  const translationFile = args[1];
  
  await installVietnamesePatch(gamePath, translationFile);
}

main().catch(error => {
  console.error(`Fatal error: ${error.message}`);
  process.exit(1);
});
