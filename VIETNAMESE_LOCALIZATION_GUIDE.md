# 🇻🇳 Hướng Dẫn Việt Hóa Game (Vietnamese Game Localization Guide)

## Mục Đích

Hướng dẫn này giúp bạn:
1. **Tạo file mapping** để dịch tên game sang Tiếng Việt
2. **Cập nhật Discord embeds** để hiển thị tên game Việt
3. **Lưu trữ bản dịch** trong MongoDB
4. **Tự động áp dụng** việt hóa cho tất cả games

---

## 📋 Step 1: Tạo File Mapping Tên Game (`vi_games_mapping.json`)

Tạo file `vi_games_mapping.json` trong thư mục bot:

```json
{
  "2358720": {
    "vi_name": "Anh Hùng Tử Chiến (Black Myth: Wukong)",
    "vi_description": "Game hành động đỉnh cao lấy cảm hứng từ Tây Du Ký",
    "region": "VN",
    "verified": true,
    "translator": "BạnName",
    "updated": "2025-12-07"
  },
  "570": {
    "vi_name": "Dota 2 - Trò Chơi Tranh Đấu",
    "vi_description": "Trò chơi MOBA huyền thoại, miễn phí chơi",
    "region": "VN",
    "verified": true,
    "translator": "CommunityName",
    "updated": "2025-12-07"
  },
  "1174880": {
    "vi_name": "Chế Độ Sinh Tồn Elden",
    "vi_description": "Game nhập vai hành động phiêu lưu kỳ diệu",
    "region": "VN",
    "verified": true,
    "translator": "PlayerName",
    "updated": "2025-12-07"
  }
}
```

**Các trường bắt buộc:**
- `vi_name` - Tên game dịch sang Tiếng Việt
- `vi_description` - Mô tả ngắn game (tùy chọn)
- `region` - Vùng (VN = Việt Nam)
- `verified` - Đã xác nhận dịch chính xác (true/false)
- `translator` - Tên người dịch (để ghi công)
- `updated` - Ngày cập nhật lần cuối

---

## 📝 Step 2: Thêm Function Việt Hóa vào Code

Thêm hàm này vào `manifest-bot.js` (sau hàm `getGameInfo`):

```javascript
/**
 * Load Vietnamese localization mapping
 * @returns {Object} - Mapping of appId -> { vi_name, vi_description, ... }
 */
function loadVietnameseLocalization() {
  try {
    const mappingFile = path.join(__dirname, 'vi_games_mapping.json');
    if (fs.existsSync(mappingFile)) {
      const content = fs.readFileSync(mappingFile, 'utf8');
      const mapping = JSON.parse(content);
      console.log(`📚 Loaded Vietnamese localization for ${Object.keys(mapping).length} games`);
      return mapping;
    }
    logDetailed('Vietnamese mapping file not found - using English names');
    return {};
  } catch (error) {
    console.warn(`⚠️ Vietnamese localization load failed: ${error.message}`);
    return {};
  }
}

/**
 * Get Vietnamese game name if available
 * @param {number} appId - Steam App ID
 * @param {string} englishName - Original English name
 * @param {Object} viMapping - Vietnamese localization mapping
 * @returns {Object} - { displayName, vi_name, isLocalized }
 */
function getLocalizedGameName(appId, englishName, viMapping = {}) {
  const mapping = viMapping[appId];
  
  if (mapping && mapping.vi_name && mapping.verified) {
    return {
      displayName: `${mapping.vi_name} (${englishName})`,
      vi_name: mapping.vi_name,
      english_name: englishName,
      isLocalized: true,
      verified: mapping.verified,
      translator: mapping.translator
    };
  }
  
  return {
    displayName: englishName,
    vi_name: null,
    english_name: englishName,
    isLocalized: false,
    verified: false
  };
}

/**
 * Save Vietnamese localization to MongoDB
 * @param {number} appId - Steam App ID
 * @param {Object} localization - Localization data
 */
async function saveLocalizationToMongo(appId, localization) {
  if (!mongoDb) return false;
  
  try {
    const result = await mongoDb.collection('games').updateOne(
      { appId: Number(appId) },
      {
        $set: {
          localization: localization,
          localization_updated: new Date()
        }
      }
    );
    
    logDetailed(`Saved localization for AppID ${appId}: ${localization.vi_name}`);
    return result.modifiedCount > 0;
  } catch (error) {
    logDetailed(`Failed to save localization: ${error.message}`);
    return false;
  }
}
```

---

## 🎮 Step 3: Cập Nhật Discord Embed với Tên Tiếng Việt

