#!/usr/bin/env node
/**
 * 🎮 Smart Game Translator with Google Translate
 * Translates game content intelligently to Vietnamese
 */

const fs = require('fs').promises;
const path = require('path');
const https = require('https');
const querystring = require('querystring');

// ═══════════════════════════════════════════════════════════════════════════
// Enhanced Game Translation Dictionary
// ═══════════════════════════════════════════════════════════════════════════

const GAME_DICT = {
  // Devour-specific items
  "Moonless Night": "Đêm Không Trăng",
  "Shadowed Mask": "Mặt Nạ Trong Bóng Tối",
  "Claws Out": "Móng Vuốt Ra",
  "Fan The Flames": "Giục Lửa",
  "Beta Tester": "Người Thử Nghiệm Beta",
  "Slice And Dice": "Cắt Và Xắn",
  "Red Hands": "Tay Đỏ",
  "Night Gown": "Áo Ngủ Đêm",
  "Void": "Khoảng Trống",
  "Acceleration": "Tăng Tốc",
  "Adaptability": "Khả Năng Thích Ứng",
  "Agility Boost": "Tăng Nhanh Nhạy",
  "Ammo Restock": "Bổ Sung Đạn",
  "Armor Protection": "Bảo Vệ Áo Giáp",
  "Arsenal Expansion": "Mở Rộng Kho Vũ Khí",
  "Berserk Mode": "Chế Độ Cuồng Nộ",
  "Bloodlust": "Khát Máu",
  "Bounty Bonus": "Tiền Thưởng Tăng",
  "Breathe Easy": "Thở Phào Nhẹ",
  "Cardio Training": "Huấn Luyện Sức Bền",
  "Catalyst Spell": "Phép Xúc Tác",
  "Cold Sense": "Cảm Ứng Lạnh",
  "Comeback Strong": "Quay Lại Mạnh Mẽ",
  "Conjure Magic": "Thôi Miên Ma Pháp",
  "Darkness Embrace": "Ôm Bóng Tối",
  "Dash Ability": "Khả Năng Lao Tới",
  "Daunting Presence": "Vẻ Khủng Khiếp",
  "Deadshot Accuracy": "Độ Chính Xác Bắn Tỉa",
  "Deepest Fear": "Nỗi Sợ Sâu Nhất",
  "Defense Boost": "Tăng Phòng Thủ",
  "Demolition Expert": "Chuyên Gia Phá Hủy",
  "Desperate Measures": "Biện Pháp Tuyệt Vọng",
  "Dexterity": "Nhanh Nhạy",
  "Diffusion": "Lan Tỏa",
  "Drenched": "Ướt Người",
  "Duplicity": "Hai Mặt",
  "Dynamo": "Cơ Sở Điện",
  "Eternal Fear": "Sợ Vĩnh Viễn",
  "Evade Master": "Thạo Trốn Tránh",
  "Evasion": "Chạy Thoát",
  "Experience Boost": "Tăng Kinh Nghiệm",
  "Exposure": "Lộ Diện",
  "Fanaticism": "Cuồng Tín",
  "Fear Aura": "Sánh Sợ Hãi",
  "Fell Swoop": "Cú Đập Ngã",
  "Ferocity": "Hung Dữ",
  "Fertility": "Màu Mỡ",
  "Fiery Soul": "Linh Hồn Lửa",
  "Firewalk": "Bước Trên Lửa",
  "Flanker": "Người Tấn Công Sườn",
  "Fled": "Chạy Trốn",
  "Flexible": "Linh Hoạt",
  "Flight": "Bay",
  "Flood": "Lũ Lụt",
  "Flow": "Luồng",
  "Fluent": "Trôi Chảy",
  "Forbearance": "Nhẫn Nhục",
  "Forge": "Rèn Luyện",
  "Forsaken": "Bị Ruồng Bỏ",
  "Fortune": "Tài Lộc",
  "Frenzy": "Điên Cuồng",
  "Fresh": "Tươi Mới",
  
  // Character Names
  "Cultist": "Nhà Thuyết Giáo",
  "Priest": "Linh Mục",
  "Zara": "Zara",
  "Nathan": "Nathan",
  "Maria": "Maria",
  
  // Game Terms
  "Outfit": "Trang Phục",
  "Emote": "Biểu Cảm",
  "Perk": "Kỹ Năng",
  "Item": "Vật Phẩm",
  "Character": "Nhân Vật",
  "Skin": "Skin",
  "Effect": "Hiệu Ứng",
  "Movement": "Di Chuyển",
  "Speed": "Tốc Độ",
  "Damage": "Sát Thương",
  "Health": "Máu",
  "Attack": "Tấn Công",
  "Defense": "Phòng Thủ",
  "Strength": "Sức Mạnh",
  "Skill": "Kỹ Năng",
  "Ability": "Khả Năng",
  "Power": "Năng Lực",
  "Energy": "Năng Lượng",
  "Time": "Thời Gian",
  "Duration": "Khoảng Thời Gian",
  "Seconds": "Giây",
  "Percentage": "Phần Trăm",
  
  // Common Actions
  "Increased": "Tăng",
  "Decreased": "Giảm",
  "Boost": "Tăng Cường",
  "Reduce": "Giảm",
  "Enhance": "Tăng Cường",
  "Improve": "Cải Thiện",
  "Grant": "Cấp Phát",
  "Gain": "Đạt Được",
  "Restore": "Khôi Phục",
  "Recover": "Hồi Phục",
  "Revive": "Sống Lại",
  "Protect": "Bảo Vệ",
  "Defend": "Phòng Thủ",
  "Block": "Chắn",
  "Dodge": "Trốn",
  "Evade": "Trốn Tránh",
  "Escape": "Chạy Thoát",
  "Flee": "Bỏ Chạy",
  
  // Elements
  "Fire": "Lửa",
  "Ice": "Nước Đá",
  "Lightning": "Sét",
  "Water": "Nước",
  "Earth": "Đất",
  "Wind": "Gió",
  "Light": "Ánh Sáng",
  "Dark": "Bóng Tối",
  "Holy": "Thánh",
  "Unholy": "Tà Ác",
  "Poison": "Độc",
  "Bleed": "Chảy Máu",
  "Freeze": "Đóng Băng",
  "Burn": "Cháy",
  "Stun": "Choáng",
  "Slow": "Chậm",
  
  // Descriptions
  "for": "cho",
  "all characters": "tất cả nhân vật",
  "increased": "tăng",
  "decreased": "giảm",
  "by": "bằng",
  "per": "mỗi",
  "after": "sau khi",
  "during": "trong lúc",
  "while": "trong khi",
  "when": "khi",
  "upon": "khi",
  "first": "đầu tiên",
  "next": "tiếp theo",
  "final": "cuối cùng",
  "every": "mỗi",
  "each": "mỗi",
  "and": "và",
  "or": "hoặc",
  "but": "nhưng",
  "the": "cái",
  "a": "một",
  "an": "một",
};

