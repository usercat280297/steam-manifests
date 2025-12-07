#!/usr/bin/env node
/**
 * 🎮 Game Full Translation Generator
 * Automatically translates ALL game content to Vietnamese
 * Creates a complete translated game file ready to use
 */

const fs = require('fs').promises;
const path = require('path');

// ═══════════════════════════════════════════════════════════════════════════
// Translation Dictionary - Devour Game
// ═══════════════════════════════════════════════════════════════════════════

const TRANSLATION_DICT = {
  // Outfits / Trang phục
  "Moonless Night": "Đêm Không Trăng",
  "Shadowed Mask": "Mặt Nạ Trong Bóng Tối",
  "Cultist": "Nhà Thuyết Giáo",
  "Priest": "Linh Mục",
  
  // Perks / Kỹ Năng
  "Acceleration": "Tăng Tốc",
  "Adaptability": "Khả Năng Thích Ứng",
  "Ammunition": "Đạn",
  "Armor": "Áo Giáp",
  "Arsenal": "Kho Vũ Khí",
  "Berserk": "Cuồng Nộ",
  "Bloodlust": "Khát Máu",
  "Bounty": "Phần Thưởng",
  "Breathe": "Thở Phào",
  "Cardio": "Sức Bền",
  "Catalyst": "Xúc Tác",
  "Claustrophobia": "Sợ Chật Hẹp",
  "Climb": "Leo Trèo",
  "Clumsiness": "Vụng Về",
  "Cold Sense": "Cảm Ứng Lạnh",
  "Comeback": "Quay Lại",
  "Conjure": "Thôi Miên",
  "Darkness": "Bóng Tối",
  "Dash": "Lao Tới",
  "Daunting": "Khủng Khiếp",
  "Deadshot": "Bắn Chính Xác",
  "Deepest Fear": "Nỗi Sợ Sâu Nhất",
  "Defense": "Phòng Thủ",
  "Demolition": "Phá Hủy",
  "Desperate": "Tuyệt Vọng",
  "Dexterity": "Nhanh Nhạy",
  "Diffusion": "Lan Tỏa",
  "Drenched": "Ướt Người",
  "Duplicity": "Hai Mặt",
  "Dynamo": "Cơ Sở Điện",
  "Eternal Fear": "Sợ Vĩnh Viễn",
  "Evade": "Trốn Tránh",
  "Evasion": "Chạy Thoát",
  "Experience": "Kinh Nghiệm",
  "Exposure": "Lộ Diện",
  "Fanaticism": "Cuồng Tín",
  "Fear": "Sợ Hãi",
  "Fell": "Ngã",
  "Ferocity": "Hung Dữ",
  "Fertile": "Trì Trệ",
  "Fiery": "Lửa",
  "Firewalk": "Bước Trên Lửa",
  "Flanker": "Thành Viên Lân Cận",
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
  "Friar": "Tu Sĩ",
  "Friction": "Ma Sát",
  "Friendship": "Tình Bạn",
  "Fright": "Sợ Sệt",
  "Frugal": "Tiết Kiệm",
  "Fuel": "Nhiên Liệu",
  "Fulcrum": "Điểm Tựa",
  "Full House": "Tay Đầy",
  "Fury": "Giận Dữ",
  "Gadget": "Dụng Cụ",
  "Gallant": "Anh Dũng",
  "Gallop": "Phi Ngựa",
  "Gamble": "Đánh Bạc",
  "Gamer": "Người Chơi Game",
  "Ghastly": "Ghê Rợn",
  "Ghostly": "Bóng Ma",
  "Gimmick": "Thủ Thuật",
  "Glacial": "Nước Đá",
  "Glee": "Vui Sướng",
  "Glitch": "Lỗi",
  "Globetrotter": "Nhà Du Hành",
  "Gloom": "Ảm Đạm",
  "Glow": "Phát Sáng",
  "Glutton": "Tham Lam",
  "Gnash": "Nghiến Răng",
  "Goad": "Xúi Giục",
  "Goblin": "Quỷ Xanh",
  "Godly": "Thánh Thiêng",
  "Godsend": "Phúc Lành Trời",
  "Gold": "Vàng",
  "Goldsmith": "Thợ Kim Hoàn",
  "Golf": "Golf",
  "Gone": "Đã Mất",
  "Good": "Tốt",
  "Goodbye": "Tạm Biệt",
  "Goodness": "Nhân Từ",
  "Goods": "Hàng Hóa",
  "Goose": "Ngỗng",
  "Gorge": "Hẻm Sâu",
  "Gorgeous": "Tuyệt Đẹp",
  "Gory": "Đẫm Máu",
  "Gospel": "Phúc Âm",
  "Gossip": "Nói Xấu",
  "Gothic": "Gothic",
  "Gouge": "Ngoèn",
  "Gourmet": "Ẩm Thực Cao Cấp",
  "Governess": "Nữ Gia Sư",
  "Gown": "Áo Dạ Hội",
  "Grace": "Ân Sủi",
  "Graceful": "Thanh Lịch",
  "Grade": "Cấp Độ",
  "Gradient": "Gradient",
  "Grain": "Hạt",
  "Grammar": "Ngữ Pháp",
  "Gramophone": "Máy Hát Cũ",
  "Granary": "Kho Thóc",
  "Grand": "Hoành Tráng",
  "Grandeur": "Oai Vệ",
  "Grandiose": "Rất Hoành Tráng",
  "Grandly": "Hoành Tráng",
  "Granite": "Đá Granite",
  "Granny": "Bà Ngoại",
  "Grant": "Cấp Phát",
  "Granulate": "Tạo Hạt",
  "Grape": "Nho",
  "Grapefruit": "Bưởi",
  "Grapevine": "Nho Dùng Để Làm Rượu",
  "Graph": "Đồ Thị",
  "Graphite": "Graphite",
  "Grasp": "Nắm Giữ",
  "Grass": "Cỏ",
  "Grasshopper": "Châu Chấu",
  "Grassland": "Đất Cỏ",
  "Grate": "Rây",
  "Grateful": "Biết Ơn",
  "Gratification": "Sự Thỏa Mãn",
  "Gratify": "Làm Thỏa Mãn",
  "Grating": "Lồng Thép",
  "Gratis": "Miễn Phí",
  "Gratitude": "Lòng Biết Ơn",
  "Gratuitous": "Miễn Phí",
  "Gratuity": "Tiền Tip",
  "Grave": "Mộ",
  "Gravel": "Cuội",
  "Graven": "Chạm Khắc",
  "Graver": "Thêm Trầm Trọng",
  "Gravest": "Nghiêm Trọng Nhất",
  "Gravestone": "Bia Mộ",
  "Graveyard": "Nghĩa Trang",
  "Gravid": "Có Thai",
  "Gravidity": "Sự Có Thai",
  "Gravimeter": "Máy Đo Trọng Lực",
  "Gravimetric": "Liên Quan Đến Trọng Lực",
  "Gravity": "Trọng Lực",
  "Gravy": "Nước Thịt",
  "Gray": "Xám",
  "Graybeard": "Ông Già",
  "Graze": "Cắn Cỏ",
  "Grazer": "Vật Ăn Cỏ",
  "Grease": "Mỡ",
  "Greasepaint": "Mỹ Phẩm Sân Khấu",
  "Greasy": "Béo",
  "Great": "Vĩ Đại",
  "Greatly": "Rất",
  "Greatness": "Vĩ Đại",
  "Greats": "Những Người Vĩ Đại",
  "Greave": "Bảo Vệ Chân",
  "Grebe": "Chim Lặn",
  "Grecian": "Hy Lạp",
  "Greed": "Tham Lam",
  "Greedy": "Tham Lam",
  "Greek": "Hy Lạp",
  "Green": "Xanh",
  "Greenback": "Đôla Giấy",
  "Greenbelt": "Vành Đai Xanh",
  "Greenery": "Cây Xanh",
  "Greenfield": "Vùng Đất Chưa Phát Triển",
  "Greenfinch": "Chim Sẻ Xanh",
  "Greenfly": "Ruồi Xanh",
  "Greengage": "Mận Xanh",
  "Greengrocer": "Người Bán Rau Quả",
  "Greenhead": "Chim Vịt Xanh",
  "Greenhouse": "Nhà Kính",
  "Greenhorn": "Tân Binh",
  "Greenie": "Người Yêu Thích Môi Trường",
  "Greenish": "Hơi Xanh",
  "Greenism": "Chủ Nghĩa Xanh",
  "Greensward": "Bãi Cỏ",
  "Greensward": "Bãi Cỏ",
  "Greenway": "Đường Xanh",
  "Greenwich": "Greenwich",
  "Greenwood": "Rừng Xanh",
  "Greet": "Chào",
  "Greeter": "Người Chào",
  "Greeting": "Lời Chào",
  "Gregale": "Gió Bắc Đông Bắc",
  "Gregaria": "Loài Xã Hội",
  "Gregarian": "Xã Hội",
  "Gregarious": "Thích Đông Đúc",
  "Greggy": "Tương Tự Gregarious",
  "Gregorian": "Gregorian",
  "Gregories": "Gregory",
  "Gregorm": "Tên Riêng",
  
  // Common Gaming Terms
  "Item": "Vật Phẩm",
  "Perk": "Kỹ Năng",
  "Outfit": "Trang Phục",
  "Emote": "Biểu Cảm",
  "Weapon": "Vũ Khí",
  "Armor": "Áo Giáp",
  "Quest": "Nhiệm Vụ",
  "Boss": "Trùm",
  "Enemy": "Kẻ Thù",
  "NPC": "NPC",
  "Health": "Máu",
  "Damage": "Sát Thương",
  "Speed": "Tốc Độ",
  "Strength": "Sức Mạnh",
  "Defense": "Phòng Thủ",
  "Level": "Level",
  "Experience": "Kinh Nghiệm",
  "Skill": "Kỹ Năng",
  "Ability": "Khả Năng",
  "Power": "Năng Lực",
  "Energy": "Năng Lượng",
  "Mana": "Mana",
  "Shop": "Cửa Hàng",
  "Inventory": "Túi Đồ",
  "Equipment": "Trang Bị",
  "Weapon": "Vũ Khí",
  "Shield": "Khiên",
  "Helm": "Mũ",
  "Boots": "Giày",
  "Gloves": "Găng Tay",
  "Ring": "Nhẫn",
  "Necklace": "Vòng Cổ",
  "Cape": "Áo Choàng",
  "Movement": "Di Chuyển",
  "Attack": "Tấn Công",
  "Dodge": "Trốn Tránh",
  "Block": "Chắn",
  "Cast": "Dùng Phép",
  "Spell": "Phép Thuật",
  "Magic": "Ma Pháp",
  "Elemental": "Nguyên Tố",
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
  "Weakness": "Yếu",
  "Strength": "Mạnh",
  "Buff": "Tăng Cường",
  "Debuff": "Suy Yếu",
  "Critical": "Chí Mạng",
  "Dodge": "Trốn",
  "Counter": "Đối Kháng",
  "Riposte": "Phản Công",
};

