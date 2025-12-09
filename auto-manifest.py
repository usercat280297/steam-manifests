#!/usr/bin/env python3
"""
Steam Manifest Generator - Auto Fetch Depot & DLC Manifest (7 Steps)
Usage: python3 auto-manifest.py <AppID> [GameName]
"""

import sys
import subprocess
import hashlib
import re
from pathlib import Path

def get_steamcmd_output(app_id):
    """Step 1: Fetch data from SteamCMD"""
    steamcmd = "C:\\steamcmd\\steamcmd.exe"
    cmd = [steamcmd, "+login", "anonymous", "+app_info_print", str(app_id), "+quit"]
    
    try:
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=30)
        return result.stdout + result.stderr
    except Exception as e:
        print(f"❌ Error running SteamCMD: {e}")
        return ""

def parse_depots(output):
    """Step 2: Parse depot information"""
    depots = []
    
    # Look for depot patterns
    pattern = r'"(\d+)"\s*\n\s*{\s*"manifests"[\s\S]*?"gid"\s+"(\d+)"'
    matches = re.finditer(pattern, output)
    
    for match in matches:
        depot_id = int(match.group(1))
        manifest_id = match.group(2)
        depots.append({"id": depot_id, "manifest": manifest_id, "type": "BASE"})
    
    return depots

def calculate_hash(depot_id, manifest_id):
    """Step 4: Calculate SHA256 hash"""
    hash_input = f"{depot_id}:{manifest_id}"
    return hashlib.sha256(hash_input.encode()).hexdigest()

def generate_lua(app_id, game_name, depots):
    """Step 4-5: Generate Lua manifest"""
    lua = f"-- {game_name} (AppID: {app_id})\n\naddappid({app_id})\n\n"
    
    for depot in depots:
        hash_hex = calculate_hash(depot["id"], depot["manifest"])
        lua += f"-- {depot['type']} Depot: {depot['id']} (ManifestID: {depot['manifest']})\n"
        lua += f"addappid({depot['id']}, 0, \"{hash_hex}\")\n\n"
    
    return lua

def main():
    if len(sys.argv) < 2:
        print("Usage: python3 auto-manifest.py <AppID> [GameName]")
        print("Example: python3 auto-manifest.py 2947440 'Silent Hill'")
        sys.exit(1)
    
    app_id = sys.argv[1]
    game_name = sys.argv[2] if len(sys.argv) > 2 else f"Game {app_id}"
    
    print("\n🎮 STEAM MANIFEST GENERATOR v5.0\n")
    
    print(f"[STEP 1/7] Fetching SteamCMD data for AppID {app_id}...")
    output = get_steamcmd_output(app_id)
    
    print("[STEP 2/7] Parsing depots...")
    depots = parse_depots(output)
    
    print(f"[STEP 3/7] Found {len(depots)} depot(s)")
    
    print("[STEP 4/7] Calculating SHA256 hashes...")
    lua = generate_lua(app_id, game_name, depots)
    
    print("[STEP 5/7] Saving manifest file...")
    Path("manifests").mkdir(exist_ok=True)
    out_file = f"manifests/{app_id}.lua"
    
    with open(out_file, "w", encoding="utf-8") as f:
        f.write(lua)
    
    print(f"[STEP 6/7] File saved: {out_file}")
    
    print("[STEP 7/7] Ready to use!\n")
    print("=" * 50)
    print(f"App: {game_name} (ID: {app_id})")
    print(f"Depots: {len(depots)}")
    print(f"File: {out_file}")
    print("=" * 50 + "\n")

if __name__ == "__main__":
    main()
