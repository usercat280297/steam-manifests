# 🎮 Hướng Dẫn Thêm Game Mới

## Cách 1: Dòng Lệnh VS Code (Đơn Giản Nhất)

Mở Terminal trong VS Code và chạy:

```bash
node add-appid.js <STEAM_APP_ID> --force
```

**Ví dụ:** Thêm game Black Myth: Wukong (AppID: 2358720)
```bash
node add-appid.js 2358720 --force
```

## Quy Trình Tự Động

Khi bạn chạy lệnh trên, hệ thống sẽ tự động:

### ✅ 1. Tải thông tin từ Steam
- Tên game
- Giá game
- Ảnh cover
- Mô tả, thể loại, nền tảng

### ✅ 2. Kiểm Tra Game (Free vs Paid)
- **❌ REJECT**: Game Free-to-Play → Bỏ qua
- **✅ ACCEPT**: Game có phí → Tiếp tục

Nếu muốn thêm game free, dùng:
```bash
node add-appid.js <APPID> --force --force-free
```

### ✅ 3. Lưu Vào MongoDB
- Tạo/cập nhật document trong collection `games`
- Giữ nguyên dữ liệu cũ nếu đã tồn tại

### ✅ 4. Gửi Thông Báo Đến Bot
- POST `/process` endpoint trên Railway
- Hoặc localhost:3000 nếu chạy local

### ✅ 5. Bot Tự Động Xử Lý
Manifest-bot nhận request và tự động:
- 🔍 Tìm depot/manifest từ Steam
- 📝 Tạo file .lua
- 📤 Tải lên GitHub Releases
- 💬 Gửi thông báo Discord

---

## Các Tùy Chọn Nâng Cao

### Chỉ Hỏi (Interactive Mode)
```bash
node add-appid.js
# Nhập AppID khi được yêu cầu
```

### Thêm Game Free (Cần Confirm)
```bash
node add-appid.js 12345 --force-free
```

### Cập Nhật Nếu Đã Tồn Tại
```bash
node add-appid.js 2358720 --force
# Hoặc chọn 'update' khi được hỏi nếu không dùng --force
```

---

## 🔍 Dự Án Sẽ Làm Gì

### Khi Add Game Có Denuvo
```
Title: ✅ Manifest Generated: Doom Eternal
⚠️ CÓ DENUVO - CẨN THẬN

🔒 CẢNH BÁO DENUVO
Game này sử dụng Denuvo Anti-Tamper - Có thể ảnh hưởng tốc độ tải
```

### Đối Với Game Free
```
❌ GAME KHÔNG HỢP LỆ: Game này là Free-to-Play hoặc miễn phí trên Steam
Chỉ xử lý các game có phí (Paid games)
```

---

## 📊 Kiểm Tra Kết Quả

Sau khi add game:

1. **MongoDB**: Game trong collection `games` ✓
2. **GitHub**: Manifest file trong Releases ✓
3. **Discord**: Thông báo với hình ảnh game ✓

---

## ❓ Nếu Có Lỗi

### Discord Webhook Expired
```
❌ Discord error: 404 Unknown Webhook
```
→ Cập nhật `DISCORD_WEBHOOK_URL` trong `.env`

### Railway Không Phản Hồi
```
Notification to configured MANIFEST_ADMIN_URL failed
```
→ Chạy bot local: `node manifest-bot.js`

### Game Not Found
```
⚠️ Warning: Could not fetch details
```
→ Game có thể bị restricted/unavailable trên Steam

---

## 🚀 Sắp Tới: Vietnamese Game Bot

Sẽ thêm:
- 🇻🇳 Giao diện Tiếng Việt hoàn toàn
- 🎨 Discord reactions/buttons
- 📊 Dashboard web

---

**Lưu ý**: Đảm bảo `.env` có `MONGODB_URI`, `ADMIN_TOKEN`, và `DISCORD_WEBHOOK_URL`
