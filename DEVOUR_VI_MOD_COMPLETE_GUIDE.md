# 🎮 DEVOUR Vietnamese Mod - Complete Setup Guide

## Mục Lục
1. [Tl;dr - Nhanh Chóng](#tldr)
2. [Cách Hoạt Động](#cách-hoạt-động)
3. [Từng Bước Chi Tiết](#từng-bước-chi-tiết)
4. [Troubleshooting](#troubleshooting)
5. [FAQ](#faq)

---

## TLDR

**Cách nhanh nhất để chạy game với Tiếng Việt:**

```powershell
cd e:\Đức Hải\steam-manifest-bot
node devour-launch-vi.js
```

**Hoặc** double-click: `devour-vi.bat`

**Kết quả:** Game chạy với tất cả items/outfits/perks thành Tiếng Việt! 🇻🇳

---

## Cách Hoạt Động

### Phương Pháp 1: Direct Launch (RECOMMENDED ✅)

```
Step 1: Enable mod
  → Replace inventory.json với Vietnamese version
  
Step 2: Launch DEVOUR.exe directly (bypassing Steam)
  → Game loads Vietnamese inventory
  
Step 3: Play with Vietnamese mod! 🎮
  
Step 4: Auto-restore English
  → When you close game, English inventory restored
```

**Ưu điểm:**
- ✅ Không cần Steam chạy
- ✅ Tự động restore English sau khi thoát
- ✅ Không ảnh hưởng đến Steam library
- ✅ Dễ bật/tắt mod

**Nhược điểm:**
- ❌ Mở trực tiếp exe, không qua Steam overlay
- ❌ Achievements có thể không sync (tuỳ thuộc Steam)

---

### Phương Pháp 2: Steam Launch (Nếu muốn qua Steam)

```
Step 1: Enable Vietnamese mod
  cd devour_mod_vi
  node launcher.js enable
  
Step 2: Launch game từ Steam như bình thường
  
Step 3: Thoát game
  
Step 4: Restore English
  cd devour_mod_vi
  node launcher.js disable
```

**⚠️ Cảnh báo:**
- Steam có thể detect file change và verify lại game files
- Sẽ restore English inventory
- Cần enable mod lại mỗi lần chơi
- **Không khuyến khích cách này**

---

## Từng Bước Chi Tiết

### Option A: Dùng devour-launch-vi.js (Tốt nhất ⭐)

**Bước 1:** Mở PowerShell tại folder project

```powershell
cd "e:\Đức Hải\steam-manifest-bot"
```

**Bước 2:** Chạy launcher

```powershell
node devour-launch-vi.js
```

**Output:**
```
==================================================
🎮 DEVOUR Vietnamese Mod Launcher
==================================================

🔍 Validating game paths...
✅ Game folder
✅ DEVOUR.exe
✅ inventory.json
✅ Vietnamese inventory

📋 Startup sequence:

💾 Created English backup: inventory.json.en.backup

🇻🇳 Enabling Vietnamese mod...
✅ Vietnamese inventory loaded

🎮 Launching DEVOUR...
✅ Game launched!

📝 Notes:
   - Game is running with Vietnamese mod
   - All items & outfits names are in Vietnamese
   - English inventory will be restored when game closes

⏳ Waiting for game to close...
```

**Bước 3:** Game sẽ tự động chạy 🚀

**Bước 4:** Chơi game với Tiếng Việt! 🇻🇳

**Bước 5:** Khi thoát game, English inventory sẽ tự động restore

```
🔄 Restoring English inventory...
✅ English inventory restored

👋 Goodbye! See you next time!
```

---

### Option B: Dùng devour-vi.bat (Đơn Giản Nhất)

**Bước 1:** Tìm file `devour-vi.bat` trong folder project

**Bước 2:** Double-click `devour-vi.bat`

**Bước 3:** Command line sẽ mở, game tự động chạy

**Bước 4:** Chơi với Tiếng Việt! 🎮

**Bước 5:** Đóng command line = automatic restore English

---

### Option C: Manual Enable (Nếu muốn kiểm soát)

**Enable Vietnamese:**
```powershell
cd "e:\Đức Hải\steam-manifest-bot\devour_mod_vi"
node launcher.js enable
```

**Chạy game từ Steam hoặc chạy DEVOUR.exe trực tiếp**

**Restore English (bắt buộc sau khi thoát game):**
```powershell
cd "e:\Đức Hải\steam-manifest-bot\devour_mod_vi"
node launcher.js disable
```

---

## Cách Kiểm Tra Mod Hoạt Động

1. **Mở game**
2. **Vào menu Items/Outfits**
3. **Kiểm tra tên items:**
   - ❌ English: "Moonless Night", "Claws Out"
   - ✅ Vietnamese: "Đêm Không Trăng", "Móng Vuốt Ra"

4. **Nếu thấy Tiếng Việt = Mod works! 🎉**

---

## Troubleshooting

### ❌ Lỗi: "Vietnamese inventory file not found"

**Nguyên nhân:** File `inventory_vi.json` không tồn tại

**Giải pháp:**
```powershell
# Tạo lại mod
cd "e:\Đức Hải\steam-manifest-bot"
node devour-vi-game-mod.js
```

---

### ❌ Lỗi: "Game failed to launch"

**Nguyên nhân:** Không tìm thấy DEVOUR.exe

**Giải pháp:**
1. Kiểm tra DEVOUR đã cài đặt tại `D:\SteamLibrary\steamapps\common\Devour`
2. Nếu cài ở đâu khác, edit `devour-launch-vi.js`:
   ```javascript
   const GAME_PATH = 'C:\\YOUR_STEAM_PATH\\steamapps\\common\\Devour';
   ```

---

### ❌ Lỗi: "Permission denied"

**Nguyên nhân:** Không có quyền write vào game folder

**Giải pháp:**
1. Run PowerShell as Administrator
2. Hoặc: Move `devour_mod_vi` folder đến Desktop
3. Copy inventory_vi.json manually

---

### ❌ Game vẫn English sau enable Vietnamese

**Nguyên nhân:** Có thể Steam đã verify file lại

**Giải pháp:**
1. Kiểm tra file `inventory.json` có được update không:
   ```powershell
   Get-Item "D:\SteamLibrary\steamapps\common\Devour\inventory.json" | Select-Object LastWriteTime
   ```

2. Nếu không update, thử manual:
   ```powershell
   Copy-Item "e:\Đức Hải\steam-manifest-bot\devour_mod_vi\content\vi\inventory_vi.json" `
     -Destination "D:\SteamLibrary\steamapps\common\Devour\inventory.json" -Force
   ```

---

### ⚠️ Steam Overlay Không Hoạt Động

**Vấn đề:** Khi launch trực tiếp exe, Steam overlay có thể không hiện

**Giải pháp:**
- Dùng Option C (manual enable) rồi launch từ Steam
- Hoặc: Accept không có overlay (game vẫn chạy bình thường)

---

### 🎮 Achievements Không Sync

**Vấn đề:** Achievements có thể không sync khi launch trực tiếp exe

**Giải pháp 1 (Recommended):**
```powershell
# Enable mod
cd devour_mod_vi
node launcher.js enable

# Launch từ Steam (sẽ có overlay + achievements)

# Sau khi thoát, restore
node launcher.js disable
```

**Giải pháp 2:**
- Accept không sync achievements khi dùng mod
- (Achievements vẫn unlock trong game, chỉ không lưu trên Steam)

---

## FAQ

### Q: Có thể bị ban từ Steam không?

**A:** Không. Mod này chỉ thay đổi local inventory.json (tên items). 
- Không thay đổi game logic
- Không thay đổi multiplayer (khác character names)
- Không hack/cheat
- Steam xem đây là local content modification, không vi phạm ToS

---

### Q: Mod hoạt động với multiplayer không?

**A:** Có, nhưng:
- ✅ Bạn thấy items Tiếng Việt trên máy mình
- ✅ Bạn có thể chơi cùng người khác
- ❌ Người khác sẽ thấy items English (trừ khi họ cũng cài mod)

---

### Q: Mình có thể share mod này cho người khác không?

**A:** Được, nhưng:
- ⚠️ Đây là fan translation không chính thức
- ⚠️ Người nhận phải sở hữu DEVOUR game trên Steam
- ⚠️ Không distribute game files, chỉ mod folder
- ✅ Có thể upload GitHub/Nexus với disclaimer

---

### Q: Làm sao thêm translations khác?

**A:** Edit file `devour_mod_vi/content/vi/inventory_vi.json`:
```json
{
  "123": {
    "name": "Tên Tiếng Việt",
    "description": "Mô tả Tiếng Việt",
    ...
  }
}
```

Sau đó re-run launcher để apply changes.

---

### Q: Có cách nào dịch UI game (menu, settings) không?

**A:** Không dễ, vì:
- Game UI nằm trong Unity assets files
- Cần decompile game (complex)
- Có thể vi phạm bản quyền

Hiện tại mod chỉ dịch **items/outfits/perks** (tên vật phẩm).

---

### Q: Làm sao tắt mod?

**A:** 
```powershell
# Automatic (recommended)
node devour-launch-vi.js
# Thoát game = auto restore English

# Manual
cd devour_mod_vi
node launcher.js disable
```

---

### Q: Mod update khi nào?

**A:** 
- Khi có items mới trong game
- Khi có Vietnamese translations chính thức từ nhà phát hành
- Khi có bug fixes

Follow GitHub repo để cập nhật: https://github.com/usercat280297/steam-manifests

---

## Hỗ Trợ

**Có vấn đề?**
1. Kiểm tra troubleshooting section trên
2. Report tại GitHub Issues
3. Cung cấp:
   - Error message
   - Game version
   - OS (Windows 10/11)
   - Path to game folder

---

## License

Mod này được tạo cho mục đích học tập và sử dụng cá nhân.
- DEVOUR là bản quyền của Jarel Threat
- Vietnamese translation là fan work
- CC0 (Public Domain) cho translator community

**Lưu ý:** Phải sở hữu DEVOUR trên Steam để sử dụng mod này.

---

**Enjoy DEVOUR in Vietnamese! 🎮🇻🇳**

Tạo lúc: 07/12/2025
Version: 1.0.0
