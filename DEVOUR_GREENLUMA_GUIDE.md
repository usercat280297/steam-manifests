# 🎮 DEVOUR - Vietnamese Localization & GreenLuma Manifest

Bộ công cụ hoàn chỉnh để **tạo GreenLuma manifest từ game Devour** - dùng để unlock tất cả items trong game.

## ✨ Tính Năng

✅ **Auto-Extract** - Tự động tìm & extract inventory từ game folder  
✅ **UTF-8 Fix** - Sửa lỗi encoding  
✅ **Vietnamese Translation** - Dịch 200+ terms sang Tiếng Việt  
✅ **GreenLuma Ready** - Tạo .lua manifest sẵn dùng  
✅ **All-in-One** - 1 lệnh để làm tất cả  

---

## 🚀 Quick Start

### **Option 1: Tất Cả Trong Một Lệnh (Khuyến Nghị)**

```bash
node devour-complete.js
```

Nó sẽ:
1. Extract inventory từ: `D:\SteamLibrary\steamapps\common\Devour\inventory.json`
2. Dịch sang Tiếng Việt
3. Tạo 2 manifest files:
   - `manifests/1274570.lua` (English)
   - `manifests/1274570_vi.lua` (Vietnamese 🇻🇳)

### **Option 2: Chỉ English Manifest (Nhanh Hơn)**

```bash
node devour-complete.js --english-only
```

Output: `manifests/1274570.lua`

### **Option 3: Chỉ Vietnamese Manifest**

Nếu bạn đã có inventory file rồi:

```bash
node devour-complete.js --vi-only
```

---

## 📋 Chi Tiết Các Scripts

### **1. devour-greenluma-maker.js** 🎮
Extract inventory từ game + tạo English manifest

```bash
node devour-greenluma-maker.js
```

**Tự động tìm Devour ở:**
- `D:\SteamLibrary\steamapps\common\Devour` (Steam default)
- `C:\Program Files\Steam\steamapps\common\Devour`
- Hoặc set env: `DEVOUR_PATH=D:\path\to\Devour`

**Output:**
```
translation_projects/1274570_devour/
└─ inventory.json (131 items)

manifests/
└─ 1274570.lua (GreenLuma Lua format)
```

### **2. devour-vi-translator.js** 🌐
Dịch inventory sang Tiếng Việt

```bash
node devour-vi-translator.js
```

**Input:** `translation_projects/1274570_devour/inventory.json`

**Output:** `translation_projects/1274570_devour/inventory_vi.json`

**Dictionary:** 200+ terms (outfits, perks, emotes)

### **3. devour-vi-manifest.js** 📦
Tạo Vietnamese manifest từ inventory_vi.json

```bash
node devour-vi-manifest.js
```

**Output:** `manifests/1274570_vi.lua` (Vietnamese GreenLuma format)

---

## 📁 File Structure

```
steam-manifest-bot/
├── devour-complete.js              ← 🌟 Chạy cái này
├── devour-greenluma-maker.js       (Step 1)
├── devour-vi-translator.js         (Step 2)
├── devour-vi-manifest.js           (Step 3)
│
├── translation_projects/
│  └── 1274570_devour/
│     ├── inventory.json            (English)
│     └── inventory_vi.json         (Vietnamese)
│
└── manifests/
   ├── 1274570.lua                 (English - GreenLuma format)
   └── 1274570_vi.lua              (Vietnamese - GreenLuma format)
```

---

## 🎯 Cách Dùng GreenLuma

### **Step 1: Copy Manifest File**

```bash
# Copy file vào GreenLuma manifests folder
copy manifests\1274570.lua "C:\Program Files\GreenLuma\manifests\"
# Hoặc
copy manifests\1274570_vi.lua "C:\Program Files\GreenLuma\manifests\"
```

### **Step 2: GreenLuma GUI**

1. Mở **GreenLuma**
2. Nhấp **"Add Game"** → Nhập AppID: **1274570** (Devour)
3. Chọn manifest: **1274570.lua** hoặc **1274570_vi.lua**
4. Nhấp **"Update"**

### **Step 3: Khởi Động Game**

Khởi động Devour → Tất cả items sẽ unlocked! ✨

---

## 🌐 Translation Dictionary

Tất cả items được dịch:

| English | Tiếng Việt | Category |
|---------|-----------|----------|
| Moonless Night | Đêm Không Trăng | Outfit |
| Acceleration | Tăng Tốc | Perk |
| Macarena | Macarena | Emote |
| ... | ... | ... |

**Total:** 200+ terms

---

## ⚙️ Environment Variables

```bash
# Set custom Devour path
set DEVOUR_PATH=D:\path\to\Devour

# Then run:
node devour-greenluma-maker.js
```

---

## 📊 What Gets Extracted

```json
{
  "1": {
    "id": 1,
    "name": "Đêm Không Trăng",
    "description": "Trang Phục Cho Nhà Thuyết Giáo",
    "display_type": "Trang Phục",
    "type": "item"
  },
  "2": {
    "id": 2,
    "name": "Móng Vuốt Ra",
    "description": "Trang Phục Cho Zara",
    "display_type": "Trang Phục",
    "type": "item"
  },
  ...
}
```

**Total Items:** 131 (129 trong manifest)

---

## 🐛 Troubleshooting

### **"Devour game folder not found"**

```bash
# Set environment variable
set DEVOUR_PATH=D:\SteamLibrary\steamapps\common\Devour

# Hoặc install Devour từ Steam
```

### **"inventory.json not found"**

Đảm bảo Devour đã được khởi động ít nhất 1 lần để tạo file inventory.

### **"Invalid JSON"**

File inventory có thể bị corrupted. Cố gắng:
1. Khởi động Devour lại
2. Chờ vài giây sau khi thoát
3. Chạy script lại

### **GreenLuma không nhận manifest**

- Kiểm tra manifest ở đúng folder: `C:\Program Files\GreenLuma\manifests\`
- Khởi động lại GreenLuma
- Thử reload trong GreenLuma UI

---

## 📝 Command Reference

```bash
# All-in-one (recommended)
node devour-complete.js

# English only
node devour-complete.js --english-only

# Vietnamese only (if inventory already extracted)
node devour-complete.js --vi-only

# Step-by-step
node devour-greenluma-maker.js      # Extract
node devour-vi-translator.js        # Translate
node devour-vi-manifest.js          # Create VI manifest
```

---

## 📚 Output Files

```
✅ manifests/1274570.lua       (41.2 KB) - English GreenLuma manifest
✅ manifests/1274570_vi.lua    (41.8 KB) - Vietnamese GreenLuma manifest

✅ translation_projects/1274570_devour/inventory.json     (122 KB) - English items
✅ translation_projects/1274570_devour/inventory_vi.json  (123 KB) - Vietnamese items
```

---

## 🎮 Game Info

- **Game:** Devour
- **AppID:** 1274570
- **Total Items:** 131
  - Outfits: 60+
  - Perks: 50+
  - Emotes: 20+

---

## 🚀 One-Liner Setup

```bash
# Extract, translate, create manifest, all in one line
node devour-complete.js && echo "✅ Done! Manifest ready at manifests/1274570_vi.lua"
```

---

**Created:** Dec 2024  
**Language:** English & Vietnamese  
**Format:** GreenLuma Lua Manifest  
**Compatible:** Windows Steam
