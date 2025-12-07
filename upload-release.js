#!/usr/bin/env node
/**
 * 📦 GitHub Release Uploader
 * Upload translation package to GitHub Release
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

require('dotenv').config();

async function uploadToGitHubRelease(folderPath, gameName, appId) {
  const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
  const GITHUB_OWNER = process.env.GITHUB_REPO_OWNER || 'usercat280297';
  const GITHUB_REPO = process.env.GITHUB_REPO_NAME || 'steam-manifests';
  const API = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}`;

  if (!GITHUB_TOKEN) {
    console.error('❌ GITHUB_TOKEN not set in .env');
    process.exit(1);
  }

  try {
    console.log(`\n📦 GitHub Release Uploader\n`);
    console.log(`Game: ${gameName} (${appId})`);
    console.log(`Folder: ${folderPath}\n`);

    // Create ZIP file
    console.log(`⏳ Creating ZIP...`);
    const zipName = `${gameName}_Vietnamese_Translation.zip`;
    execSync(`powershell Compress-Archive -Path "${folderPath}" -DestinationPath "${zipName}" -Force`, {
      stdio: 'inherit'
    });
    console.log(`✅ ZIP created: ${zipName}\n`);

    // Create Release
    console.log(`⏳ Creating GitHub Release...`);
    const releaseName = `${gameName} Vietnamese Translation v1.0`;
    const releaseTag = `${gameName}-Viet-v1.0`;
    const releaseBody = `🇻🇳 Vietnamese Translation for ${gameName} (AppID: ${appId})

**What's included:**
- Vietnamese translation of all items, perks, outfits, and emotes
- Auto-installer (INSTALL.bat)
- Installation guide (README.txt)
- 131 items translated

**How to install:**
1. Extract ZIP file
2. Double-click INSTALL.bat
3. Choose your game folder
4. Done! Game will be in Vietnamese

**Manual installation:**
1. Backup: Copy inventory.json → inventory.json.backup
2. Replace: Copy inventory.json from ZIP to game folder
3. Play!

**Restore English:**
Delete inventory.json, rename inventory.json.backup back to inventory.json

Created: ${new Date().toISOString().split('T')[0]}`;

    const releaseResponse = await axios.post(
      `${API}/releases`,
      {
        tag_name: releaseTag,
        name: releaseName,
        body: releaseBody,
        draft: false,
        prerelease: false
      },
      {
        headers: {
          'Authorization': `token ${GITHUB_TOKEN}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json'
        }
      }
    );

    const releaseId = releaseResponse.data.id;
    const releaseUrl = releaseResponse.data.html_url;
    console.log(`✅ Release created: ${releaseUrl}\n`);

    // Upload asset
    console.log(`⏳ Uploading ZIP to release...`);
    const fileContent = fs.readFileSync(zipName);
    const uploadUrl = `${API}/releases/${releaseId}/assets`;

    const uploadResponse = await axios.post(
      uploadUrl,
      fileContent,
      {
        headers: {
          'Authorization': `token ${GITHUB_TOKEN}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/zip',
          'Content-Length': fileContent.length
        },
        params: {
          name: zipName
        }
      }
    );

    const downloadUrl = uploadResponse.data.browser_download_url;
    console.log(`✅ Asset uploaded!\n`);

    console.log(`✨ SUCCESS!\n`);
    console.log(`📥 Download Link:`);
    console.log(`   ${downloadUrl}\n`);
    console.log(`🔗 Release Page:`);
    console.log(`   ${releaseUrl}\n`);

    return {
      releaseUrl,
      downloadUrl,
      zipFile: zipName
    };

  } catch (error) {
    console.error(`\n❌ Error: ${error.response?.data?.message || error.message}`);
    process.exit(1);
  }
}

async function main() {
  const args = process.argv.slice(2);

  if (args.length < 3) {
    console.log('Usage: node upload-release.js <folder_path> <game_name> <app_id>');
    console.log('\nExample:');
    console.log('  node upload-release.js "Devour_Vietnamese_Translation" "Devour" 1274570');
    process.exit(1);
  }

  const folderPath = args[0];
  const gameName = args[1];
  const appId = args[2];

  if (!fs.existsSync(folderPath)) {
    console.error(`❌ Folder not found: ${folderPath}`);
    process.exit(1);
  }

  await uploadToGitHubRelease(folderPath, gameName, appId);
}

main();