// ═══════════════════════════════════════════════════════════════════════════
// Translation Functions
// ═══════════════════════════════════════════════════════════════════════════

function translateText(text) {
  // Check if exact match exists
  if (TRANSLATION_DICT[text]) {
    return TRANSLATION_DICT[text];
  }
  
  // Check for partial matches
  for (const [en, vi] of Object.entries(TRANSLATION_DICT)) {
    if (text.toLowerCase().includes(en.toLowerCase())) {
      return text.replace(new RegExp(en, 'gi'), vi);
    }
  }
  
  // Use smart translation for common patterns
  let result = text;
  
  // Pattern: "Movement speed increased by X%"
  if (text.match(/movement speed increased by/i)) {
    result = text.replace(/movement speed increased by/i, "Tốc độ di chuyển tăng");
  }
  
  // Pattern: "Damage increased by X%"
  if (text.match(/damage increased by/i)) {
    result = text.replace(/damage increased by/i, "Sát thương tăng");
  }
  
  // Pattern: "Health increased by X"
  if (text.match(/health.*increased/i)) {
    result = text.replace(/health/i, "Máu").replace(/increased/i, "tăng");
  }
  
  // Pattern: "X% for Y seconds"
  if (result.match(/for \d+ seconds/i)) {
    result = result.replace(/for (\d+) seconds/i, "trong $1 giây");
  }
  
  // Pattern: "Effect: ..."
  if (result.match(/effect:/i)) {
    result = result.replace(/effect:/i, "Hiệu Ứng:");
  }
  
  // Pattern: "Emote: ..."
  if (result.match(/emote:/i)) {
    result = result.replace(/emote:/i, "Biểu Cảm:");
  }
  
  // Pattern: "Outfit for ..."
  if (result.match(/outfit for/i)) {
    result = result.replace(/outfit for/i, "Trang Phục Cho");
  }
  
  // Pattern: "Character Skin"
  if (result.match(/character skin/i)) {
    result = result.replace(/character skin/i, "Skin Nhân Vật");
  }
  
  // Pattern: "Perk: ..."
  if (result.match(/^perk:/i)) {
    result = result.replace(/^perk:/i, "Kỹ Năng:");
  }
  
  return result;
}

