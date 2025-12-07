#!/usr/bin/env node
/**
 * Upload asset to GitHub Release
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');

async function uploadAsset() {
  // Hardcode token for now (should be in .env in production)
  const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
  const GITHUB_OWNER = 'usercat280297';
  const GITHUB_REPO = 'steam-manifests';
  const RELEASE_TAG = 'Devour-Viet-v1.0';
  const ZIP_FILE = 'Devour_Vietnamese_Translation.zip';

  try {
    // Get release ID
    console.log('⏳ Getting release info...');
    const releaseUrl = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/releases/tags/${RELEASE_TAG}`;
    const releaseRes = await axios.get(releaseUrl, {
      headers: {
        'Authorization': `token ${GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    });

    const releaseId = releaseRes.data.id;
    console.log(`✅ Release ID: ${releaseId}`);

    // Upload asset
    console.log(`\n⏳ Uploading ${ZIP_FILE}...`);
    const zipPath = path.join(process.cwd(), ZIP_FILE);
    const fileContent = fs.readFileSync(zipPath);
    
    const uploadUrl = `https://uploads.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/releases/${releaseId}/assets`;
    
    const uploadRes = await axios.post(uploadUrl, fileContent, {
      headers: {
        'Authorization': `token ${GITHUB_TOKEN}`,
        'Content-Type': 'application/zip',
        'Content-Length': fileContent.length
      },
      params: {
        name: ZIP_FILE
      }
    });

    console.log(`✅ Asset uploaded!`);
    console.log(`📥 Download: ${uploadRes.data.browser_download_url}`);

  } catch (error) {
    console.error('❌ Error:', error.response?.data?.message || error.message);
    process.exit(1);
  }
}

uploadAsset();
