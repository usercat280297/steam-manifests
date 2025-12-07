#!/usr/bin/env python3
"""
DEVOUR Vietnamese Asset Patcher
Patches game text files to inject Vietnamese translations

Usage:
    python patch_devour_assets.py
"""

import json
import os
import shutil
from pathlib import Path
from typing import Dict, List

# Game paths
GAME_ROOT = Path("D:/SteamLibrary/steamapps/common/Devour")
DEVOUR_DATA = GAME_ROOT / "DEVOUR_Data"
STREAMING_ASSETS = DEVOUR_DATA / "StreamingAssets"

# Vietnamese translation dictionary
TRANSLATIONS: Dict[str, str] = {
    # === CHARACTERS ===
    "Moonless Night": "Đêm Không Trăng",
    "The Mother": "Mẹ",
    "The Caregiver": "Người Chăm Sóc",
    "The Mourning Mother": "Mẹ Tuyệt Vọng",
    
    # === PERKS (70+ terms) ===
    "Acceleration": "Tăng Tốc",
    "Airborne": "Bay Lên",
    "Amplified": "Khuếch Đại",
    "Armourer": "Thợ Duy Trì",
    "Blind Spot": "Điểm Mù",
    "Blocker": "Chắn Đường",
    "Bluff": "Che Đậu",
    "Bullet Proof": "Chống Đạn",
    "Cache": "Kho Chứa",
    "Cagey": "Xấp Xỉ",
    "Carapace": "Vỏ Bảo Vệ",
    "Chaos": "Hỗn Loạn",
    "Claws Out": "Móng Vuốt Ra",
    "Cleansing": "Thanh Tẩy",
    "Cold Blooded": "Máu Lạnh",
    "Comet": "Sao Chổi",
    "Common Sense": "Lẽ Thường Tình",
    "Escape Artist": "Nghệ Sĩ Trốn Thoát",
    "Evasion": "Tránh Né",
    "Ethereal": "Vô Hình",
    "Evolver": "Người Tiến Hóa",
    "Expedite": "Thúc Giục",
    "Expert": "Chuyên Gia",
    "Farsighted": "Viễn Thị",
    "Feral": "Dã Man",
    "Firepower": "Sức Bắn",
    "Fleet": "Nhanh Nhẹn",
    "Focus": "Tập Trung",
    "Fog": "Sương Mù",
    "Fold": "Gập Lại",
    "Forager": "Người Lương Thực",
    "Foresight": "Nhìn Trước",
    "Fortified": "Được Tăng Cường",
    "Fortune": "May Mắn",
    "Fragile": "Yếu Đuối",
    "Freelance": "Tự Do",
    "Frozen": "Đông Cứng",
    "Ghost": "Ma",
    "Give and Take": "Cho Và Nhận",
    "Grim": "Ảm Đạm",
    "Grounded": "Neo Chân",
    "Guardian": "Bảo Vệ",
    
    # === ITEMS ===
    "Light": "Ánh Sáng",
    "Rope": "Sợi Dây",
    "Key": "Chìa Khóa",
    "Matches": "Que Diêm",
    "Whistle": "Còi Dắt",
    "Crucifix": "Thánh Giá",
    "Music Box": "Hộp Âm Nhạc",
    "Bottle": "Chai",
    "Lantern": "Đèn Lồng",
    "Flashlight": "Đèn Pin",
    
    # === UI ===
    "Wait Room": "Sảnh Chờ",
    "Lobby": "Sảnh Chơi",
    "Main Menu": "Menu Chính",
    "Loading": "Đang Tải",
    "Settings": "Cài Đặt",
    "Audio": "Âm Thanh",
    "Video": "Video",
    "Gameplay": "Cách Chơi",
    "Graphics": "Đồ Họa",
    "Controls": "Điều Khiển",
    "Help": "Trợ Giúp",
    "Credits": "Tín Dụng",
    "Exit": "Thoát",
    "Start Game": "Bắt Đầu",
    "Continue": "Tiếp Tục",
    "New Game": "Trò Chơi Mới",
    "Load Game": "Tải Trò Chơi",
    "Save Game": "Lưu Trò Chơi",
    "Pause": "Tạm Dừng",
    "Resume": "Tiếp Tục Chơi",
    "Restart": "Bắt Đầu Lại",
    "Back": "Quay Lại",
    "Next": "Tiếp Theo",
    "Select": "Chọn",
    "Confirm": "Xác Nhận",
    "Cancel": "Hủy",
    "Survive": "Sống Sót",
    "Escape": "Trốn Thoát",
    "Hunt": "Săn Đuổi",
    "Protect": "Bảo Vệ",
}

def find_text_files() -> List[Path]:
    """Find JSON and text files in game assets"""
    text_files = []
    
    # Check StreamingAssets
    if STREAMING_ASSETS.exists():
        text_files.extend(STREAMING_ASSETS.glob("**/*.json"))
        text_files.extend(STREAMING_ASSETS.glob("**/*.txt"))
    
    # Check Resources
    resources = DEVOUR_DATA / "Resources"
    if resources.exists():
        text_files.extend(resources.glob("**/*.json"))
        text_files.extend(resources.glob("**/*.txt"))
    
    return text_files

def patch_json_file(file_path: Path) -> bool:
    """Patch JSON file with Vietnamese translations"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        original = content
        
        # Apply translations
        for en, vi in TRANSLATIONS.items():
            content = content.replace(f'"{en}"', f'"{vi}"')
            content = content.replace(f"'{en}'", f"'{vi}'")
        
        # Only write if changed
        if content != original:
            # Backup original
            backup = file_path.with_suffix(file_path.suffix + ".en_backup")
            if not backup.exists():
                shutil.copy2(file_path, backup)
            
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(content)
            
            print(f"✓ Patched: {file_path.name}")
            return True
    except Exception as e:
        print(f"✗ Error patching {file_path.name}: {e}")
    
    return False

def main():
    print("\n" + "="*60)
    print("🇻🇳 DEVOUR Vietnamese Asset Patcher")
    print("="*60 + "\n")
    
    if not GAME_ROOT.exists():
        print(f"❌ Game folder not found: {GAME_ROOT}")
        return
    
    print("📂 Scanning game assets...")
    text_files = find_text_files()
    print(f"   Found {len(text_files)} text files\n")
    
    if not text_files:
        print("⚠️  No text files found in StreamingAssets or Resources")
        print("   Game may store text in binary assets\n")
        print("   Alternative: Use BepInEx plugin for runtime patching")
        return
    
    print("🔄 Patching files...")
    patched_count = 0
    for file in text_files:
        if patch_json_file(file):
            patched_count += 1
    
    print(f"\n✅ Patched {patched_count} files")
    print("\n🎮 Launch DEVOUR and enjoy Vietnamese text!\n")

if __name__ == "__main__":
    main()
