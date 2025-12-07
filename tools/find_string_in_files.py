#!/usr/bin/env python3
"""
Binary search for a UTF-8 or UTF-16 string inside files under a folder.
Usage: python find_string_in_files.py <root_path> "pattern"
"""
import sys
import os

if len(sys.argv) < 3:
    print("Usage: python find_string_in_files.py <root_path> <pattern>")
    sys.exit(1)

root = sys.argv[1]
pattern = sys.argv[2]

utf8 = pattern.encode('utf-8')
utf16le = pattern.encode('utf-16le')
utf16be = pattern.encode('utf-16be')

matches = []

for dirpath, dirnames, filenames in os.walk(root):
    # skip common protected folders by name
    # but still try to access; exceptions will be caught
    for fname in filenames:
        fpath = os.path.join(dirpath, fname)
        try:
            with open(fpath, 'rb') as f:
                data = f.read()
        except Exception as e:
            # permission or read error - skip
            # print(f"Skipping {fpath}: {e}")
            continue
        if utf8 in data or utf16le in data or utf16be in data:
            matches.append(fpath)
            print(f"MATCH: {fpath}")

if not matches:
    print("No matches found.")
else:
    print(f"\nFound {len(matches)} file(s) containing the pattern.")