Sửa function `createDiscordEmbed` để sử dụng tên Việt:

```javascript
async function createDiscordEmbed(gameName, appId, depots, uploadResult, gameInfo, localization = null) {
  // ... existing code ...
  
  // 🇻🇳 Get Vietnamese name if available
  const displayName = localization?.isLocalized 
    ? `${localization.vi_name} (${gameName})`
    : gameName;
  
  const embed = {
    embeds: [{
      // ... other properties ...
      title: `✅ Manifest: ${displayName}`,
      description: `${localization?.isLocalized ? '🇻🇳 ' : ''}${displayName}\n${gameInfo?.description || ''}`,
      
      fields: [
        // ... existing fields ...
        ...(localization?.isLocalized ? [{
          name: "🇻🇳 Tên Tiếng Việt",
          value: `${localization.vi_name}\nDịch giả: ${localization.translator || 'Cộng đồng'}`,
          inline: false
        }] : []),
        // ... rest of fields ...
      ]
    }]
  };
  
  return embed;
}
```

---

## 📚 Step 4: Sửa `checkGameManifest` để Dùng Việt Hóa

Thêm code này trong hàm `checkGameManifest`, trước khi gọi `createDiscordEmbed`:

```javascript
async function checkGameManifest(game, index, total) {
  // ... existing code ...
  
  // 🇻🇳 Load Vietnamese localization at startup (chỉ một lần)
  if (!global.viMapping) {
    global.viMapping = loadVietnameseLocalization();
  }
  
  // Get localized name
  const localization = viMapping[appId] || null;
  
  // ... existing code until Discord notification ...
  
  messageQueue.push({
    gameName: name,
    appId: appId,
    depots: depots,
    uploadResult: uploadResult,
    gameInfo: gameInfo,
    localization: localization, // ✨ NEW: Pass localization
    failed: false
  });
  
  // Save localization to MongoDB
  if (localization) {
    await saveLocalizationToMongo(appId, localization);
  }
}
```

---

## 🔧 Step 5: Cập Nhật `sendDiscordMessage`

Sửa function `sendDiscordMessage` để pass localization:

```javascript
async function sendDiscordMessage(message) {
  if (message.failed) {
    const embed = await createFailedEmbed(message.gameName, message.appId, message.gameInfo);
    // ... send ...
  } else {
    // ✨ Pass localization to createDiscordEmbed
    const embed = await createDiscordEmbed(
      message.gameName,
      message.appId,
      message.depots,
      message.uploadResult,
      message.gameInfo,
      message.localization // <-- NEW
    );
    // ... send ...
  }
}
```

---

## 🇻🇳 Step 6: Thêm Game Vào Mapping

### Ví Dụ 1: Black Myth: Wukong (AppID: 2358720)

1. Mở file `vi_games_mapping.json`
2. Thêm entry mới:

```json
{
  "2358720": {
    "vi_name": "Anh Hùng Tử Chiến",
    "vi_description": "Game hành động dựa trên Tây Du Ký",
    "region": "VN",
    "verified": true,
    "translator": "YourName",
    "updated": "2025-12-07"
  }
}
```

3. Chạy bot:
```bash
node add-appid.js 2358720 --force
```

4. Kiểm tra Discord - Embed sẽ hiển thị:
   - ✅ Manifest: Anh Hùng Tử Chiến (Black Myth: Wukong)
   - 🇻🇳 Tên Tiếng Việt: Anh Hùng Tử Chiến
   - Dịch giả: YourName

---

## 🎮 Step 7: Ví Dụ Thực Tế - Việt Hóa Elden Ring

### AppID: 1174880 (Elden Ring)

1. **Tìm tên Tiếng Việt:** "Elden Ring" hoặc "Nước Lộng Nhân"
2. **Viết mô tả ngắn:** "Game nhập vai hành động phiêu lưu vĩ đại từ FromSoftware"
3. **Thêm vào mapping:**

```json
{
  "1174880": {
    "vi_name": "Elden Ring - Nước Lộng Nhân",
    "vi_description": "Game nhập vai hành động từ FromSoftware & George R.R. Martin",
    "region": "VN",
    "verified": true,
    "translator": "Community Translator",
    "updated": "2025-12-07"
  }
}
```

4. **Test:**
```bash
node add-appid.js 1174880 --force
```

5. **Kiểm tra kết quả Discord:**

```
✅ Manifest: Elden Ring - Nước Lộng Nhân (Elden Ring)

🇻🇳 Tên Tiếng Việt
Elden Ring - Nước Lộng Nhân
Dịch giả: Community Translator

💰 Price: $59.99
⭐ Reviews: Very Positive (50,000+ reviews)
```

