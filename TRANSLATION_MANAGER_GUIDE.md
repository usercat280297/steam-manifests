# 🇻🇳 Game Translation Manager - Complete Guide

## Tổng Quan

**Translation Manager** là một công cụ toàn diện để:
- ✅ Quản lý dự án dịch game
- ✅ Hỗ trợ nhiều định dạng (JSON, CSV, .po)
- ✅ Track tiến độ dịch trong MongoDB
- ✅ Export dịch trong định dạng gốc

---

## 🚀 Cài Đặt

```bash
# Tool đã được tạo tại:
e:\Đức Hải\steam-manifest-bot\translation-manager.js

# Không cần install thêm - dùng Node.js có sẵn
```

---

## 📚 Hướng Dẫn Chi Tiết

### **Bước 1: Tạo Dự Án Dịch Mới**

```bash
node translation-manager.js create <appId> <gameName> <yourName>
```

**Ví dụ: Dịch game Devour (AppID: 1274570)**

```bash
node translation-manager.js create 1274570 "Devour" "MyName"
```

**Output:**
```
✅ Created translation project: 1274570_1733590800000
📁 Location: e:\Đức Hải\steam-manifest-bot\translation_projects\1274570_1733590800000
```

**Cấu trúc thư mục tự động tạo:**
```
translation_projects/1274570_1733590800000/
├── source_files/        ← Lưu file gốc game
├── translations/        ← File dịch của bạn
├── backups/            ← Backup file gốc
├── exports/            ← File dịch xuất ra
├── logs/               ← Nhật ký dịch
└── project.json        ← Metadata dự án
```

**MongoDB sẽ lưu:**
```javascript
{
  projectId: "1274570_1733590800000",
  appId: 1274570,
  gameName: "Devour",
  status: "active",
  progress: {
    totalStrings: 0,
    translatedStrings: 0,
    reviewedStrings: 0,
    percentComplete: 0
  },
  contributors: ["MyName"],
  createdAt: ISODate("2025-12-07T...")
}
```

---

### **Bước 2: Thêm File Dịch Vào Dự Án**

Trước tiên, bạn cần có file chứa text game. File có thể ở định dạng:

#### **2a. Format JSON**

File: `game_strings.json`
```json
{
  "menus": {
    "mainMenu": "Start Game",
    "settings": "Settings",
    "exit": "Exit"
  },
  "dialogue": {
    "npc1": "Help me!",
    "npc2": "What do you want?"
  }
}
```

Thêm vào dự án:
```bash
node translation-manager.js add 1274570_1733590800000 ./game_strings.json localization
```

#### **2b. Format CSV**

File: `game_strings.csv`
```csv
id,original_text,context
menu_start,"Start Game","Main Menu"
menu_settings,"Settings","Main Menu"
dialogue_npc1,"Help me!","NPC Dialog"
dialogue_npc2,"What do you want?","NPC Dialog"
```

Thêm:
```bash
node translation-manager.js add 1274570_1733590800000 ./game_strings.csv localization
```

#### **2c. Format .po (GNU Gettext)**

File: `game_strings.po`
```po
# Vietnamese translation
msgid ""
msgstr ""
"Language: en\n"

msgid "Start Game"
msgstr ""

msgid "Settings"
msgstr ""

msgid "Help me!"
msgstr ""
```

Thêm:
```bash
node translation-manager.js add 1274570_1733590800000 ./game_strings.po localization
```

**Output:**
```
📄 Parsing file: game_strings.json (format: json)
✅ Added file: game_strings.json
   Strings found: 5
📊 Project progress: 0% (0/5)
```

---

### **Bước 3: Tạo File Dịch**

Sau khi thêm file, bạn cần tạo file dịch của mình.

**Cách tốt nhất: Sao chép file gốc và dịch**

```bash
# 1. Sao chép file từ source_files sang translations
cp ./game_strings.json ./translations/game_strings_vi.json

# 2. Mở file và dịch
```

**Dịch file JSON:**
```json
{
  "menus": {
    "mainMenu": "Bắt Đầu Game",
    "settings": "Cài Đặt",
    "exit": "Thoát"
  },
  "dialogue": {
    "npc1": "Giúp tôi với!",
    "npc2": "Bạn muốn gì?"
  }
}
```

**Dịch file CSV:**
```csv
id,original_text,translated_text,context
menu_start,"Start Game","Bắt Đầu Game","Main Menu"
menu_settings,"Settings","Cài Đặt","Main Menu"
dialogue_npc1,"Help me!","Giúp tôi với!","NPC Dialog"
dialogue_npc2,"What do you want?","Bạn muốn gì?","NPC Dialog"
```

**Dịch file .po:**
```po
msgid "Start Game"
msgstr "Bắt Đầu Game"

msgid "Settings"
msgstr "Cài Đặt"

msgid "Help me!"
msgstr "Giúp tôi với!"

msgid "What do you want?"
msgstr "Bạn muốn gì?"
```

---

### **Bước 4: Export Dịch Sang Định Dạng Gốc**

Khi dịch xong, export file để tích hợp vào game:

```bash
node translation-manager.js export <projectId> <fileId> <outputPath>
```

**Để lấy fileId, dùng:**
```bash
node translation-manager.js list 1274570_1733590800000
```

**Ví dụ export JSON:**
```bash
node translation-manager.js export 1274570_1733590800000 507f1f77bcf86cd799439011 ./devour_vi.json
```

**Output:**
```
✅ Exported: ./devour_vi.json
```

---

## 📊 Xem Tiến Độ Dịch

```bash
# Xem tất cả dự án
node translation-manager.js list

# Xem chi tiết dự án cụ thể
node translation-manager.js list 1274570_1733590800000
```