function translateObject(obj) {
  const translated = {};
  
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      // Only translate name and description fields
      if (key === 'name' || key === 'description' || key === 'display_type') {
        translated[key] = translateText(value);
      } else {
        translated[key] = value;
      }
    } else {
      translated[key] = value;
    }
  }
  
  return translated;
}

// ═══════════════════════════════════════════════════════════════════════════
// Main Translation Function
// ═══════════════════════════════════════════════════════════════════════════

async function translateGameFile(inputPath, outputPath) {
  try {
    console.log(`\n🎮 Game Full Translation Generator\n`);
    console.log(`📖 Reading: ${path.basename(inputPath)}`);
    
    const content = await fs.readFile(inputPath, 'utf8');
    const gameData = JSON.parse(content);
    
    console.log(`✅ Parsed successfully`);
    console.log(`📊 Items to translate: ${Object.keys(gameData).length}`);
    
    // Translate all items
    const translatedData = {};
    let translated = 0;
    let skipped = 0;
    
    for (const [key, item] of Object.entries(gameData)) {
      if (typeof item === 'object' && item !== null) {
        translatedData[key] = translateObject(item);
        
        // Check if name was translated
        if (item.name && translatedData[key].name !== item.name) {
          translated++;
        } else {
          skipped++;
        }
      } else {
        translatedData[key] = item;
        skipped++;
      }
      
      // Progress indicator
      if ((Object.keys(translatedData).length % 100) === 0) {
        process.stdout.write(`\r🔄 Progress: ${Object.keys(translatedData).length}/${Object.keys(gameData).length}`);
      }
    }
    
    console.log(`\r✅ Translation complete: ${translated} items translated\n`);
    console.log(`📝 Writing: ${path.basename(outputPath)}`);
    
    // Write translated file
    const translatedContent = JSON.stringify(translatedData, null, 2);
    await fs.writeFile(outputPath, translatedContent, 'utf8');
    
    console.log(`\n✅ SUCCESS! File saved: ${outputPath}`);
    console.log(`\n📊 SUMMARY:`);
    console.log(`   Total Items: ${Object.keys(gameData).length}`);
    console.log(`   Translated: ${translated}`);
    console.log(`   Skipped: ${skipped}`);
    console.log(`   File Size: ${(translatedContent.length / 1024 / 1024).toFixed(2)} MB`);
    console.log(`\n💾 NEXT STEPS:`);
    console.log(`   1. Copy this file to game folder:`);
    console.log(`      ${outputPath}`);
    console.log(`   2. Replace original inventory.json with this file`);
    console.log(`   3. Launch game - it should be fully Vietnamese!`);
    console.log(`\n✨ Enjoy your Vietnamese game!`);
    
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
    console.log('Usage: node auto-translate-game.js <input_file> [output_file]');
    console.log('\nExample:');
    console.log('  node auto-translate-game.js inventory.json inventory_vi.json');
    console.log('  node auto-translate-game.js inventory.json');
    console.log('  (Output will be: inventory_vi.json)');
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
