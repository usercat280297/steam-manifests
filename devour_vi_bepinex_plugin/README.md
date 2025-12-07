# 🎮 DEVOUR Vietnamese BepInEx Plugin

## Cách Cài Đặt (3 bước)

### Bước 1: Cài BepInEx vào DEVOUR

1. **Download BepInEx 5.x** (x64):
   ```
   https://github.com/BepInEx/BepInEx/releases/download/v5.4.21/BepInEx_x64_5.4.21.0.zip
   ```

2. **Extract vào game folder:**
   ```
   Zip chứa: BepInEx/, doorstop_config.ini, winhttp.dll
   Extract vào: D:\SteamLibrary\steamapps\common\Devour\
   
   Kết quả sẽ là:
   D:\SteamLibrary\steamapps\common\Devour\
     ├── BepInEx/
     ├── doorstop_config.ini
     ├── winhttp.dll
     ├── DEVOUR.exe
     └── ...
   ```

3. **Chạy game 1 lần để BepInEx tự setup:**
   ```powershell
   cd "D:\SteamLibrary\steamapps\common\Devour"
   .\DEVOUR.exe
   # Chơi 30 giây rồi thoát
   ```
   Game sẽ tự tạo folder `BepInEx/plugins/` và cấu hình cần thiết.

### Bước 2: Compile Plugin C#

Bạn cần .NET SDK để compile plugin. Nếu chưa có:

```powershell
# Download .NET 6+ từ:
# https://dotnet.microsoft.com/en-us/download

# Hoặc cài qua winget:
winget install Microsoft.DotNet.SDK.7
```

Sau đó compile:

```powershell
cd "e:\Đức Hải\steam-manifest-bot\devour_vi_bepinex_plugin"
dotnet build -c Release
# Output: bin/Release/net472/DevourVietnamesePatch.dll
```

### Bước 3: Copy Plugin vào BepInEx

```powershell
Copy-Item `
  "e:\Đức Hải\steam-manifest-bot\devour_vi_bepinex_plugin\bin\Release\net472\DevourVietnamesePatch.dll" `
  -Destination "D:\SteamLibrary\steamapps\common\Devour\BepInEx\plugins\"
```

**Done!** Folder plugins sẽ có:
```
D:\SteamLibrary\steamapps\common\Devour\BepInEx\plugins\
  └── DevourVietnamesePatch.dll
```

---

## Chạy Game

```powershell
cd "D:\SteamLibrary\steamapps\common\Devour"
.\DEVOUR.exe
```

**Hoặc:** Launch từ Steam như bình thường (BepInEx inject tự động).

---

## Kiểm Tra Hoạt Động

1. Mở game
2. Vào menu Items/Outfits
3. Tìm kiếm những tên này:
   - ❌ English: "Moonless Night", "Claws Out"
   - ✅ Vietnamese: "Đêm Không Trăng", "Móng Vuốt Ra"

Nếu thấy Tiếng Việt = **Plugin works!** 🎉

---

## Troubleshooting

### Plugin không load
- **Kiểm tra:** `D:\SteamLibrary\steamapps\common\Devour\BepInEx\LogOutput.log`
- Xem có error gì khi game startup

### BepInEx không inject
- Đảm bảo `winhttp.dll` nằm ở game root folder
- Chạy game từ Steam (không chạy exe trực tiếp)

### Vẫn thấy English text
- Plugin có thể không compatible với build game này
- Kiểm tra log file

---

## Alternative: Pre-compiled DLL

Nếu không muốn compile, bạn có thể:
1. Yêu cầu pre-built DLL từ author
2. Hoặc tôi sẽ compile sẵn và upload lên GitHub

---

## Gỡ cài đặt

Xóa file DLL:
```powershell
Remove-Item "D:\SteamLibrary\steamapps\common\Devour\BepInEx\plugins\DevourVietnamesePatch.dll"
```

Game sẽ quay lại English.

---

**Plugin này hoạt động by:**
- Intercepting text display calls (Text.text, TextMeshProUGUI.text)
- Replacing chuỗi English → Vietnamese tại runtime
- Không modify game files
- An toàn, dễ remove

Enjoy DEVOUR in Vietnamese! 🇻🇳
