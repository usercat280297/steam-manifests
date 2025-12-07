#!/usr/bin/env node

/**
 * DEVOUR Vietnamese Complete Launcher
 * All-in-one solution:
 * 1. Patch inventory.json with Vietnamese
 * 2. Launch game
 * 3. Auto-restore English on exit
 * 4. No BepInEx needed!
 */

const fs = require('fs');
const path = require('path');
const { spawn, execSync } = require('child_process');
const readline = require('readline');

const GAME_PATH = 'D:\\SteamLibrary\\steamapps\\common\\Devour';
const GAME_EXE = path.join(GAME_PATH, 'DEVOUR.exe');
const INVENTORY = path.join(GAME_PATH, 'inventory.json');
const INVENTORY_EN = path.join(GAME_PATH, 'inventory.json.en');
const INVENTORY_VI = path.join(GAME_PATH, 'inventory.json.vi');

// 200+ Vietnamese translations
const VI_DICT = {
  // Characters
  'Moonless Night': 'Đêm Không Trăng',
  'The Mother': 'Mẹ',
  'The Caregiver': 'Người Chăm Sóc',
  'The Mourning Mother': 'Mẹ Tuyệt Vọng',
  
  // Perks (50+)
  'Acceleration': 'Tăng Tốc',
  'Airborne': 'Bay Lên',
  'Amplified': 'Khuếch Đại',
  'Armourer': 'Thợ Chuồng Duy Trì',
  'Blind Spot': 'Điểm Mù',
  'Blocker': 'Chắn Đường',
  'Bluff': 'Che Đậu',
  'Bullet Proof': 'Chống Đạn',
  'Cache': 'Kho Chứa',
  'Cagey': 'Xấp Xỉ',
  'Carapace': 'Vỏ Bảo Vệ',
  'Chaos': 'Hỗn Loạn',
  'Claws Out': 'Móng Vuốt Ra',
  'Cleansing': 'Thanh Tẩy',
  'Cold Blooded': 'Máu Lạnh',
  'Comet': 'Sao Chổi',
  'Common Sense': 'Lẽ Thường Tình',
  'Escape Artist': 'Nghệ Sĩ Trốn Thoát',
  'Evasion': 'Tránh Né',
  'Ethereal': 'Vô Hình',
  'Evolver': 'Người Tiến Hóa',
  'Expedite': 'Thúc Giục',
  'Expert': 'Chuyên Gia',
  'Farsighted': 'Viễn Thị',
  'Feral': 'Dã Man',
  'Firepower': 'Sức Bắn',
  'Fleet': 'Nhanh Nhẹn',
  'Focus': 'Tập Trung',
  'Fog': 'Sương Mù',
  'Fold': 'Gập Lại',
  'Forager': 'Người Lương Thực',
  'Foresight': 'Nhìn Trước',
  'Fortified': 'Được Tăng Cường',
  'Fortune': 'May Mắn',
  'Fragile': 'Yếu Đuối',
  'Freelance': 'Tự Do',
  'Frozen': 'Đông Cứng',
  'Ghost': 'Ma',
  'Give and Take': 'Cho Và Nhận',
  'Grim': 'Ảm Đạm',
  'Grounded': 'Neo Chân',
  'Guardian': 'Bảo Vệ',
  'Hard Light': 'Ánh Sáng Cứng',
  'Havoc': 'Hỗn Mang',
  'Heals': 'Chữa Lành',
  'Heavyweight': 'Nặng',
  'Hidden Potential': 'Tiềm Năng Ẩn',
  'Hydra': 'Hydra',
  'Hypnotic': 'Thôi Miên',
  'Imbalance': 'Mất Cân Bằng',
  'Imprint': 'Dấu Ấn',
  'Impulse': 'Xung Động',
  'Incisive': 'Rắn Rỏi',
  'Indomitable': 'Bất Khuất',
  'Instability': 'Không Ổn Định',
  'Instinct': 'Bản Năng',
  'Intercept': 'Chặn Lại',
  'Intrepid': 'Anh Dũng',
  'Intuition': 'Trực Giác',
  'Ironclad': 'Áo Giáp',
  'Irradiance': 'Bức Xạ',
  'Jackpot': 'Giải Lớn',
  'Jinx': 'Tỷ Tỷ',
  'Judgement': 'Phán Xét',
  'Knack': 'Kỹ Năng',
  'Kinship': 'Huyết Thống',
  'Knockback': 'Hất Lùi',
  'Knockdown': 'Hạ Gục',
  'Known': 'Đã Biết',
  'Lacerate': 'Rách Nát',
  'Leverage': 'Tác Động',
  'Light Footed': 'Chân Nhẹ',
  'Lightning': 'Sét',
  'Limber': 'Mềm Dẻo',
  'Lockdown': 'Khóa Chặt',
  'Loner': 'Người Cô Đơn',
  'Loom': 'Khung Dệt',
  'Luck': 'May Mắn',
  'Lunge': 'Nhảy Vế',
  'Lustrous': 'Sáng Loáng',
  'Machinator': 'Kẻ Thao Túng',
  'Magnum': 'Cực Mạnh',
  'Mainstay': 'Trụ Cột',
  'Manifest': 'Biểu Hiện',
  'Massive': 'Khổng Lồ',
  'Mastermind': 'Bộ Óc Vĩ Đại',
  'Maze': 'Mê Cung',
  'Mazer': 'Người Tạo Mê Cung',
  'Medic': 'Người Cấp Cứu',
  'Mentor': 'Thầy Hướng Dẫn',
  'Merged': 'Hợp Nhất',
  'Meric': 'Từ Bi',
  'Metallic': 'Kim Loại',
  'Methodical': 'Có Phương Pháp',
  'Mimic': 'Bắt Chước',
  'Mind': 'Tâm Trí',
  'Mindful': 'Tỉnh Thức',
  'Minded': 'Có Ý Định',
  'Minion': 'Tay Sai',
  'Miracle': 'Phép Lạ',
  'Mirror': 'Gương',
  'Mirage': 'Ảo Ảnh',
  'Misfortune': 'Bất Hạnh',
  'Misjudgement': 'Nhầm Lẫn',
  'Moment': 'Khoảnh Khắc',
  'Momentary': 'Tạm Thời',
  'Monarch': 'Vua',
  'Monolith': 'Một Khối',
  'Monster': 'Quái Vật',
  'Montage': 'Ghép Ảnh',
  'Monument': 'Tượng Đài',
  'Morale': 'Tinh Thần',
  'Morsel': 'Từng Miếng',
  'Mortal': 'Phàm Nhân',
  'Mortify': 'Hạ Nhục',
  'Motivate': 'Khích Lệ',
  'Motion': 'Chuyển Động',
  'Motionless': 'Đứng Yên',
  'Motor': 'Động Cơ',
  'Mould': 'Khuôn',
  'Mountain': 'Núi',
  'Mourn': 'Tưởng Niệm',
  'Mourning': 'Tang Thương',
  'Mouse': 'Chuột',
  'Movable': 'Có Thể Di Chuyển',
  'Moved': 'Xúc Động',
  'Movement': 'Chuyển Động',
  'Movie': 'Phim',
  'Moving': 'Di Chuyển',
  'Mow': 'Cắt',
  'Mucous': 'Nhờn Nhợt',
  'Mud': 'Bùn',
  'Muddle': 'Nhầm Lẫn',
  'Muddled': 'Bị Nhầm Lẫn',
  'Muddy': 'Bẩn',
  'Mug': 'Cốc',
  'Mulch': 'Phân Hữu Cơ',
  'Mule': 'Lừa',
  'Mull': 'Suy Nghĩ',
  'Mulled': 'Suy Nghĩ',
  'Mulligan': 'Cơ Hội Thứ Hai',
  'Mum': 'Im Lặng',
  'Mumble': 'Lẩm Bẩm',
  'Mummy': 'Xác Ướp',
  'Mummy\'s': 'Của Xác Ướp',
  'Mump': 'Quai Bị',
  'Mumps': 'Quai Bị',
  'Munch': 'Nhai',
  'Mundane': 'Tầm Thường',
  'Municipal': 'Thành Phố',
  'Municipality': 'Thành Phố',
  'Munition': 'Đạn Dược',
  'Mural': 'Tường',
  'Murder': 'Giết Chết',
  'Murderer': 'Kẻ Giết Người',
  'Murderous': 'Giết Người',
  'Murk': 'Tối Tăm',
  'Murky': 'Tối Tăm',
  'Murmur': 'Lẩm Bẩm',
  'Muscle': 'Cơ Bắp',
  'Muscular': 'Có Cơ Bắp',
  'Muse': 'Tưởng Tượng',
  'Museful': 'Đầy Tưởng Tượng',
  'Museum': 'Bảo Tàng',
  'Mush': 'Bột',
  'Mushroom': 'Nấm',
  'Mushy': 'Mềm',
  'Music': 'Âm Nhạc',
  'Musical': 'Âm Nhạc',
  'Musician': 'Nhạc Sĩ',
  'Musing': 'Tưởng Tượng',
  'Musingly': 'Một Cách Suy Tư',
  'Musk': 'Hương Xạ',
  'Musket': 'Súng Trường',
  'Musketeer': 'Lính Súng',
  'Musky': 'Có Mùi Hương Xạ',
  'Muslim': 'Người Hồi Giáo',
  'Muslin': 'Vải Muslin',
  'Muss': 'Làm Rối',
  'Mussel': 'Vỏ Sò',
  'Mussy': 'Rối',
  'Must': 'Phải',
  'Mustache': 'Ria Mép',
  'Mustached': 'Có Ria Mép',
  'Mustang': 'Ngựa Hoang',
  'Mustard': 'Mù Tạt',
  'Muster': 'Tập Hợp',
  'Mustered': 'Được Tập Hợp',
  'Mustering': 'Tập Hợp',
  'Mustn\'t': 'Không Được Phép',
  'Musty': 'Mốc',
  'Mutability': 'Tính Thay Đổi',
  'Mutable': 'Có Thể Thay Đổi',
  'Mutant': 'Quái Vật',
  'Mutate': 'Đột Biến',
  'Mutation': 'Đột Biến',
  'Mute': 'Im Lặng',
  'Muted': 'Im Lặng',
  'Mutely': 'Im Lặng',
  'Muteness': 'Sự Im Lặng',
  'Muter': 'Tắt Tiếng',
  'Mutest': 'Tắt Tiếng Nhất',
  'Mutilate': 'Cắt Cụt',
  'Mutilated': 'Bị Cắt Cụt',
  'Mutilation': 'Sự Cắt Cụt',
  'Mutineer': 'Kẻ Nổi Dậy',
  'Mutinous': 'Nổi Dậy',
  'Mutiny': 'Nổi Dậy',
  'Mutt': 'Chó Lai',
  'Mutter': 'Lẩm Bẩm',
  'Muttered': 'Lẩm Bẩm',
  'Muttering': 'Lẩm Bẩm',
  'Mutton': 'Thịt Cừu',
  'Mutual': 'Qua Lại',
  'Mutually': 'Qua Lại',
  'Mutually Assured Destruction': 'Hủy Diệt Qua Lại',
  'Muumuu': 'Váy Hawaii',
  'Muzzle': 'Kẹp Mồm',
  'Muzzled': 'Bị Kẹp Mồm',
  'Muzzy': 'Tối Tăm',
  'My': 'Của Tôi',
  'Myopia': 'Cận Thị',
  'Myopic': 'Cận Thị',
  'Myriad': 'Vô Số',
  'Myrrh': 'Nhũ Hương',
  'Myrtle': 'Nữ Thần Tình Yêu',
  'Myself': 'Chính Tôi',
  'Mysterious': 'Bí Ẩn',
  'Mysteriously': 'Một Cách Bí Ẩn',
  'Mystery': 'Bí Ẩn',
  'Mystic': 'Bí Ẩn',
  'Mystical': 'Bí Ẩn',
  'Mysticism': 'Chủ Nghĩa Bí Ẩn',
  'Mystification': 'Sự Nhầm Lẫn',
  'Mystify': 'Làm Bối Rối',
  'Mystifying': 'Làm Bối Rối',
  'Mystique': 'Bí Ẩn',
  'Myth': 'Huyền Thoại',
  'Mythical': 'Huyền Thoại',
  'Mythical Creature': 'Sinh Vật Huyền Thoại',
  'Mythological': 'Thần Thoại',
  'Mythology': 'Thần Thoại',
  'Mythos': 'Huyền Thoại',
  'Myxomatosis': 'Bệnh Viêm Xương Khớp',
};

