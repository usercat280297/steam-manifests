# 🎮 STEAM MANIFEST AUTO-GENERATOR (7 STEPS)

> **Lệnh tự động lấy manifest game Lua với depot + DLC đầy đủ**

---

## ⚡ QUICK START - Silent Hill f (AppID: 2947440)

### Cách 1: Dùng Batch Script (Dễ nhất)
```bash
auto-manifest.bat 2947440 "Silent Hill f"
```

### Cách 2: Dùng PowerShell
```powershell
powershell -ExecutionPolicy Bypass -File auto-manifest-full.ps1 -AppId 2947440 -GameName "Silent Hill f"
```

### Cách 3: Dùng Python
```bash
python3 auto-manifest.py 2947440 "Silent Hill f"
```

---

## 📥 MANIFEST ĐÃ GEN - DOWNLOAD LINKS

| Game | AppID | Status | Link |
|------|-------|--------|------|
| **Silent Hill f** | 2947440 | ✅ | [View Guide](SILENT_HILL_MANIFEST_7STEPS.md) |
| **The Sushi House** | 3687470 | ✅ | [View Guide](SUSHI_HOUSE_3687470.md) |
| **Realm of the Mad God** | 200210 | ✅ | [View Guide](SUSHI_HOUSE_ALL_MANIFESTS.md) |

---

## 🛠️ 7 BƯỚC HOẠT ĐỘNG

### **BƯỚC 1:** Tải SteamCMD
- Download: https://steamcdn-a.akamaihd.net/client/installer/steamcmd.zip
- Giải nén: `C:\steamcmd`
- Chạy lần đầu: `C:\steamcmd\steamcmd.exe +quit`

### **BƯỚC 2:** Chuẩn Bị Script
Chọn một trong 3 cách:
- **Batch:** `auto-manifest.bat`
- **PowerShell:** `auto-manifest-full.ps1`
- **Python:** `auto-manifest.py`

### **BƯỚC 3:** Chạy Với AppID Game
```bash
# Ví dụ: Silent Hill f
auto-manifest.bat 2947440 "Silent Hill f"

# Ví dụ: Counter-Strike 2
auto-manifest.bat 730 "Counter-Strike 2"

# Ví dụ: DOTA 2
auto-manifest.bat 570 "DOTA 2"
```

### **BƯỚC 4:** Script Tự Động Fetch Data
```
[STEP 1/7] Fetching SteamCMD data...
[STEP 2/7] Parsing depots...
[STEP 3/7] Found X depot(s)
[STEP 4/7] Calculating SHA256 hashes...
[STEP 5/7] Saving manifest file...
[STEP 6/7] File saved: manifests\2947440.lua
[STEP 7/7] Ready to use!
```

### **BƯỚC 5:** Copy File Vào GreenLuma
```
Từ:  manifests\2947440.lua
Đến: C:\GreenLuma\manifests\2947440.lua
```

### **BƯỚC 6:** Unlock Game Trong GreenLuma
1. Mở **GreenLuma SteamTool**
2. Chọn **"Game Unlock"**
3. Chọn folder: `C:\GreenLuma\manifests`
4. Click **"Inject"**

### **BƯỚC 7:** Restart Steam & Chơi
```
1. Đóng Steam hoàn toàn
2. Mở Steam lại
3. Game xuất hiện trong Library
4. Chơi!
```

---

## 📋 CHI TIẾT CÁC SCRIPT

### 🔹 Batch Script (`auto-manifest.bat`)
**Ưu điểm:**
- ✅ Dễ dùng nhất
- ✅ Không cần cài đặt thêm
- ✅ Click và chạy

**Cách dùng:**
```cmd
auto-manifest.bat 2947440 "Silent Hill f"
```

---

### 🔹 PowerShell Script (`auto-manifest-full.ps1`)
**Ưu điểm:**
- ✅ Output rõ ràng với màu sắc
- ✅ Dễ tùy chỉnh
- ✅ Kiểm soát tốt hơn

**Cách dùng:**
```powershell
powershell -ExecutionPolicy Bypass -File auto-manifest-full.ps1 -AppId 2947440 -GameName "Silent Hill f"
```

---

### 🔹 Python Script (`auto-manifest.py`)
**Ưu điểm:**
- ✅ Cross-platform
- ✅ Dễ extend
- ✅ Professional

**Cách dùng:**
```bash
python3 auto-manifest.py 2947440 "Silent Hill f"
```

**Yêu cầu:**
```bash
python3 --version  # Phải có Python 3.6+
```

---

## 🎯 EXAMPLES - Các Game Phổ Biến

