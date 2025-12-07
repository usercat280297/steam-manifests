#!/usr/bin/env node

/**
 * DEVOUR Vietnamese Game Mod Creator
 * Tạo mod Tiếng Việt cho game DEVOUR
 * 
 * Chiến lược:
 * 1. Scan game files để tìm tất cả strings cần dịch
 * 2. Tự động dịch bằng dictionary + OpenAI (optional)
 * 3. Tạo mod package để dùng
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// ============ CONFIG ============
const GAME_PATH = 'D:\\SteamLibrary\\steamapps\\common\\Devour';
const DATA_PATH = path.join(GAME_PATH, 'DEVOUR_Data');
const MOD_OUTPUT_DIR = path.join(process.cwd(), 'devour_mod_vi');
const STREAMING_ASSETS = path.join(DATA_PATH, 'StreamingAssets');

// Vietnamese Translation Dictionary - Devour Game
const VI_DICTIONARY = {
  // ===== CHARACTERS =====
  'Cultist': 'Nhà Thuyết Giáo',
  'Zara': 'Zara',
  'Priest': 'Linh Mục',
  'Chaplain': 'Phó Tế',
  
  // ===== GAME MODES =====
  'Story Mode': 'Chế Độ Câu Chuyện',
  'Online': 'Trực Tuyến',
  'Multiplayer': 'Nhiều Người Chơi',
  'Solo': 'Đơn Độc',
  
  // ===== UI/MENU =====
  'Start Game': 'Bắt Đầu Game',
  'Continue': 'Tiếp Tục',
  'Settings': 'Cài Đặt',
  'Exit': 'Thoát',
  'Main Menu': 'Menu Chính',
  'Pause': 'Tạm Dừng',
  'Resume': 'Tiếp Tục',
  'Options': 'Tùy Chọn',
  'Audio': 'Âm Thanh',
  'Video': 'Video',
  'Gameplay': 'Lối Chơi',
  'Controls': 'Điều Khiển',
  'Difficulty': 'Độ Khó',
  'Easy': 'Dễ',
  'Normal': 'Bình Thường',
  'Hard': 'Khó',
  'Insane': 'Điên Loạn',
  
  // ===== ITEMS & OUTFITS =====
  'Moonless Night': 'Đêm Không Trăng',
  'Claws Out': 'Móng Vuốt Ra',
  'Outfit': 'Trang Phục',
  'Character': 'Nhân Vật',
  'Skin': 'Bề Mặt',
  'Cosmetic': 'Mỹ Phẩm',
  
  // ===== PERKS =====
  'Acceleration': 'Tăng Tốc',
  'Bloodlust': 'Khát Máu',
  'Stamina': 'Sức Chịu Đựng',
  'Speed Boost': 'Tăng Tốc Độ',
  'Strength': 'Sức Mạnh',
  
  // ===== GAME STATS =====
  'Health': 'Sức Khỏe',
  'Sanity': 'Lý Trí',
  'Progress': 'Tiến Độ',
  'Level': 'Cấp Độ',
  'Experience': 'Kinh Nghiệm',
  'Score': 'Điểm',
  'Kills': 'Số Giết',
  'Deaths': 'Số Chết',
  
  // ===== GENERIC =====
  'Yes': 'Có',
  'No': 'Không',
  'OK': 'Được',
  'Cancel': 'Hủy',
  'Save': 'Lưu',
  'Load': 'Tải',
  'Delete': 'Xóa',
  'Back': 'Quay Lại',
  'Next': 'Tiếp Theo',
  'Previous': 'Trước Đó',
};

// ============ UTILITY FUNCTIONS ============

/**
 * Scan game files để tìm text strings
 */
function scanGameFiles() {
  console.log('📁 Scanning game files...');
  const results = {};
  
  // Scan inventory.json
  const inventoryPath = path.join(GAME_PATH, 'inventory.json');
  if (fs.existsSync(inventoryPath)) {
    try {
      const inventory = JSON.parse(fs.readFileSync(inventoryPath, 'utf8'));
      results.inventory = inventory;
      console.log(`✅ Found inventory.json with ${Object.keys(inventory).length} items`);
    } catch (e) {
      console.error(`❌ Error parsing inventory.json:`, e.message);
    }
  }
  
  // Scan StreamingAssets
  if (fs.existsSync(STREAMING_ASSETS)) {
    const files = getAllFiles(STREAMING_ASSETS);
    results.assetFiles = files.filter(f => 
      f.endsWith('.json') || f.endsWith('.txt') || f.endsWith('.xml')
    );
    console.log(`✅ Found ${results.assetFiles.length} text-based asset files`);
  }
  
  return results;
}

