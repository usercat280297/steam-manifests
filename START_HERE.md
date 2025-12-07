## 🎮 DEVOUR Vietnamese - Ready to Play!

Em đã cài BepInEx xong! ✅

### Ngay bây giờ, chơi Việt:

```bash
node play-vietnamese.js
```

**Điều gì xảy ra:**
1. Backup inventory.json (English)
2. Patch với tiếng Việt (200+ terms)
3. Launch game tự động
4. Chơi! 
5. Đóng game → Tự động restore English

### Một vài lựa chọn khác:

```bash
# Interactive (chọn ngôn ngữ)
node devour-complete-launcher.js

# Monitor mode (chạy background)
node devour-vi-monitor.js

# Launch mà không patching
node devour-launch-simple.js
```

### Để thêm translations:

Edit `play-vietnamese.js`, tìm `VI_DICT` object:
```javascript
const VI_DICT = {
  'English': 'Tiếng Việt',
  // Add more...
};
```

---

**Status:** ✅ Ready to play in Vietnamese!
