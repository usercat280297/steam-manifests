#!/usr/bin/env node

/**
 * Download latest BepInEx plugin DLL from GitHub Actions artifacts
 * or GitHub Releases
 */

const https = require('https');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const REPO = 'usercat280297/steam-manifests';
const DLL_NAME = 'DevourVietnamesePatch.dll';
const OUTPUT_DIR = __dirname;
const OUTPUT_PATH = path.join(OUTPUT_DIR, DLL_NAME);

function getJSON(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'Node.js' } }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          resolve(JSON.parse(data));
        } else {
          reject(new Error(`HTTP ${res.statusCode}`));
        }
      });
    }).on('error', reject);
  });
}

async function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    https.get(url, { headers: { 'User-Agent': 'Node.js' }, redirect: 'follow' }, (res) => {
      res.pipe(file);
      file.on('finish', () => {
        file.close();
        resolve();
      });
    }).on('error', (err) => {
      fs.unlink(dest, () => {});
      reject(err);
    });
  });
}

async function main() {
  console.log('\n' + '='.repeat(60));
  console.log('📦 BepInEx Plugin Downloader');
  console.log('='.repeat(60) + '\n');
  
  try {
    console.log('🔍 Checking latest GitHub Actions builds...\n');
    
    // Get workflow runs
    const runs = await getJSON(`https://api.github.com/repos/${REPO}/actions/runs?per_page=5`);
    
    let foundArtifact = null;
    for (const run of runs.workflow_runs) {
      if (run.status === 'completed' && run.conclusion === 'success') {
        console.log(`✓ Found successful run: ${run.name} (#${run.id})`);
        
        // Get artifacts for this run
        const artifacts = await getJSON(`https://api.github.com/repos/${REPO}/actions/runs/${run.id}/artifacts`);
        for (const artifact of artifacts.artifacts) {
          if (artifact.name === 'DevourVietnamesePatch') {
            console.log(`  └─ Found artifact: ${artifact.name}`);
            foundArtifact = artifact;
            break;
          }
        }
        
        if (foundArtifact) break;
      }
    }
    
    if (!foundArtifact) {
      console.log('⏳ No successful builds yet. GitHub Actions may still be running.\n');
      console.log('Check status at:');
      console.log(`  https://github.com/${REPO}/actions\n`);
      process.exit(0);
    }
    
    console.log(`\n📥 Downloading artifact: ${foundArtifact.name}...`);
    
    const zipPath = path.join(OUTPUT_DIR, 'artifact.zip');
    await downloadFile(foundArtifact.archive_download_url, zipPath);
    console.log('✓ Downloaded');
    
    // Extract DLL
    console.log('\n📂 Extracting DLL...');
    execSync(`powershell -Command "Add-Type -AssemblyName System.IO.Compression.FileSystem; [System.IO.Compression.ZipFile]::ExtractToDirectory('${zipPath}', '${OUTPUT_DIR}')"`, { stdio: 'inherit' });
    
    // Find and move DLL to root
    const files = execSync(`powershell -Command "Get-ChildItem -Path '${OUTPUT_DIR}' -Filter '*.dll' -Recurse | Select-Object -ExpandProperty FullName"`, { encoding: 'utf8' }).trim().split('\n');
    if (files.length > 0 && files[0]) {
      const dllPath = files[0];
      if (dllPath !== OUTPUT_PATH) {
        fs.copyFileSync(dllPath, OUTPUT_PATH);
        console.log(`✓ Extracted: ${DLL_NAME}`);
      }
    }
    
    fs.unlinkSync(zipPath);
    
    console.log(`\n✅ Ready! DLL is at: ${OUTPUT_PATH}\n`);
    console.log('Next steps:');
    console.log('  1. Extract GreenLuma to C:\\GreenLuma\\ (or preferred location)');
    console.log('  2. Run: powershell -ExecutionPolicy Bypass -File install.ps1');
    console.log('  3. Launch DEVOUR with GreenLuma manifest enabled\n');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('\nManual download: https://github.com/usercat280297/steam-manifests/actions');
    process.exit(1);
  }
}

main();