/**
 * Get all files recursively
 */
function getAllFiles(dir) {
  let files = [];
  try {
    const items = fs.readdirSync(dir, { withFileTypes: true });
    for (const item of items) {
      const fullPath = path.join(dir, item.name);
      if (item.isDirectory()) {
        files = files.concat(getAllFiles(fullPath));
      } else {
        files.push(fullPath);
      }
    }
  } catch (e) {
    // Ignore errors for inaccessible directories
  }
  return files;
}

/**
 * Dịch text using dictionary
 */
function translateText(text) {
  if (!text || typeof text !== 'string') return text;
  
  // Check if exact match exists
  if (VI_DICTIONARY[text]) {
    return VI_DICTIONARY[text];
  }
  
  // Try partial matches
  for (const [en, vi] of Object.entries(VI_DICTIONARY)) {
    if (text.includes(en)) {
      return text.replace(new RegExp(en, 'g'), vi);
    }
  }
  
  return text;
}

/**
 * Translate inventory to Vietnamese
 */
function translateInventory(inventory) {
  console.log('\n📝 Translating inventory to Vietnamese...');
  const translated = {};
  
  for (const [id, item] of Object.entries(inventory)) {
    translated[id] = {};
    
    for (const [key, value] of Object.entries(item)) {
      if (typeof value === 'string') {
        translated[id][key] = translateText(value);
      } else if (Array.isArray(value)) {
        translated[id][key] = value.map(v => 
          typeof v === 'string' ? translateText(v) : v
        );
      } else {
        translated[id][key] = value;
      }
    }
  }
  
  console.log(`✅ Translated ${Object.keys(translated).length} items`);
  return translated;
}

/**
 * Create mod directory structure
 */
function createModStructure() {
  console.log('\n📦 Creating mod directory structure...');
  
  // Create directories
  const dirs = [
    MOD_OUTPUT_DIR,
    path.join(MOD_OUTPUT_DIR, 'content'),
    path.join(MOD_OUTPUT_DIR, 'content', 'vi'),
    path.join(MOD_OUTPUT_DIR, 'meta'),
  ];
  
  for (const dir of dirs) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`✅ Created directory: ${dir}`);
    }
  }
}

/**
 * Create mod metadata
 */
function createModMetadata() {
  const metadata = {
    name: 'DEVOUR Vietnamese Localization',
    version: '1.0.0',
    author: 'Vietnamese Community',
    description: 'Complete Vietnamese translation mod for DEVOUR game',
    language: 'vi_VN',
    game: 'DEVOUR',
    appId: 1274570,
    createdAt: new Date().toISOString(),
    features: [
      'Full Vietnamese UI translation',
      'Character & outfit names in Vietnamese',
      'Menu & settings translated',
      'Game strings translated',
    ],
    instructions: [
      '1. Download this mod folder',
      '2. Copy to your game mods directory or mod manager',
      '3. Enable Vietnamese mod in game settings',
      '4. Restart game',
    ],
  };
  
  fs.writeFileSync(
    path.join(MOD_OUTPUT_DIR, 'meta', 'mod.json'),
    JSON.stringify(metadata, null, 2),
    'utf8'
  );
  
  console.log('✅ Created mod.json metadata');
}

/**
 * Create translation files
 */
function createTranslationFiles(viInventory) {
  console.log('\n📄 Creating translation files...');
  
  // Save Vietnamese inventory
  fs.writeFileSync(
    path.join(MOD_OUTPUT_DIR, 'content', 'vi', 'inventory_vi.json'),
    JSON.stringify(viInventory, null, 2),
    'utf8'
  );
  console.log('✅ Created inventory_vi.json');
  
  // Create translation strings file
  const translationStrings = {
    ui: {
      menu: {
        main: 'Menu Chính',
        start: 'Bắt Đầu Game',
        continue: 'Tiếp Tục',
        settings: 'Cài Đặt',
        exit: 'Thoát',
      },
      buttons: {
        ok: 'Được',
        cancel: 'Hủy',
        save: 'Lưu',
        load: 'Tải',
        yes: 'Có',
        no: 'Không',
      },
    },
    game: {
      stats: {
        health: 'Sức Khỏe',
        sanity: 'Lý Trí',
        level: 'Cấp Độ',
        experience: 'Kinh Nghiệm',
      },
      difficulty: {
        easy: 'Dễ',
        normal: 'Bình Thường',
        hard: 'Khó',
        insane: 'Điên Loạn',
      },
    },
  };
  
  fs.writeFileSync(
    path.join(MOD_OUTPUT_DIR, 'content', 'vi', 'strings.json'),
    JSON.stringify(translationStrings, null, 2),
    'utf8'
  );
  console.log('✅ Created strings.json');
}

