# 🎮 Hướng Dẫn Dịch Game Sang Tiếng Việt

## 📖 Tổng Quan

Dự án này cung cấp các công cụ để **dịch toàn bộ nội dung game sang Tiếng Việt**, bao gồm:
- 👕 Trang phục (Outfits)
- 🎯 Kỹ năng (Perks)  
- 😄 Biểu cảm (Emotes)
- 📝 Tất cả mô tả (Descriptions)

Kết quả là một file Lua manifest tương thích với **GreenLuma** để sử dụng items Việt hóa.

---

## 🛠️ Công Cụ Sẵn Có

### 1. **auto-translate-game.js** (🌟 Chính)
**Dịch inventory file sang Tiếng Việt**

```bash
node auto-translate-game.js <input_file.json> [output_file.json]
```

**Cách hoạt động:**
- Tải file JSON chứa tất cả items
- Dùng dictionary để dịch từng item
- Áp dụng smart patterns cho mô tả
- Lưu kết quả thành file `_vi.json`

**Ví dụ:**
```bash
# Input: inventory.json (chứa 131 items English)
node auto-translate-game.js inventory.json inventory_vi.json
# Output: inventory_vi.json (tất cả items Vietnamese)
```

### 2. **game-translator-helper.js** (🆕 Mới)
**Hướng dẫn từng bước dịch game**

```bash
node game-translator-helper.js <appId> [action]
```

**Actions:**
- `info` - Xem thông tin game & files sẵn có
- `decrypt` - Hướng dẫn giải mã inventory
- `translate` - Hướng dẫn dùng auto-translate
- `pack` - Hướng dẫn tạo Lua manifest
- `all` - Hiển thị toàn bộ quy trình (mặc định)

**Ví dụ:**
```bash
# Xem toàn bộ quy trình
node game-translator-helper.js 1274570 all

# Chỉ xem info
node game-translator-helper.js 1274570 info
```

### 3. **create-game-package.js** (📦)
**Tạo Lua manifest từ inventory Việt hóa**

```bash
node create-game-package.js <appId> <inventory_vi.json>
```

---

## 🎯 Quy Trình Chi Tiết

### **Step 1: Chuẩn Bị Inventory File**

Bạn cần file `inventory.json` gốc (English) từ game.

**Lấy từ đâu:**
1. **Từ game folder:** `<Game>/Config/Inventory/items.json`
2. **Từ Steam API:** Crawl từ game's content server
3. **Từ Devour server:** `https://www.devourgame.com/api/items`

**Đặt vào:**
```
steam-manifest-bot/
└─ translation_projects/
   └─ 1274570_devour/  (hoặc <appId>_<game_name>/)
      └─ inventory.json (gốc English)
```

### **Step 2: Giải Mã (Nếu Cần)**

Nếu file không phải JSON thuần, cần decode trước:

```bash
# Nếu là Lua format:
luajit decode.lua inventory.lua inventory.json

# Nếu là binary/encrypted:
# Cần reverse-engineer hoặc dùng game modding tools
```

**Ưu tiên:** Hầu hết games modern lưu JSON directly hoặc dùng JSON + zip.

### **Step 3: Dịch Sang Tiếng Việt** ⭐

**Lệnh chính:**
```bash
node auto-translate-game.js translation_projects/1274570_devour/inventory.json translation_projects/1274570_devour/inventory_vi.json
```

**Kết quả:**
```
✅ File translated successfully!
📊 Items processed: 131
📁 Output: inventory_vi.json (122 KB)
```

**Output file sẽ có:**
```json
{
  "1": {
    "name": "Đêm Không Trăng",          // Dịch từ "Moonless Night"
    "description": "Trang Phục cho Nhà Thuyết Giáo",  // Dịch từ "Outfit for Cultist"
    "display_type": "Trang Phục",       // Dịch từ "Outfit"
    ...
  },
  "2": {
    "name": "Móng Vuốt Ra",             // Dịch từ "Claws Out"
    ...
  }
}
```

### **Step 4: Tạo Lua Manifest** 📦

```bash
node create-game-package.js 1274570 translation_projects/1274570_devour/inventory_vi.json
```

**Kết quả:**
```
✅ Lua manifest created!
📁 Output: manifests/1274570.lua (45 KB)
```

File Lua này dùng được với **GreenLuma** để unlock tất cả items Việt hóa.

---

## 📊 Cấu Trúc Dictionary

File `auto-translate-game.js` chứa dictionary:

