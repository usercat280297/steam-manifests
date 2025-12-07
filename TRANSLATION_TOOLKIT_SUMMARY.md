# 🎮 Complete Game Translation Toolkit

## ✅ Công Cụ Dịch Game - Bộ Hoàn Chỉnh

Bạn hiện có **8 công cụ chính** để dịch bất kì game nào:

### 📊 Project Management
| Tool | Mục đích | Lệnh |
|------|---------|------|
| **translation-manager.js** | Quản lý dự án dịch | `node translation-manager.js create <appid> <game> <name>` |
| **discord-translation-bot.js** | Thông báo tiến độ trên Discord | `node discord-translation-bot.js` |
| **count-translation-strings.js** | Kiểm tra chất lượng & thống kê | `node count-translation-strings.js <projectid>` |

### 🔍 File Processing
| Tool | Mục đích | Lệnh |
|------|---------|------|
| **find-game-strings.js** | Tìm file cần dịch trong game | `node find-game-strings.js "C:\Path\To\Game"` |
| **convert-game-files.js** | Chuyển đổi JSON ↔ CSV ↔ .po | `node convert-game-files.js input.json output.csv` |

### 🎮 Game Integration
| Tool | Mục đích | Lệnh |
|------|---------|------|
| **manifest-bot.js** | Tạo manifest + upload GitHub | Chạy liên tục (Railway) |
| **add-appid.js** | Thêm game vào hệ thống | `node add-appid.js <appid>` |

### 📚 Documentation
| File | Nội dung |
|------|---------|
| **TRANSLATION_TOOLS_GUIDE.md** | Hướng dẫn đầy đủ từng bước |
| **TRANSLATION_MANAGER_GUIDE.md** | Tutorial quản lý dự án |
| **VIETNAMESE_LOCALIZATION_GUIDE.md** | Các ví dụ game thực tế |

---

## 🚀 Workflow Đơn Giản (5 Bước)

```
1️⃣  TÌM FILE
    node find-game-strings.js "C:\Game"
    ↓
2️⃣  TẠO DỰ ÁN
    node translation-manager.js create 1274570 "Devour" "YourName"
    ↓
3️⃣  THÊM FILE
    node translation-manager.js add projectid ./game_strings.json localization
    ↓
4️⃣  DỊCH (Edit file JSON/CSV/PO)
    ✏️ Mở file, dịch từng dòng, lưu
    ↓
5️⃣  XUẤT & TEST
    node translation-manager.js export projectid file_id ./output_vi.json
    🎮 Đặt file vào game, test gameplay
```

---

## 💻 Công Cụ Hỗ Trợ Dịch

### Tích hợp sẵn trong Node.js:
- ✅ **JSON Editor** - VS Code (free)
- ✅ **CSV Editor** - Excel, Google Sheets (free)
- ✅ **PO Editor** - Poedit (free version available)
- ✅ **Format Converter** - `convert-game-files.js`

