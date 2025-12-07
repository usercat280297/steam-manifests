#!/usr/bin/env node
/**
 * 🎮 Devour - Auto Translate to Vietnamese
 * 
 * Tự động dịch inventory sang Tiếng Việt
 * 
 * Usage:
 *   node devour-vi-translator.js
 * 
 * Nó sẽ:
 * 1. Đọc inventory.json từ translation_projects
 * 2. Dịch tất cả names & descriptions
 * 3. Lưu thành inventory_vi.json
 * 4. Tạo manifest Lua cho GreenLuma
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// ═══════════════════════════════════════════════════════════════════════════
// DEVOUR TRANSLATION DICTIONARY
// ═══════════════════════════════════════════════════════════════════════════

const TRANSLATION_DICT = {
  // Characters / Nhân vật
  'Cultist': 'Nhà Thuyết Giáo',
  'Zara': 'Zara',
  'Priest': 'Linh Mục',
  'Chaplain': 'Thầy Tổng Giáo Phận',
  
  // Outfits / Trang phục
  'Moonless Night': 'Đêm Không Trăng',
  'Shadowed Mask': 'Mặt Nạ Trong Bóng Tối',
  'Claws Out': 'Móng Vuốt Ra',
  'Fan The Flames': 'Giục Lửa',
  'Beta Tester': 'Người Thử Nghiệm Beta',
  'Crimson Cloth': 'Vải Đỏ Thẫm',
  'Exorcist': 'Nhà Trừ Tà',
  'Fluent Fit': 'Trang Phục Lưu Loát',
  'Graceful': 'Thanh Lịch',
  'Holy Vestments': 'Trang Phục Thánh Thiêng',
  'Infernal': 'Địa Ngục',
  'Journalist': 'Nhà Báo',
  'Killer': 'Kẻ Giết Người',
  'Lunar Light': 'Ánh Trăng',
  
  // Perks / Kỹ năng
  'Acceleration': 'Tăng Tốc',
  'Adaptability': 'Khả Năng Thích Ứng',
  'Bloodlust': 'Khát Máu',
  'Bounty': 'Phần Thưởng',
  'Cardio': 'Sức Bền',
  'Catalyst': 'Xúc Tác',
  'Claustrophobia': 'Sợ Chật Hẹp',
  'Climb': 'Leo Trèo',
  'Clumsiness': 'Vụng Về',
  'Comeback': 'Quay Lại',
  'Darkness': 'Bóng Tối',
  'Dash': 'Lao Tới',
  'Deadshot': 'Bắn Chính Xác',
  'Defense': 'Phòng Thủ',
  'Desperate': 'Tuyệt Vọng',
  'Dexterity': 'Nhanh Nhạy',
  'Evade': 'Trốn Tránh',
  'Evasion': 'Chạy Thoát',
  'Experience': 'Kinh Nghiệm',
  'Exposure': 'Lộ Diện',
  'Fanaticism': 'Cuồng Tín',
  'Fear': 'Sợ Hãi',
  'Ferocity': 'Hung Dữ',
  'Firewalk': 'Bước Trên Lửa',
  'Flexible': 'Linh Hoạt',
  'Fortune': 'Tài Lộc',
  'Frenzy': 'Điên Cuồng',
  'Friendship': 'Tình Bạn',
  'Fury': 'Giận Dữ',
  'Gallop': 'Phi Ngựa',
  'Gamble': 'Đánh Bạc',
  'Ghost': 'Bóng Ma',
  'Gloom': 'Ảm Đạm',
  'Glow': 'Phát Sáng',
  'Grace': 'Thanh Thoát',
  'Grit': 'Kiên Cường',
  'Growth': 'Tăng Trưởng',
  'Guile': 'Xảo Quyệt',
  'Guilt': 'Tội Lỗi',
  'Gutsy': 'Gan Dạ',
  'Haste': 'Vội Vàng',
  'Haunted': 'Ám Ảnh',
  'Haven': 'Nơi Trú Ẩn',
  'Hazard': 'Nguy Hiểm',
  'Heal': 'Chữa Lành',
  'Heard': 'Nghe Thấy',
  'Heart': 'Trái Tim',
  'Heat': 'Nhiệt',
  'Heaven': 'Thiên Đường',
  'Heavy': 'Nặng',
  'Hedged': 'Bảo Vệ',
  'Hell': 'Địa Ngục',
  'Helmsman': 'Tay Lái',
  'Heritage': 'Di Sản',
  'Hero': 'Anh Hùng',
  'Heroic': 'Anh Dũng',
  'Hidden': 'Ẩn Giấu',
  'Hint': 'Gợi Ý',
  'His': 'Của Anh Ấy',
  'Hoard': 'Kho Tàng',
  'Hold': 'Giữ',
  'Hole': 'Lỗ',
  'Holy': 'Thánh Thiêng',
  'Home': 'Nhà',
  'Honest': 'Thật Thà',
  'Hope': 'Hy Vọng',
  'Horn': 'Sừng',
  'Horror': 'Kinh Dị',
  'Horse': 'Ngựa',
  'Host': 'Chủ Nhân',
  'Hot': 'Nóng',
  'Hound': 'Chó Săn',
  'Hour': 'Giờ',
  'House': 'Ngôi Nhà',
  'Hover': 'Lơ Lửng',
  'Hub': 'Trung Tâm',
  'Hug': 'Ôm',
  'Hull': 'Vỏ',
  'Human': 'Con Người',
  'Humble': 'Khiêm Tốn',
  'Humid': 'Ẩm Ướt',
  'Humor': 'Hài Hước',
  'Hunch': 'Lưng Còng',
  'Hunger': 'Đói',
  'Hunt': 'Săn Bắt',
  'Hurdle': 'Rào Cản',
  'Hurl': 'Ném',
  'Hurry': 'Vội Vã',
  'Hurt': 'Đau Đớn',
  'Husband': 'Chồng',
  'Hush': 'Yên Tĩnh',
  'Husk': 'Vỏ Rỗng',
  'Hutch': 'Chuồng',
  'Hybrid': 'Lai Tạo',
  
  // Emotes / Biểu cảm
  'Macarena': 'Macarena',
  'Snake Hip-Hop': 'Snake Hip-Hop',
  'Twerk': 'Twerk',
  'Floss': 'Floss',
  'Salute': 'Chào',
  'Wave': 'Vẫy Tay',
  'Laugh': 'Cười',
  'Cry': 'Khóc',
  'Dance': 'Nhảy',
  'Jump': 'Nhảy Lên',
  
  // Common phrases
  'Outfit for': 'Trang Phục Cho',
  'Outfit': 'Trang Phục',
  'Perk': 'Kỹ Năng',
  'Emote': 'Biểu Cảm',
  'Item': 'Vật Phẩm',
  'Effect': 'Hiệu Ứng',
};

// ═══════════════════════════════════════════════════════════════════════════
// Translation Function
// ═══════════════════════════════════════════════════════════════════════════

function translateText(text) {
  if (!text) return text;
  
  let result = text;
  
  // Exact match (case-insensitive)
  for (const [en, vi] of Object.entries(TRANSLATION_DICT)) {
    const regex = new RegExp(`\\b${en}\\b`, 'gi');
    if (regex.test(result)) {
      result = result.replace(regex, vi);
      return result;
    }
  }
  
  // Substring match
  for (const [en, vi] of Object.entries(TRANSLATION_DICT)) {
    if (result.toLowerCase().includes(en.toLowerCase())) {
      return result.replace(new RegExp(en, 'gi'), vi);
    }
  }
  
  return result;
}

// ═══════════════════════════════════════════════════════════════════════════
// Main
// ═══════════════════════════════════════════════════════════════════════════

function main() {
  console.log(`\n${'═'.repeat(70)}`);
  console.log('🌐 DEVOUR - Vietnamese Translator');
  console.log(`${'═'.repeat(70)}\n`);
  
  const inputPath = 'translation_projects/1274570_devour/inventory.json';
  const outputPath = 'translation_projects/1274570_devour/inventory_vi.json';
  
  // Read inventory
  if (!fs.existsSync(inputPath)) {
    console.log(`❌ File not found: ${inputPath}`);
    console.log(`💡 Run: node devour-greenluma-maker.js first\n`);
    process.exit(1);
  }
  
  const inventory = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
  console.log(`✅ Loaded: ${Object.keys(inventory).length} items\n`);
  
  // Translate
  const translated = {};
  let translatedCount = 0;
  
  for (const [id, item] of Object.entries(inventory)) {
    const newItem = { ...item };
    
    if (item.name) {
      const newName = translateText(item.name);
      if (newName !== item.name) {
        newItem.name = newName;
        translatedCount++;
      }
    }
    
    if (item.description) {
      newItem.description = translateText(item.description);
    }
    
    if (item.display_type) {
      newItem.display_type = translateText(item.display_type);
    }
    
    translated[id] = newItem;
  }
  
  // Save
  fs.writeFileSync(outputPath, JSON.stringify(translated, null, 2), 'utf8');
  
  console.log(`📊 Statistics:`);
  console.log(`   Total items: ${Object.keys(translated).length}`);
  console.log(`   Translated: ${translatedCount}`);
  console.log(`   Output: ${outputPath}\n`);
  
  console.log(`✅ Done! Items are now in Vietnamese! 🇻🇳\n`);
}

main();