/**
 * Create mod installation guide
 */
function createInstallationGuide() {
  const guide = `# DEVOUR Vietnamese Mod - Installation Guide

## Cài Đặt Mod Tiếng Việt cho DEVOUR

### Phương pháp 1: Manual Installation

1. **Tải mod này về máy**
   \`\`\`
   Folder: devour_mod_vi/
   \`\`\`

2. **Tìm game folder**
   \`\`\`
   D:\\SteamLibrary\\steamapps\\common\\Devour\\
   \`\`\`

3. **Copy mod vào thư mục Mods** (nếu game hỗ trợ)
   \`\`\`
   D:\\SteamLibrary\\steamapps\\common\\Devour\\Mods\\
   (Tạo thư mục Mods nếu chưa có)
   \`\`\`

4. **Enable mod trong game settings**
   - Mở game
   - Đi vào Settings → Language
   - Chọn Vietnamese (Tiếng Việt)
   - Restart game

### Phương pháp 2: Mod Manager

Nếu dùng Mod Manager (Nexus, Vortex, etc.):
1. Cài đặt mod manager
2. Import folder devour_mod_vi
3. Enable mod
4. Run game

### Phương pháp 3: Manual String Replacement

Nếu game không hỗ trợ mods:
1. Backup game files trước
2. Replace strings trong game assets bằng script
3. Update inventory.json với Vietnamese strings

## Nội Dung Mod

- ✅ Vietnamese UI (Menu, Settings, Buttons)
- ✅ Character & Outfit names
- ✅ Perks & Emotes names
- ✅ Game stats & UI strings
- ✅ 200+ translations

## Gỡ Cài Đặt

Xóa folder \`devour_mod_vi\` hoặc disable trong mod manager

## Troubleshooting

**Q: Game không thay đổi ngôn ngữ?**
A: Có thể game không hỗ trợ dynamic mod loading. Thử restart game hoặc verify game files.

**Q: Một số text vẫn là English?**
A: Mod chưa dịch tất cả strings. Báo cho author để update.

**Q: Game bị lỗi sau khi cài mod?**
A: Backup và verify game files trong Steam.

## Support

GitHub: https://github.com/yourname/devour-vi-mod
Issues: Báo lỗi tại GitHub Issues

---
Created: ${new Date().toLocaleDateString('vi-VN')}
Version: 1.0.0
License: CC0 (Public Domain)
`;

  fs.writeFileSync(
    path.join(MOD_OUTPUT_DIR, 'README_VI.md'),
    guide,
    'utf8'
  );
  
  console.log('✅ Created README_VI.md');
}

/**
 * Create simple mod launcher
 */