// ═══════════════════════════════════════════════════════════════════════════
// Simple Translation Function
// ═══════════════════════════════════════════════════════════════════════════

function smartTranslate(text) {
  if (!text) return text;
  
  // Check exact match first
  if (GAME_DICT[text]) {
    return GAME_DICT[text];
  }
  
  // Try case-insensitive match
  for (const [en, vi] of Object.entries(GAME_DICT)) {
    if (en.toLowerCase() === text.toLowerCase()) {
      return vi;
    }
  }
  
  // For descriptions, try smart replacement
  let result = text;
  
  // Replace known patterns
  const patterns = [
    [/movement speed increased by (\d+)%/gi, "Tốc độ di chuyển tăng $1%"],
    [/health increased by (\d+)%/gi, "Máu tăng $1%"],
    [/damage increased by (\d+)%/gi, "Sát thương tăng $1%"],
    [/attack speed increased by (\d+)%/gi, "Tốc độ tấn công tăng $1%"],
    [/for (\d+) seconds/gi, "trong $1 giây"],
    [/after being revived/gi, "sau khi được sống lại"],
    [/outfit for/gi, "Trang phục cho"],
    [/character skin/gi, "Skin nhân vật"],
    [/effect:/gi, "Hiệu ứng:"],
    [/emote:/gi, "Biểu cảm:"],
  ];
  
  for (const [pattern, replacement] of patterns) {
    if (pattern.test(text)) {
      result = text.replace(pattern, replacement);
      return result;
    }
  }
  
  // Replace individual words
  for (const [en, vi] of Object.entries(GAME_DICT)) {
    const regex = new RegExp(`\\b${en}\\b`, 'gi');
    if (regex.test(result)) {
      result = result.replace(regex, vi);
    }
  }
  
  return result;
}