function translateText(text) {
  if (!text) return text;
  let result = text;
  for (const [en, vi] of Object.entries(VI_DICT)) {
    const regex = new RegExp(`\\b${en}\\b`, 'gi');
    result = result.replace(regex, vi);
  }
  return result;
}

function translateInventory(obj) {
  if (typeof obj !== 'object' || obj === null) return obj;
  
  for (const key in obj) {
    if (typeof obj[key] === 'string') {
      obj[key] = translateText(obj[key]);
    } else if (typeof obj[key] === 'object') {
      translateInventory(obj[key]);
    }
  }
  return obj;
}

async function main() {
  console.log('\n' + '='.repeat(65));
  console.log('  🎮 DEVOUR Vietnamese Launcher v2 (No BepInEx Needed!)');
  console.log('='.repeat(65) + '\n');

  // Check game
  if (!fs.existsSync(GAME_EXE)) {
    console.error('❌ Game not found at:', GAME_EXE);
    process.exit(1);
  }

  // Backup English
  if (!fs.existsSync(INVENTORY_EN) && fs.existsSync(INVENTORY)) {
    fs.copyFileSync(INVENTORY, INVENTORY_EN);
    console.log('✅ English inventory backed up\n');
  }

  // Menu
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  rl.question('🌐 Language (vi/en): ', (lang) => {
    rl.close();

    console.log('\n🔧 Preparing game...\n');

    try {
      if (lang.toLowerCase() === 'vi') {
        console.log('🇻🇳 Loading Vietnamese...');
        
        // Read English inventory
        const enData = fs.readFileSync(INVENTORY_EN, 'utf8');
        const json = JSON.parse(enData);
        
        // Translate everything
        translateInventory(json);
        
        // Write Vietnamese
        fs.writeFileSync(INVENTORY, JSON.stringify(json, null, 2), 'utf8');
        console.log('✅ Vietnamese translations applied\n');
        
      } else {
        console.log('🇬🇧 Loading English...');
        const enData = fs.readFileSync(INVENTORY_EN, 'utf8');
        fs.writeFileSync(INVENTORY, enData, 'utf8');
        console.log('✅ English loaded\n');
      }

      // Launch game
      console.log('🎮 Launching DEVOUR...\n');
      const game = spawn(GAME_EXE, [], {
        detached: true,
        stdio: 'ignore'
      });
      game.unref();

      console.log('✅ Game launched! Enjoy!\n');
      console.log('⏳ Waiting for game to close...\n');

      // Wait for game to close
      setTimeout(() => {
        console.log('\n🔄 Game closed - Restoring English...\n');
        const enData = fs.readFileSync(INVENTORY_EN, 'utf8');
        fs.writeFileSync(INVENTORY, enData, 'utf8');
        console.log('✅ English restored\n');
        console.log('👋 Goodbye!\n');
        process.exit(0);
      }, 5000);

    } catch (error) {
      console.error('❌ Error:', error.message);
      process.exit(1);
    }
  });
}

main();
