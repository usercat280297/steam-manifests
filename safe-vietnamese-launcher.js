#!/usr/bin/env node
/**
 * Safe Vietnamese Game Launcher
 * Translates Devour, launches game, then restores original
 */

const fs = require('fs');
const path = require('path');
const { execSync, spawn } = require('child_process');

const GAME_PATH = 'D:\\SteamLibrary\\steamapps\\common\\Devour';
const INVENTORY_FILE = path.join(GAME_PATH, 'inventory.json');
const BACKUP_FILE = path.join(GAME_PATH, 'inventory.json.backup');
const VI_FILE = 'D:\\SteamLibrary\\steamapps\\common\\Devour\\inventory_vi.json';
const EXE_PATH = path.join(GAME_PATH, 'Devour.exe');

// Vietnamese translations dictionary
const translations = {
  'Moonless Night': 'Đêm Không Trăng',
  'Claws Out': 'Móng Vuốt Ra',
  'Feeling Blue': 'Cảm Thấy Buồn',
  'Role Model': 'Hình Mẫu',
  'Elementary': 'Cơ Bản',
  'Summer Loving': 'Yêu Mùa Hè',
  'Big Hitter': 'Người Đánh Mạnh',
  'Front Crawl': 'Bơi Sấp',
  'Hollow': 'Rỗng',
  'Jingle Hells': 'Điểm Giáng Sinh',
  'Principal Dancer': 'Vũ Công Chính',
  'Screamer': 'Người Hét Lớn',
  'Daddy Cool': 'Bố Lạnh Lùng',
  'Troublemaker': 'Tên Gây Rối',
  'Cheongsam': 'Áo Dài Trung Hoa',
  'Cat': 'Mèo',
  'Stitched Up': 'Khâu Kín',
  'Here Comes The Bride': 'Cô Dâu Đang Tới',
  'Speed Walker': 'Người Đi Bộ Nhanh',
  'Tamed': 'Được Thuần Hóa',
  'Little Helper': 'Trợ Thủ Nhỏ',
  'Inpatient': 'Bệnh Nhân Nội Trú',
  'Lone Ranger': 'Tay Súng Cô Độc',
  'Keymaster': 'Bậc Thầy Chìa Khóa',
  'Stay Back': 'Ở Lại Phía Sau',
  'Teamwork': 'Làm Việc Nhóm',
  'Patient': 'Bệnh Nhân',
  'Inspired': 'Được Truyền Cảm Hứng',
  'Glitterbomb': 'Bom Lấp Lánh',
  'Stone': 'Đá',
  'Gangnam Style': 'Phong Cách Gangnam',
  'Macarena': 'Macarena',
  'Snake Hip-Hop': 'Snake Hip-Hop',
  'Twerk': 'Twerk',
  'Twist': 'Twist',
  'Timber': 'Gỗ',
  'Fallout': 'Hậu Quả',
  'Aftershock': 'Dư Chấn',
  'First Responder': 'Người Ứng Cứu Đầu Tiên',
  'Pug': 'Chó Pug',
  'Outfit': 'Trang Phục',
  'Perk': 'Kỹ Năng',
  'Emote': 'Biểu Cảm',
  'Flashlight': 'Đèn Pin',
  'Pet': 'Vật Nuôi',
};

async function safeGameLaunch() {
  try {
    console.log('🎮 Safe Vietnamese Devour Launcher\n');

    // Step 1: Check files exist
    console.log('📋 Checking files...');
    if (!fs.existsSync(BACKUP_FILE)) {
      console.error('❌ Backup file not found:', BACKUP_FILE);
      process.exit(1);
    }
    if (!fs.existsSync(EXE_PATH)) {
      console.error('❌ Game exe not found:', EXE_PATH);
      process.exit(1);
    }

    // Step 2: Read backup and apply translations
    console.log('🌍 Applying Vietnamese translation...');
    const data = JSON.parse(fs.readFileSync(BACKUP_FILE, 'utf8'));
    
    let translated = 0;
    Object.keys(data).forEach(key => {
      if (isNaN(key)) return;
      const item = data[key];
      
      if (translations[item.name]) {
        item.name = translations[item.name];
        translated++;
      }
      if (translations[item.display_type]) {
        item.display_type = translations[item.display_type];
      }
    });

    // Step 3: Write Vietnamese version
    const jsonStr = JSON.stringify(data, null, 2);
    fs.writeFileSync(INVENTORY_FILE, jsonStr, { encoding: 'utf8' });
    console.log(`✅ Applied ${translated} translations\n`);

    // Step 4: Launch game
    console.log('🚀 Launching Devour...\n');
    const gameProcess = spawn(EXE_PATH, { 
      cwd: GAME_PATH,
      detached: true,
      stdio: 'ignore'
    });
    gameProcess.unref();

    // Step 5: Wait and restore
    console.log('⏳ Game launched. Waiting...');
    console.log('   (Automatically restoring original file when you close game)\n');

    // Monitor process - check every 2 seconds
    const checkInterval = setInterval(() => {
      try {
        // If process not found, it's closed
        execSync(`tasklist /FI "PID eq ${gameProcess.pid}" /FO CSV /NH`, { stdio: 'pipe' });
      } catch {
        // Game closed - restore
        clearInterval(checkInterval);
        console.log('\n⏸️  Game closed. Restoring original file...');
        fs.copyFileSync(BACKUP_FILE, INVENTORY_FILE);
        console.log('✅ Original file restored');
        console.log('🔒 Steam can now verify integrity without issues');
        process.exit(0);
      }
    }, 2000);

    // Handle parent process termination
    process.on('exit', () => {
      clearInterval(checkInterval);
      fs.copyFileSync(BACKUP_FILE, INVENTORY_FILE);
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
    // Try to restore on error
    try {
      fs.copyFileSync(BACKUP_FILE, INVENTORY_FILE);
      console.log('✅ Original file restored after error');
    } catch (e) {
      console.error('⚠️  Could not restore file:', e.message);
    }
    process.exit(1);
  }
}

safeGameLaunch();
