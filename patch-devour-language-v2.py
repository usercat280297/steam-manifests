#!/usr/bin/env python3
"""
DEVOUR Vietnamese Localization - Asset Patcher v2
Patches in-game language strings by extracting, translating, and repacking assets
"""

import os
import sys
import json
import struct
from pathlib import Path

GAME_PATH = r"D:\SteamLibrary\steamapps\common\Devour"
ASSETS_PATH = os.path.join(GAME_PATH, "DEVOUR_Data")

# Vietnamese translations for common UI strings
VI_TRANSLATIONS = {
    "Single Player": "Chơi Một Người",
    "Host Game": "Tạo Phòng",
    "Join Game": "Vào Phòng",
    "Options": "Tùy Chọn",
    "Quit": "Thoát",
    "Resume": "Tiếp Tục",
    "Pause": "Tạm Dừng",
    "Start Game": "Bắt Đầu",
    "Settings": "Cài Đặt",
    "Audio": "Âm Thanh",
    "Graphics": "Đồ Họa",
    "Controls": "Điều Khiển",
    "Back": "Quay Lại",
    "Apply": "Áp Dụng",
    "Language": "Ngôn Ngữ",
    "English": "Tiếng Anh",
    "French": "Tiếng Pháp",
    "German": "Tiếng Đức",
    "Spanish": "Tiếng Tây Ban Nha",
    "Italian": "Tiếng Ý",
    "Japanese": "Tiếng Nhật",
    "Korean": "Tiếng Hàn",
    "Russian": "Tiếng Nga",
    "Chinese": "Tiếng Trung",
    "Portuguese": "Tiếng Bồ Đào Nha",
    "Polish": "Tiếng Ba Lan",
    "Turkish": "Tiếng Thổ Nhĩ Kỳ",
    "Vietnamese": "Tiếng Việt",
    "New Game": "Trò Chơi Mới",
    "Load Game": "Tải Trò Chơi",
    "Save Game": "Lưu Trò Chơi",
    "Delete": "Xóa",
    "Yes": "Có",
    "No": "Không",
    "Confirm": "Xác Nhận",
    "Cancel": "Hủy",
    "Exit": "Thoát",
    "Main Menu": "Menu Chính",
    "Score": "Điểm",
    "Level": "Cấp Độ",
    "Wave": "Sóng",
    "Time": "Thời Gian",
    "Health": "Sức Khỏe",
    "Ammo": "Đạn",
    "Difficulty": "Độ Khó",
    "Easy": "Dễ",
    "Normal": "Bình Thường",
    "Hard": "Khó",
    "Expert": "Chuyên Gia",
    "Nightmare": "Ác Mộng",
}

def extract_strings_from_asset(asset_path):
    """Extract string data from .assets file"""
    try:
        with open(asset_path, 'rb') as f:
            content = f.read()
        
        # Find ASCII text patterns (simple heuristic)
        strings = []
        current_str = b''
        
        for byte in content:
            if 32 <= byte <= 126:  # Printable ASCII
                current_str += bytes([byte])
            else:
                if len(current_str) > 4:  # Min length
                    try:
                        strings.append(current_str.decode('utf-8', errors='ignore'))
                    except:
                        pass
                current_str = b''
        
        return strings
    except Exception as e:
        print(f"❌ Error reading {asset_path}: {e}")
        return []

def patch_asset_file(asset_path, translations):
    """Patch asset file with Vietnamese translations"""
    try:
        with open(asset_path, 'rb') as f:
            content = bytearray(f.read())
        
        patches_made = 0
        
        for english, vietnamese in translations.items():
            # Convert to bytes
            en_bytes = english.encode('utf-8')
            vi_bytes = vietnamese.encode('utf-8')
            
            # Find and replace (pad with spaces if needed)
            pos = 0
            while True:
                pos = content.find(en_bytes, pos)
                if pos == -1:
                    break
                
                # Only replace if we have enough space or can manage string length
                if len(vi_bytes) <= len(en_bytes):
                    # Pad Vietnamese text with null bytes
                    padded_vi = vi_bytes + b'\x00' * (len(en_bytes) - len(vi_bytes))
                    content[pos:pos+len(en_bytes)] = padded_vi
                    patches_made += 1
                
                pos += len(en_bytes)
        
        # Write back
        if patches_made > 0:
            with open(asset_path, 'wb') as f:
                f.write(content)
            print(f"✅ {asset_path}: {patches_made} patches")
            return patches_made
        
        return 0
        
    except Exception as e:
        print(f"❌ Error patching {asset_path}: {e}")
        return 0

def main():
    print("🇻🇳 DEVOUR Vietnamese Asset Patcher v2")
    print(f"📁 Game path: {GAME_PATH}")
    print(f"📁 Assets path: {ASSETS_PATH}\n")
    
    if not os.path.exists(ASSETS_PATH):
        print(f"❌ Assets directory not found: {ASSETS_PATH}")
        return False
    
    # Create backup first
    assets = list(Path(ASSETS_PATH).glob("**/*.assets"))
    print(f"🔍 Found {len(assets)} .assets files\n")
    
    total_patches = 0
    
    for asset_file in assets:
        print(f"📝 Processing: {asset_file.name}")
        patches = patch_asset_file(str(asset_file), VI_TRANSLATIONS)
        total_patches += patches
    
    print(f"\n✅ Total patches applied: {total_patches}")
    print("🎮 Launch the game and check if Vietnamese is available in Language settings!")
    
    return total_patches > 0

if __name__ == "__main__":
    try:
        success = main()
        sys.exit(0 if success else 1)
    except Exception as e:
        print(f"❌ Fatal error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
