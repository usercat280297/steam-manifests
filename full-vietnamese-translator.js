#!/usr/bin/env node
/**
 * Full Vietnamese Translator for Devour
 * Translates ALL items while keeping structure intact
 */

const fs = require('fs');

// Vietnamese translations dictionary
const translations = {
  // Outfits
  'Moonless Night': 'Đêm Không Trăng',
  'Claws Out': 'Móng Vuốt Ra',
  'Cyberpunk': 'Cyberpunk',
  'Patriot': 'Yêu Nước',
  'Plague Doctor': 'Bác Sĩ Dịch Hạch',
  'Sepia': 'Sepia',
  'Trad Goth': 'Goth Truyền Thống',
  'Casual Friday': 'Thứ Sáu Thoải Mái',
  'Zombie': 'Zombie',
  'Chef': 'Đầu Bếp',
  'Green Machine': 'Máy Xanh',
  'Cyber Samurai': 'Samurai Điện Tử',
  'Disco Inferno': 'Địa Ngục Disco',
  'Neon Assassin': 'Sát Thủ Neon',
  'Neon Shuriken': 'Shuriken Neon',
  'Void': 'Khoảng Trống',
  'Neon Oni': 'Oni Neon',
  'Neon Cyberpunk': 'Cyberpunk Neon',
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
  'Stitched Up': 'Khâu Kín',
  'Here Comes The Bride': 'Cô Dâu Đang Tới',
  'Daddy Cool': 'Bố Lạnh Lùng',
  'Troublemaker': 'Tên Gây Rối',
  'Cheongsam': 'Áo Dài Trung Hoa',
  'Little Helper': 'Trợ Thủ Nhỏ',
  'Inpatient': 'Bệnh Nhân Nội Trú',
  'Lone Ranger': 'Tay Súng Cô Độc',

  // Perks
  'Keymaster': 'Bậc Thầy Chìa Khóa',
  'Stay Back': 'Ở Lại Phía Sau',
  'Teamwork': 'Làm Việc Nhóm',
  'Patient': 'Bệnh Nhân',
  'Inspired': 'Được Truyền Cảm Hứng',
  'Speed Walker': 'Người Đi Bộ Nhanh',
  'Tamed': 'Được Thuần Hóa',
  'Aftershock': 'Dư Chấn',
  'First Responder': 'Người Ứng Cứu Đầu Tiên',

  // Emotes
  'Gangnam Style': 'Phong Cách Gangnam',
  'Macarena': 'Macarena',
  'Snake Hip-Hop': 'Snake Hip-Hop',
  'Twerk': 'Twerk',
  'Twist': 'Twist',

  // Flashlights
  'Glitterbomb': 'Bom Lấp Lánh',
  'Stone': 'Đá',
  'Timber': 'Gỗ',
  'Fallout': 'Hậu Quả',

  // Pets
  'Cat': 'Mèo',
  'Pug': 'Chó Pug',

  // Display types
  'Outfit': 'Trang Phục',
  'Perk': 'Kỹ Năng',
  'Emote': 'Biểu Cảm',
  'Flashlight': 'Đèn Pin',
  'Pet': 'Vật Nuôi',
};

async function translateAllItems() {
  try {
    console.log('🌍 Full Vietnamese Translator\n');

    // Read original
    const backupPath = 'D:\\SteamLibrary\\steamapps\\common\\Devour\\inventory.json.backup';
    const gamePath = 'D:\\SteamLibrary\\steamapps\\common\\Devour\\inventory.json';

    const data = JSON.parse(fs.readFileSync(backupPath, 'utf8'));

    let translated = 0;
    let displayTypeChanged = 0;

    // Translate all items
    Object.keys(data).forEach(key => {
      if (isNaN(key)) return;

      const item = data[key];

      // Translate name
      if (translations[item.name]) {
        console.log(`  ✓ "${item.name}" → "${translations[item.name]}"`);
        item.name = translations[item.name];
        translated++;
      }

      // Translate display_type
      if (translations[item.display_type]) {
        item.display_type = translations[item.display_type];
        displayTypeChanged++;
      }
    });

    // Write to game folder
    const jsonStr = JSON.stringify(data, null, 2);
    fs.writeFileSync(gamePath, jsonStr, { encoding: 'utf8' });

    console.log(`\n✅ Translation Complete!`);
    console.log(`   📝 Items translated: ${translated}/129`);
    console.log(`   🏷️  Display types changed: ${displayTypeChanged}`);
    console.log(`   💾 File saved: ${gamePath}`);
    console.log(`\n🎮 Open game to see Vietnamese!`);

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

translateAllItems();
