#!/usr/bin/env node

/**
 * BepInEx Plugin Pre-compiler Downloader
 * Downloads or provides pre-built DLL nếu compilation không khả thi
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

const PLUGIN_DIR = path.join(__dirname, 'bin', 'Release', 'net472');
const PLUGIN_DLL = path.join(PLUGIN_DIR, 'DevourVietnamesePatch.dll');

// GitHub pre-built release (nếu có)
const GITHUB_RELEASE = 'https://github.com/usercat280297/steam-manifests/releases/download/v1.0.0/DevourVietnamesePatch.dll';

console.log('🔧 BepInEx Plugin Setup Helper');
console.log('=' .repeat(60));
console.log('');

// Check if DLL already exists
if (fs.existsSync(PLUGIN_DLL)) {
    console.log('✅ Plugin DLL already exists:');
    console.log(`   ${PLUGIN_DLL}`);
    console.log('');
    console.log('Next: Run install.ps1 to deploy to game folder');
    process.exit(0);
}

// If no DLL, provide options
console.log('❌ Plugin DLL not found. Options:');
console.log('');
console.log('1. Compile from source (requires .NET SDK):');
console.log('   cd "e:\\Đức Hải\\steam-manifest-bot\\devour_vi_bepinex_plugin"');
console.log('   dotnet build -c Release');
console.log('');
console.log('2. Use BepInEx native reflection (no pre-compiled needed):');
console.log('   → Run install.ps1 -SkipBuild to use string replacement only');
console.log('');
console.log('3. Download pre-built DLL from GitHub release:');
console.log(`   ${GITHUB_RELEASE}`);
console.log('');
console.log('Current status:');
console.log(`   Architecture: x64`);
console.log(`   Target Framework: .NET Framework 4.7.2`);
console.log(`   BepInEx Version: 5.4.21`);
console.log('');