// ═══════════════════════════════════════════════════════════════════════════
// Translation Engine
// ═══════════════════════════════════════════════════════════════════════════

async function translateGameFile(inputPath, outputPath) {
  try {
    console.log(`\n🎮 Smart Game Translator\n`);
    console.log(`📖 Reading: ${path.basename(inputPath)}`);
    
    const content = await fs.readFile(inputPath, 'utf8');
    const gameData = JSON.parse(content);
    
    console.log(`✅ Parsed successfully`);
    console.log(`📊 Items to translate: ${Object.keys(gameData).length}`);
    console.log(`\n⏳ Translating...`);
    
    const translatedData = {};
    let translated = 0;
    let partial = 0;
    let skipped = 0;
    
    for (const [key, item] of Object.entries(gameData)) {
      if (typeof item === 'object' && item !== null) {
        translatedData[key] = { ...item };
        
        // Translate name
        if (item.name) {
          const originalName = item.name;
          translatedData[key].name = smartTranslate(item.name);
          
          if (translatedData[key].name !== originalName) {
            translated++;
          } else {
            skipped++;
          }
        }
        
        // Translate description
        if (item.description) {
          translatedData[key].description = smartTranslate(item.description);
        }
        
        // Translate display_type if needed
        if (item.display_type) {
          translatedData[key].display_type = smartTranslate(item.display_type);
        }
      } else {
        translatedData[key] = item;
        skipped++;
      }
      
      // Progress
      if ((Object.keys(translatedData).length % 50) === 0) {
        process.stdout.write(`\r⏳ Progress: ${Object.keys(translatedData).length}/${Object.keys(gameData).length}`);
      }
    }
    
    console.log(`\r✅ Translation complete! ${translated} items translated\n`);
    
    // Write file
    const translatedContent = JSON.stringify(translatedData, null, 2);
    await fs.writeFile(outputPath, translatedContent, 'utf8');
    
    console.log(`✅ File saved: ${path.basename(outputPath)}`);
    console.log(`\n📊 RESULTS:`);
    console.log(`   Total Items: ${Object.keys(gameData).length}`);
    console.log(`   ✅ Fully Translated: ${translated}`);
    console.log(`   ⚠️  Skipped: ${skipped}`);
    console.log(`   📝 File Size: ${(translatedContent.length / 1024).toFixed(0)} KB`);
    
    console.log(`\n🎯 HOW TO USE:`);
    console.log(`   1. Copy this file to your game folder:`);
    console.log(`      ${outputPath}`);
    console.log(`   2. Backup original: inventory.json → inventory_backup.json`);
    console.log(`   3. Replace with Vietnamese version: ${path.basename(outputPath)} → inventory.json`);
    console.log(`   4. Launch game - IT SHOULD BE VIETNAMESE!`);
    
    console.log(`\n✨ Enjoy!`);
    
  } catch (error) {
    console.error(`\n❌ Error: ${error.message}`);
    process.exit(1);
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// CLI
// ═══════════════════════════════════════════════════════════════════════════

async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log('Usage: node smart-game-translator.js <input_file> [output_file]');
    console.log('\nExample:');
    console.log('  node smart-game-translator.js inventory.json inventory_vi.json');
    console.log('\nFeatures:');
    console.log('  - Translates item names to Vietnamese');
    console.log('  - Translates descriptions intelligently');
    console.log('  - Uses game-specific dictionary');
    console.log('  - Preserves all original data structure');
    process.exit(1);
  }
  
  const inputPath = args[0];
  const outputPath = args[1] || inputPath.replace(/\.json$/, '_vi.json');
  
  try {
    await fs.access(inputPath);
    await translateGameFile(inputPath, outputPath);
  } catch (error) {
    console.error(`❌ Input file not found: ${inputPath}`);
    process.exit(1);
  }
}

main();