```bash
# Counter-Strike 2 (AppID: 730)
auto-manifest.bat 730 "Counter-Strike 2"

# DOTA 2 (AppID: 570)
auto-manifest.bat 570 "DOTA 2"

# Half-Life 2 (AppID: 220)
auto-manifest.bat 220 "Half-Life 2"

# Elden Ring (AppID: 1592190)
auto-manifest.bat 1592190 "Elden Ring"

# Baldur's Gate 3 (AppID: 1238140)
auto-manifest.bat 1238140 "Baldur's Gate 3"

# Portal 2 (AppID: 620)
auto-manifest.bat 620 "Portal 2"

# Team Fortress 2 (AppID: 440)
auto-manifest.bat 440 "Team Fortress 2"
```

---

## 🔍 TECHNICAL DETAILS

### How It Works

1. **SteamCMD Fetch:** Lấy `app_info_print` từ Steam
2. **Parse Depots:** Tìm tất cả depot IDs và manifest IDs
3. **Calculate Hash:** Dùng `SHA256(depotId:manifestId)`
4. **Generate Lua:** Tạo file manifest Lua cho GreenLuma
5. **Save File:** Lưu vào `manifests/<AppId>.lua`

### Hash Calculation

```
Input:  "2947441:2588355430949594890"
SHA256: 7c74a01f968aad2578848052bd545d93a2f8b9d97d498882b5230040447173e4
Output: addappid(2947441, 0, "7c74a01f968aad2578848052bd545d93a2f8b9d97d498882b5230040447173e4")
```

### Lua Manifest Format

```lua
-- Game Name (AppID: XXXXX)

addappid(XXXXX)  -- Main App ID

-- BASE Depot: XXXXX (ManifestID: XXXXX)
addappid(XXXXX, 0, "hash_here")

-- DLC Depot: XXXXX (ManifestID: XXXXX)
addappid(XXXXX, 0, "hash_here")
```

---

## ❌ TROUBLESHOOTING

### SteamCMD Not Found
```
Error: SteamCMD not found at C:\steamcmd\steamcmd.exe

Fix:
1. Download: https://steamcdn-a.akamaihd.net/client/installer/steamcmd.zip
2. Extract to: C:\steamcmd\
3. Run: C:\steamcmd\steamcmd.exe +quit
```

### ExecutionPolicy Error (PowerShell)
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### Game Not Appearing in Steam
- ✓ Tên file đúng: `AppID.lua`
- ✓ Path đúng: `GreenLuma\manifests\AppID.lua`
- ✓ Manifest ID chính xác từ SteamCMD
- ✓ Hash được tính toán đúng
- ✓ Restart Steam hoàn toàn

### No Depots Found
- AppID có thể không hợp lệ
- Game có thể bị restricted
- SteamCMD output bị lỗi

---

## 📚 RESOURCES

- **GitHub Repo:** https://github.com/usercat280297/steam-manifests
- **SteamDB:** https://steamdb.info
- **GreenLuma:** https://github.com/greenlumaapi/greenluma
- **Steam Store:** https://steampowered.com

---

## 📝 FILES

```
steam-manifest-bot/
├── auto-manifest.bat          # Batch script version
├── auto-manifest.py           # Python script version
├── auto-manifest-full.ps1     # PowerShell full version
├── manifests/
│   ├── 2947440.lua            # Silent Hill f
│   ├── 3687470.lua            # The Sushi House
│   ├── 200210.lua             # Realm of the Mad God
│   └── <AppID>.lua            # Other games
├── SILENT_HILL_MANIFEST_7STEPS.md     # Complete guide
├── GENERATE_MANIFEST_7STEPS.md        # General guide
└── README.md                   # This file
```

---

## 🎓 ADVANCED USAGE

### Batch Generate Multiple Games
```bash
@echo off
for %%A in (730,570,220,1238140,1592190) do (
    echo Generating for AppID %%A...
    auto-manifest.bat %%A "Game %%A"
)
```

### Custom Depot Handling
Edit script cho game với DLC phức tạp:
```powershell
# Thêm depot thủ công
$depots = @(
    @{ Id = 730; Manifest = "123456"; Type = "BASE" },
    @{ Id = 731; Manifest = "789012"; Type = "DLC" }
)
```

---

## ✅ VERIFIED GAMES

| Game | AppID | Depot Count | DLC Count | Status |
|------|-------|-------------|-----------|--------|
| Silent Hill f | 2947440 | 1 | 0 | ✅ |
| The Sushi House | 3687470 | 1 | 0 | ✅ |
| Realm of the Mad God Exalt | 200210 | 2 | 6 | ✅ |
| Counter-Strike 2 | 730 | 2+ | Yes | ✅ |
| DOTA 2 | 570 | 2+ | Yes | ✅ |

---

## 📞 SUPPORT

Issues? Check:
1. SteamCMD installation
2. AppID validity (check SteamDB)
3. GreenLuma folder permissions
4. Manifest file permissions

---

**Last Updated:** December 9, 2025  
**Version:** v5.0  
**Status:** ✅ Active & Maintained
