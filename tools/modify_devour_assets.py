#!/usr/bin/env python3
"""
DEVOUR Vietnamese Asset Modifier using unitypy
Extracts text from sharedassets0.assets and replaces with Vietnamese
"""

import sys
import os
import json
from pathlib import Path

# Dictionary of translations
TRANSLATIONS = {
    "Moonless Night": "Đêm Không Trăng",
    "Claws Out": "Móng Vuốt Ra",
    "Acceleration": "Tăng Tốc",
    "Bloodlust": "Khát Máu",
    "Speed Boost": "Tăng Tốc Độ",
    # Add more as needed
}

GAME_PATH = Path("D:\\SteamLibrary\\steamapps\\common\\Devour\\DEVOUR_Data")
ASSETS_FILE = GAME_PATH / "sharedassets0.assets"
BACKUP_FILE = GAME_PATH / "sharedassets0.assets.backup"

print("🎮 DEVOUR Vietnamese Asset Modifier")
print("=" * 60)

if not ASSETS_FILE.exists():
    print(f"❌ Asset file not found: {ASSETS_FILE}")
    sys.exit(1)

print(f"📁 Found asset file: {ASSETS_FILE}")
print(f"📏 Size: {ASSETS_FILE.stat().st_size / (1024*1024):.2f} MB\n")

# Try importing unitypy
try:
    from unitypy import load
    print("✅ unitypy imported successfully\n")
except ImportError as e:
    print(f"❌ unitypy not installed: {e}")
    print("Please run: pip install unitypy")
    sys.exit(1)

# Step 1: Backup original
if not BACKUP_FILE.exists():
    print("💾 Creating backup...")
    import shutil
    shutil.copy2(ASSETS_FILE, BACKUP_FILE)
    print(f"✅ Backup created: {BACKUP_FILE}\n")

# Step 2: Load assets
print("🔍 Loading assets...")
try:
    env = load(str(ASSETS_FILE))
    print("✅ Assets loaded\n")
except Exception as e:
    print(f"❌ Error loading assets: {e}\n")
    sys.exit(1)

# Step 3: Find text containers
print("🔎 Searching for translatable strings...\n")

found_strings = {}
modified_count = 0

for obj in env.objects.values():
    # Look for TextAsset or other string containers
    try:
        if hasattr(obj, 'script'):  # TextAsset
            text = obj.script.decode('utf-8') if isinstance(obj.script, bytes) else obj.script
            
            for en, vi in TRANSLATIONS.items():
                if en in text:
                    print(f"📌 Found: '{en}' → '{vi}'")
                    # Replace in text
                    obj.script = text.replace(en, vi).encode('utf-8')
                    modified_count += 1
                    found_strings[en] = vi
                    
    except Exception as e:
        # Skip objects that don't have text
        pass

if modified_count > 0:
    print(f"\n✅ Found {modified_count} translations to apply\n")
    
    # Step 4: Save modified assets
    print("💾 Saving modified assets...")
    try:
        env.save(str(ASSETS_FILE))
        print(f"✅ Saved to: {ASSETS_FILE}\n")
        
        print("=" * 60)
        print("✅ MODIFICATION COMPLETE!")
        print("=" * 60)
        print(f"\nApplied translations:")
        for en, vi in found_strings.items():
            print(f"  • {en} → {vi}")
        print("\n🎮 Restart DEVOUR to see Vietnamese items!")
        print("📍 If you need to restore English, rename backup:")
        print(f"   {BACKUP_FILE} → {ASSETS_FILE}")
        
    except Exception as e:
        print(f"❌ Error saving assets: {e}")
        sys.exit(1)
else:
    print("⚠️  No translations found in assets")
    print("This might mean:")
    print("  - Strings are encoded differently")
    print("  - Strings are in a different asset file")
    print("  - Strings are generated at runtime")