**Output:**
```
📋 Translation Projects:

📁 Devour (AppID: 1274570)
   ID: 1274570_1733590800000
   Progress: 100% (5/5)
   Status: active
   Created: 12/7/2025
```

---

## 🎯 Workflow Hoàn Chỉnh - Ví Dụ Thực Tế

### **Dịch Game Devour từ A-Z**

**Bước 1: Tạo dự án**
```bash
cd e:\Đức Hải\steam-manifest-bot
node translation-manager.js create 1274570 "Devour" "MyName"
# Output: projectId = "1274570_1733590800000"
```

**Bước 2: Chuẩn bị file gốc**

Giả sử bạn đã extract file từ game, có: `devour_en.json`
```json
{
  "ui": {
    "play": "Play",
    "menu": "Menu",
    "quit": "Quit"
  },
  "story": {
    "intro": "A horror story...",
    "ending": "The end."
  }
}
```

**Bước 3: Thêm file vào dự án**
```bash
node translation-manager.js add 1274570_1733590800000 ./devour_en.json localization
# Output: Strings found: 5
```

**Bước 4: Tạo file dịch**

Tạo file `devour_vi.json`:
```json
{
  "ui": {
    "play": "Chơi",
    "menu": "Menu",
    "quit": "Thoát"
  },
  "story": {
    "intro": "Một câu chuyện kinh dị...",
    "ending": "Hết."
  }
}
```

**Bước 5: Export dịch**
```bash
# Tìm fileId từ MongoDB hoặc lấy từ output add
node translation-manager.js export 1274570_1733590800000 <fileId> ./devour_vi_final.json
```

**Bước 6: Tích hợp vào game**

Sao chép `devour_vi_final.json` vào thư mục game:
```
Devour\Content\Localization\Vietnamese\devour_vi.json
```

---

## 📁 File Locations

```
translation_projects/
├── 1274570_1733590800000/  (Devour)
│   ├── source_files/       ← Lưu devour_en.json
│   ├── translations/       ← Lưu devour_vi.json
│   ├── backups/           ← Tự động backup
│   ├── exports/           ← Kết quả export
│   └── project.json       ← Metadata
│
└── 2358720_1733590900000/  (Black Myth: Wukong)
    ├── source_files/
    ├── translations/
    └── ...
```

---

## 🔧 Advanced: Multiple File Types

Bạn có thể dịch từng loại file riêng:

```bash
# Dịch localization file
node translation-manager.js add projectId ./game_strings.json localization

# Dịch dialogue/npc
node translation-manager.js add projectId ./dialogue.json dialogue

# Dịch menu
node translation-manager.js add projectId ./menus.csv menu

# Dịch subtitles
node translation-manager.js add projectId ./subtitles.po subtitles
```

---

## 📊 MongoDB Collections

Tool sử dụng 3 collections:

### **1. translation_projects**
```javascript
{
  projectId: String,
  appId: Number,
  gameName: String,
  status: "active|paused|completed",
  progress: {
    totalStrings: Number,
    translatedStrings: Number,
    reviewedStrings: Number,
    percentComplete: Number
  },
  contributors: [String],
  createdAt: Date,
  updatedAt: Date
}
```

### **2. translation_files**
```javascript
{
  projectId: String,
  fileName: String,
  fileType: "localization|dialogue|menu|subtitles",
  format: "json|csv|po",
  totalStrings: Number,
  translatedCount: Number,
  strings: [{
    id: String,
    original: String,
    translated: String,
    status: "pending|translated|reviewed"
  }]
}
```

### **3. translation_strings** (Future - for advanced tracking)
```javascript
{
  projectId: String,
  stringId: String,
  original: String,
  translated: String,
  status: String,
  translatedBy: String,
  translatedAt: Date
}
```

---

## 🎯 Tích Hợp Với Bot Chính

Trong `manifest-bot.js`, sẽ có feature:
- Thông báo Discord khi dịch hoàn thành
- Lưu trữ file dịch vào GitHub
- Tạo mod package tự động
- Theo dõi tiến độ dịch

---

## 💡 Tips & Tricks

**1. Dịch từng phần nhỏ**
- Chia file lớn thành nhiều file nhỏ
- Dịch từng phần theo chủ đề (UI, Story, NPC, etc.)

**2. Giữ format gốc**
- JSON: Giữ cấu trúc, chỉ thay đổi value
- CSV: Không thay đổi id, chỉ thay đổi cột dịch
- .po: Giữ msgid, chỉ sửa msgstr

**3. Backup thường xuyên**
- Tool tự động backup
- Nhưng hãy sao chép thủ công thêm

**4. Kiểm tra mã ký tự**
- Đảm bảo file UTF-8 encoding
- Một số game cần cách encoding khác

---

## ❓ Troubleshooting

**Q: Lỗi "File not found"**
A: Đảm bảo file tồn tại và đường dẫn chính xác

**Q: Lỗi parsing JSON**
A: Kiểm tra JSON syntax (trailing comma, quote mismatch)

**Q: Export không hiển thị dịch**
A: Đảm bảo bạn đã cập nhật dịch vào MongoDB

**Q: Game không nhận dịch mới**
A: Kiểm tra format file phù hợp với game, có thể cần encoding khác

---

## 🚀 Tiếp Theo

Sau khi có dịch, bạn có thể:
1. ✅ Upload lên GitHub làm mod
2. ✅ Tạo Crowdin project để cộng đồng dịch
3. ✅ Tích hợp vào bot để tự động phát triển

---

**Hoàn tất! Bây giờ bạn đã sẵn sàng dịch bất kỳ game nào! 🎉**