### Công Cụ Bên Ngoài (Optional):
- **DeepL** - Dịch máy chất lượng cao (https://www.deepl.com)
- **Poedit** - Chuyên dịch .po files (https://poedit.net)
- **OmegaT** - CAT tool miễn phí (https://omegat.org)

---

## 📈 Tính Năng Chủ Yếu

### ✅ translation-manager.js
```bash
# Tạo dự án mới
node translation-manager.js create 1274570 "Devour" "MyName"

# Thêm file để dịch
node translation-manager.js add projectid file.json localization

# Xem danh sách file
node translation-manager.js list projectid

# Xuất file dịch xong
node translation-manager.js export projectid fileid output_vi.json

# Cập nhật tiến độ
node translation-manager.js progress projectid fileid 50%
```

### ✅ discord-translation-bot.js
```bash
# Khởi chạy bot (chạy trong background)
node discord-translation-bot.js

# Trên Discord dùng commands:
/project_create appid:"1274570" game:"Devour" translator:"YourName"
/project_list
/project_status projectid:"xxx"
/translation_progress projectid:"xxx"
```

### ✅ find-game-strings.js
```bash
# Tìm tất cả file dịch trong folder game
node find-game-strings.js "C:\Program Files\Steam\steamapps\common\Devour"

# Output:
# ✅ Found: config.json (2500 strings)
# ✅ Found: dialogue.csv (800 strings)
# ✅ Found: messages.po (1200 strings)
```

### ✅ convert-game-files.js
```bash
# Chuyển JSON thành CSV
node convert-game-files.js strings.json strings.csv

# Chuyển CSV thành PO
node convert-game-files.js strings.csv strings.po

# Chuyển PO thành JSON
node convert-game-files.js messages.po messages.json
```

### ✅ count-translation-strings.js
```bash
# Kiểm tra tiến độ & chất lượng
node count-translation-strings.js projectid

# Output:
# 📊 TRANSLATION REPORT
# Progress: [████████░░░░░░░░░░] 40%
# Translated: 2000/5000
# Issues: 12 (missing punctuation, encoding problems)

# Xuất report
node count-translation-strings.js projectid json
```

---

## 🎯 Ví Dụ Thực Tế: Dịch Game Devour

### **Bước 1: Tìm File**
```bash
node find-game-strings.js "C:\Program Files (x86)\Steam\steamapps\common\Devour"

# ✅ Output:
# 📄 JSON Files (2)
#    • config.json - 2500 strings
#    • ui_strings.json - 800 strings
# 
# 📊 CSV Files (1)
#    • dialogue.csv
#
# 📈 SUMMARY
#    Total Files: 3
#    Total Strings: 3,300
```

### **Bước 2: Tạo Dự Án**
```bash
node translation-manager.js create 1274570 "Devour" "HỏaLôi"

# ✅ Output:
# ✅ Project created
# ProjectID: 1274570_1733510400

# ✨ Lưu ProjectID này - cần dùng cho các lệnh sau!
```

### **Bước 3: Thêm File**
```bash
# Copy file từ game ra
copy "C:\Program Files (x86)\Steam\steamapps\common\Devour\config.json" .

# Thêm vào dự án
node translation-manager.js add 1274570_1733510400 ./config.json localization

# Output:
# ✅ File added: config.json
# 📊 2500 strings extracted
# 📁 Project structure created
```

### **Bước 4: Dịch**
```bash
# Mở file config.json bằng VS Code
code config.json

# Tìm tất cả "value" là tiếng Anh, thay thành tiếng Việt
# Ví dụ:
# "greeting": "Hello" → "Xin chào"
# "menu_play": "Play" → "Chơi Game"

# Lưu file (Ctrl+S)
```

### **Bước 5: Kiểm Tra Chất Lượng**
```bash
node count-translation-strings.js 1274570_1733510400

# ✅ Output:
# 📊 TRANSLATION REPORT: Devour
# Progress: [████████░░░░░░░░░░] 40%
# Translated: 1000/2500
# ⚠️ Issues: 5
#    - Missing question mark in "menu_help"
#    - Possible untranslated: "menu_settings"
```

### **Bước 6: Xuất & Test**
```bash
node translation-manager.js export 1274570_1733510400 fileid ./config_vi.json

# 📁 Đặt config_vi.json vào folder game:
# C:\Program Files (x86)\Steam\steamapps\common\Devour\config_vi.json

# 🎮 Khởi chạy game & kiểm tra
# - Tất cả menu có chữ Việt?
# - Có chữ hỏi, chữ câu đầy đủ không?
# - Có ký tự lạ không?
```

### **Bước 7: Thông Báo Discord**
```bash
# Trên Discord chạy:
/project_status projectid:"1274570_1733510400"

# Bot sẽ hiển thị:
# 📊 Devour (1274570)
# Progress: [████████░░░░░░░░░░] 40%
# Translated: 1000/2500
# Status: active
```

---

## 🔧 Setup Tools Bổ Sung

### NPM Packages (Nếu cần)
```bash
# Cài các tool hỗ trợ
npm install discord.js mongodb dotenv

# Cài PO file support
npm install pofile

# Cài YAML support (nếu game dùng YAML)
npm install yaml
```

### Poedit (Cho .po files)
```
1. Download: https://poedit.net/
2. Cài đặt
3. Mở file .po → dịch từng dòng
4. Lưu → Sử dụng trong game
```

### VS Code Extensions (Recommended)
```
Cài extensions trong VS Code:
- i18n Ally (tìm strings dễ hơn)
- JSON Tools (edit JSON dễ dàng)
- Even Better TOML (nếu game dùng TOML)
- Rainbow CSV (edit CSV đẹp hơn)
```

---

## 📋 Danh Sách Công Việc Tiếp Theo

- ✅ Discord bot - XONG
- ✅ File finder - XONG
- ✅ Format converter - XONG
- ✅ QA checker - XONG
- ✅ Hướng dẫn chi tiết - XONG
- ⏳ Bạn chọn:
  - [ ] Test dịch game Devour (1274570)
  - [ ] Dịch game khác
  - [ ] Setup web dashboard
  - [ ] Tạo tool Unreal Engine
  - [ ] Cái gì khác?

---

## 💡 Mẹo Dịch Tốt

```
❌ NÊN TRÁNH:
- Dịch máy từng chữ (hard to read)
- Thêm bớt ký tự dấu câu
- Không dịch nhất quán (menu_play hôm nay "Chơi", ngày mai "Chơi Game")

✅ NÊN LÀM:
- Dịch tự nhiên (như người Việt nói)
- Giữ nguyên format gốc
- Sử dụng glossary (danh sách từ)
- Kiểm tra bật tắt dấu câu giống gốc
- Test trong game thật

💾 LƯU Ý:
- Backup file gốc trước khi dịch
- Dùng Git để track thay đổi
- Lưu từng phiên bản (v1, v2, v3)
```

---

## 🎯 Công Cụ Bạn Cần Dùng Thường Xuyên

**Hàng Ngày:**
1. `translation-manager.js` - quản lý dự án
2. `count-translation-strings.js` - kiểm tra tiến độ
3. Text Editor (VS Code) - dịch

**Khi Cần:**
4. `find-game-strings.js` - tìm file game mới
5. `convert-game-files.js` - chuyển đổi format
6. `discord-translation-bot.js` - báo cáo tiến độ

**Tham Khảo:**
7. `TRANSLATION_TOOLS_GUIDE.md` - hướng dẫn chi tiết
8. Gaming Glossary - từ ngữ game chuyên dụng

---

**Commit:** ab45bf2
**Date:** December 7, 2025
**Status:** ✅ Ready to use!

---

## ❓ Bạn Cần Gì Tiếp Theo?

Chọn một trong các tùy chọn:

- **A) Test dịch game thực tế** - Bắt đầu với Devour
- **B) Setup Discord bot** - Thêm thông báo tiến độ  
- **C) Tạo web dashboard** - Xem tiến độ online
- **D) Tool khác** - Bạn có ý tưởng gì?