```javascript
const TRANSLATION_DICT = {
  "Moonless Night": "Đêm Không Trăng",
  "Shadowed Mask": "Mặt Nạ Trong Bóng Tối",
  "Acceleration": "Tăng Tốc",
  "Adaptability": "Khả Năng Thích Ứng",
  // ... 200+ từ khác
};
```

**Để thêm từ:**
1. Mở `auto-translate-game.js`
2. Thêm vào `TRANSLATION_DICT`:
   ```javascript
   "New English Term": "Dịch Tiếng Việt",
   ```
3. Chạy lại: `node auto-translate-game.js ...`

---

## 🔄 Smart Pattern Matching

Script tự động dịch các pattern phổ biến:

| Pattern | Dịch Thành |
|---------|-----------|
| `for X seconds` | `trong X giây` |
| `Movement speed increased` | `Tốc độ di chuyển tăng` |
| `Damage increased by X%` | `Sát thương tăng X%` |
| `Health increased` | `Máu tăng` |
| `Effect: ...` | `Hiệu Ứng: ...` |
| `Outfit for Cultist` | `Trang Phục Cho Nhà Thuyết Giáo` |

---

## 💡 Ví Dụ Thực Tế: DEVOUR Game

### **Bước 1: Chuẩn bị**
```bash
mkdir -p translation_projects/1274570_devour
cp inventory.json translation_projects/1274570_devour/
```

### **Bước 2: Dịch**
```bash
node auto-translate-game.js translation_projects/1274570_devour/inventory.json translation_projects/1274570_devour/inventory_vi.json
```

**Output:**
```
🎮 Game Full Translation Generator

📖 Reading: inventory.json
✅ Parsed successfully
📊 Items to translate: 131

Processing items...
[████████████████████] 100%

✅ Translation complete!
📊 Items translated: 131
📁 Output: inventory_vi.json (122 KB)
```

### **Bước 3: Tạo Manifest**
```bash
node create-game-package.js 1274570 translation_projects/1274570_devour/inventory_vi.json
```

### **Bước 4: Sử dụng**
- Copy `manifests/1274570.lua` vào GreenLuma
- Restart game → Tất cả items đều Tiếng Việt ✨

---

## 🐛 Troubleshooting

### **"File not found"**
```bash
# Kiểm tra file tồn tại:
ls translation_projects/1274570_devour/inventory.json

# Nếu không, copy từ game folder:
cp ~/Games/Devour/inventory.json translation_projects/1274570_devour/
```

### **"Items not translated"**
Có 3 lý do:
1. **Dictionary thiếu từ** → Thêm vào `TRANSLATION_DICT`
2. **Pattern không match** → Thêm regex pattern mới
3. **File format sai** → Ensure input là valid JSON

### **"Invalid JSON"**
```bash
# Validate file:
node -e "console.log(JSON.parse(require('fs').readFileSync('inventory.json')))"

# Hoặc dùng jq:
cat inventory.json | jq .
```

---

## 📝 File Structure

```
steam-manifest-bot/
├── auto-translate-game.js              # 🌟 Dịch inventory
├── game-translator-helper.js           # 🆕 Hướng dẫn step-by-step
├── create-game-package.js              # 📦 Tạo Lua manifest
├── translation_projects/
│  └── 1274570_devour/
│     ├── inventory.json               # Gốc (English)
│     ├── inventory_vi.json            # Dịch (Tiếng Việt)
│     └── backups/
├── manifests/
│  ├── 1274570.lua                    # Lua manifest (GreenLuma ready)
│  └── ...
└── TRANSLATION_VI_GUIDE.md            # File này
```

---

## 🚀 Quick Start

```bash
# 1. Xem quy trình
node game-translator-helper.js 1274570 all

# 2. Dịch game
node auto-translate-game.js translation_projects/1274570_devour/inventory.json translation_projects/1274570_devour/inventory_vi.json

# 3. Tạo manifest
node create-game-package.js 1274570 translation_projects/1274570_devour/inventory_vi.json

# 4. Sử dụng
cp manifests/1274570.lua ~/.greenluma/manifests/
```

---

## 📚 Tham Khảo

- **auto-translate-game.js** - Chi tiết dictionary & patterns
- **DEVOUR_VIETNAMESE_COMPLETE.md** - Báo cáo dịch DEVOUR
- **inventory_DEVOUR_VI_FINAL.json** - Ví dụ output hoàn chỉnh

---

**Created:** Dec 2024  
**Maintained by:** Game Translation Project  
**License:** MIT