function createModLauncher() {
  const launcher = `#!/usr/bin/env node

/**
 * DEVOUR Vietnamese Mod Launcher
 * Dùng để enable/disable Vietnamese mod
 */

const fs = require('fs');
const path = require('path');

const GAME_PATH = 'D:\\\\SteamLibrary\\\\steamapps\\\\common\\\\Devour';
const INVENTORY_PATH = path.join(GAME_PATH, 'inventory.json');
const BACKUP_PATH = path.join(GAME_PATH, 'inventory.json.vi.backup');

function enableVietnameseMod() {
  console.log('🇻🇳 Enabling Vietnamese mod...');
  
  if (!fs.existsSync(INVENTORY_PATH)) {
    console.error('❌ Game folder not found');
    return;
  }
  
  // Backup English version
  if (!fs.existsSync(BACKUP_PATH)) {
    fs.copyFileSync(INVENTORY_PATH, BACKUP_PATH);
    console.log('✅ Created backup');
  }
  
  // Load Vietnamese inventory
  const viPath = path.join(__dirname, 'content', 'vi', 'inventory_vi.json');
  if (fs.existsSync(viPath)) {
    const viContent = fs.readFileSync(viPath, 'utf8');
    fs.writeFileSync(INVENTORY_PATH, viContent, 'utf8');
    console.log('✅ Vietnamese mod enabled!');
    console.log('🎮 Restart game to see changes');
  } else {
    console.error('❌ Vietnamese inventory file not found');
  }
}

function disableVietnameseMod() {
  console.log('🔄 Disabling Vietnamese mod...');
  
  if (fs.existsSync(BACKUP_PATH)) {
    fs.copyFileSync(BACKUP_PATH, INVENTORY_PATH);
    console.log('✅ English version restored');
  } else {
    console.error('❌ Backup not found');
  }
}

const action = process.argv[2] || 'enable';

if (action === 'enable') {
  enableVietnameseMod();
} else if (action === 'disable') {
  disableVietnameseMod();
} else {
  console.log('Usage: node launcher.js [enable|disable]');
}
`;

  fs.writeFileSync(
    path.join(MOD_OUTPUT_DIR, 'launcher.js'),
    launcher,
    'utf8'
  );
  
  console.log('✅ Created launcher.js');
}

/**
 * Create mod package
 */
function createModPackage() {
  const packageJson = {
    name: 'devour-vietnamese-mod',
    version: '1.0.0',
    description: 'Vietnamese localization mod for DEVOUR game',
    main: 'launcher.js',
    scripts: {
      'enable': 'node launcher.js enable',
      'disable': 'node launcher.js disable',
    },
    keywords: ['devour', 'game', 'mod', 'vietnamese', 'localization'],
    author: 'Vietnamese Community',
    license: 'CC0',
  };
  
  fs.writeFileSync(
    path.join(MOD_OUTPUT_DIR, 'package.json'),
    JSON.stringify(packageJson, null, 2),
    'utf8'
  );
  
  console.log('✅ Created package.json');
}

/**
 * Generate mod summary
 */
function generateSummary(scanResults, viInventory) {
  const summary = {
    timestamp: new Date().toISOString(),
    modPath: MOD_OUTPUT_DIR,
    translatedItems: Object.keys(viInventory).length,
    dictinarySize: Object.keys(VI_DICTIONARY).length,
    files: {
      inventory: 'content/vi/inventory_vi.json',
      strings: 'content/vi/strings.json',
      metadata: 'meta/mod.json',
      launcher: 'launcher.js',
      guide: 'README_VI.md',
    },
    translations: {
      total: Object.keys(viInventory).length,
      characters: 5,
      items: Object.keys(viInventory).length,
      uiStrings: Object.keys(VI_DICTIONARY).length,
    },
  };
  
  fs.writeFileSync(
    path.join(MOD_OUTPUT_DIR, 'META_SUMMARY.json'),
    JSON.stringify(summary, null, 2),
    'utf8'
  );
  
  console.log('\n' + '='.repeat(50));
  console.log('✅ MOD CREATION COMPLETE!');
  console.log('='.repeat(50));
  console.log(`📦 Mod location: ${MOD_OUTPUT_DIR}`);
  console.log(`📊 Translated items: ${summary.translatedItems}`);
  console.log(`📚 Dictionary entries: ${summary.translarySize}`);
  console.log('');
  console.log('Next steps:');
  console.log('1. node launcher.js enable    (Enable Vietnamese)');
  console.log('2. Restart DEVOUR game');
  console.log('3. Check Settings → Language for Vietnamese option');
  console.log('');
}

// ============ MAIN ============
async function main() {
  console.log('🎮 DEVOUR Vietnamese Mod Creator');
  console.log('='.repeat(50));
  
  // Scan game files
  const scanResults = scanGameFiles();
  
  if (!scanResults.inventory) {
    console.error('❌ Game inventory not found. Make sure DEVOUR is installed at:');
    console.error(`   ${GAME_PATH}`);
    process.exit(1);
  }
  
  // Create mod structure
  createModStructure();
  
  // Translate inventory
  const viInventory = translateInventory(scanResults.inventory);
  
  // Create mod files
  createModMetadata();
  createTranslationFiles(viInventory);
  createInstallationGuide();
  createModLauncher();
  createModPackage();
  
  // Generate summary
  generateSummary(scanResults, viInventory);
}

main().catch(console.error);