---

## 📊 Step 8: Lưu Vào MongoDB

Mỗi lần game được xử lý, dữ liệu việt hóa sẽ được lưu tự động:

```javascript
// MongoDB document sẽ chứa:
{
  "_id": ObjectId(...),
  "appId": 2358720,
  "name": "Black Myth: Wukong",
  "localization": {
    "displayName": "Anh Hùng Tử Chiến (Black Myth: Wukong)",
    "vi_name": "Anh Hùng Tử Chiến",
    "english_name": "Black Myth: Wukong",
    "isLocalized": true,
    "verified": true,
    "translator": "YourName"
  },
  "localization_updated": ISODate("2025-12-07T..."),
  "lastManifestUpdate": ISODate("2025-12-07T..."),
  // ... other fields ...
}
```

---

## 🚀 Step 9: Deploy lên Railway

1. **Commit changes:**
```bash
git add vi_games_mapping.json manifest-bot.js
git commit -m "Add Vietnamese game localization support"
git push origin main
```

2. **Railway sẽ tự động rebuild**
3. **Kiểm tra logs:**
   - `📚 Loaded Vietnamese localization for X games`
   - `🇻🇳 Tên Tiếng Việt: [Game Name]` trong Discord notifications

---

## 💡 Mẹo & Thủ Thuật

### 1. Tìm tên game Tiếng Việt chính xác
- Kiểm tra **Steam VN** (nếu có bản Việt chính thức)
- Tìm trên **YouTube Tiếng Việt** hoặc **Twitch VN**
- Dùng **Google Translate** (nhưng kiểm tra bản tiếng Việt hiện có)

### 2. Xác nhận dịch (verified)
- Đặt `"verified": true` nếu bạn chắc chắn bản dịch chính xác
- Đặt `"verified": false` nếu chỉ là ước tính

### 3. Cập nhật hàng loạt
Nếu muốn thêm nhiều game một lúc:

```json
{
  "2358720": { "vi_name": "...", ... },
  "570": { "vi_name": "...", ... },
  "1174880": { "vi_name": "...", ... },
  "1098210": { "vi_name": "...", ... }
}
```

Rồi chạy:
```bash
for appid in 2358720 570 1174880 1098210; do
  node add-appid.js $appid --force
done
```

### 4. Xem lịch sử dịch
MongoDB sẽ lưu tất cả lần cập nhật - bạn có thể kiểm tra:

```javascript
db.games.findOne({ appId: 2358720 }).localization
```

---

## ✅ Checklist Việt Hóa Game

- [ ] Tìm tên Tiếng Việt chính xác
- [ ] Viết mô tả ngắn (tùy chọn)
- [ ] Thêm vào `vi_games_mapping.json`
- [ ] Đặt `verified: true/false`
- [ ] Ghi tên dịch giả
- [ ] Chạy test: `node add-appid.js <APPID> --force`
- [ ] Kiểm tra Discord notification
- [ ] Xác nhận MongoDB đã lưu
- [ ] Push lên GitHub
- [ ] Kiểm tra trên Railway deployment

---

## 🆘 Troubleshooting

### Lỗi: "Vietnamese mapping file not found"
→ Tạo file `vi_games_mapping.json` trong thư mục bot

### Lỗi: "JSON parse error"
→ Kiểm tra định dạng JSON (trailing comma, quote mismatch)

### Tên Tiếng Việt không hiển thị trong Discord
→ Đảm bảo `verified: true` và file đã được load
→ Check bot logs: `📚 Loaded Vietnamese localization for X games`

### Game đã được việt hóa nhưng muốn đổi tên
→ Sửa entry trong `vi_games_mapping.json`
→ Chạy lại: `node add-appid.js <APPID> --force`
→ MongoDB sẽ cập nhật tự động

---

## 📞 Liên Hệ & Đóng Góp

Muốn thêm bản dịch?
1. Fork repo
2. Thêm entries vào `vi_games_mapping.json`
3. Gửi Pull Request
4. Chúng tôi sẽ verify & merge

---

## 🎉 Hoàn Thành!

Bây giờ bot của bạn đã hỗ trợ:
✅ Hiển thị tên game Tiếng Việt
✅ Lưu dữ liệu việt hóa trong MongoDB
✅ Gửi Discord notifications với tên Việt
✅ Tự động áp dụng cho tất cả games

**Chúc bạn tận hưởng các game Việt hóa! 🎮🇻🇳**
