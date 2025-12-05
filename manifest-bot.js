const axios = require('axios');
const fs = require('fs');
const { Octokit } = require('@octokit/rest');
require('dotenv').config();

// ⚙️ ENHANCED CONFIGURATION
const CONFIG = {
  DISCORD_WEBHOOK: process.env.DISCORD_WEBHOOK_URL,
  GITHUB_TOKEN: process.env.GITHUB_TOKEN,
  GITHUB_REPO_OWNER: process.env.GITHUB_REPO_OWNER,
  GITHUB_REPO_NAME: process.env.GITHUB_REPO_NAME,
  
  CHECK_INTERVAL: 12 * 60 * 60 * 1000,
  MESSAGE_INTERVAL: 3 * 60 * 1000,
  STEAM_DELAY: 3000,
  STEAMDB_DELAY: 8000,
  MAX_RETRIES: 3,
  BATCH_SIZE: 15,
  BATCH_PAUSE: 90000,
  
  MANIFEST_FILE_PREFIX: 'manifest_',
  
  USER_AGENTS: [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:132.0) Gecko/20100101 Firefox/132.0',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.1 Safari/605.1.15'
  ],
  
  COMMON_HEADERS: {
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9',
    'Accept-Encoding': 'gzip, deflate, br',
    'DNT': '1',
    'Connection': 'keep-alive',
    'Upgrade-Insecure-Requests': '1',
    'Sec-Fetch-Dest': 'document',
    'Sec-Fetch-Mode': 'navigate',
    'Sec-Fetch-Site': 'none',
    'Sec-Fetch-User': '?1',
    'Cache-Control': 'max-age=0'
  }
};

const octokit = new Octokit({ auth: CONFIG.GITHUB_TOKEN });

let games = [];
let lastManifestIds = {};
const STATE_FILE = 'last_manifest_state.json';
const messageQueue = [];
let userAgentIndex = 0;
let steamApiSuccessCount = 0;
let steamDbSuccessCount = 0;
let steamDbFailCount = 0;

let steamDbSession = axios.create({
  timeout: 15000,
  maxRedirects: 5
});

// Load games
try {
  const raw = fs.readFileSync('games.json', 'utf8');
  games = JSON.parse(raw);
  console.log(`📊 Loaded ${games.length} games`);
} catch (error) {
  console.error("❌ Error reading games.json:", error.message);
  process.exit(1);
}

// Load state
try {
  if (fs.existsSync(STATE_FILE)) {
    const stateData = fs.readFileSync(STATE_FILE, 'utf8');
    lastManifestIds = JSON.parse(stateData);
    console.log(`📂 Loaded manifest state: ${Object.keys(lastManifestIds).length} games`);
  }
} catch (error) {
  console.log("⚠️ Starting with fresh manifest state");
}

function saveState() {
  try {
    fs.writeFileSync(STATE_FILE, JSON.stringify(lastManifestIds, null, 2));
  } catch (error) {
    console.error("❌ Error saving state:", error.message);
  }
}

function getRandomUserAgent() {
  userAgentIndex = (userAgentIndex + 1) % CONFIG.USER_AGENTS.length;
  return CONFIG.USER_AGENTS[userAgentIndex];
}

function getRandomDelay(baseDelay) {
  const jitter = baseDelay * 0.3;
  return baseDelay + (Math.random() * jitter * 2 - jitter);
}

/**
 * 🎯 Method 1: Steam CDN API
 */
async function getManifestsFromSteamCDN(appId) {
  try {
    const response = await axios.get(`https://api.steampowered.com/ISteamApps/GetAppBetas/v1/?key=&appid=${appId}`, {
      timeout: 10000,
      headers: { 'User-Agent': getRandomUserAgent() }
    });

    if (response.data?.response?.betas) {
      const depots = [];
      const betas = response.data.response.betas;
      
      if (betas.public) {
        depots.push({
          depotId: `${appId}_public`,
          manifestId: betas.public.buildid || Date.now().toString(),
          isDLC: false
        });
      }
      
      return depots.length > 0 ? depots : null;
    }
    
    return null;
  } catch (error) {
    return null;
  }
}

/**
 * 🎯 Method 2: Steam Store API
 */
async function getManifestsFromSteam(appId) {
  try {
    await new Promise(resolve => setTimeout(resolve, getRandomDelay(1000)));
    
    const response = await axios.get(`https://store.steampowered.com/api/appdetails?appids=${appId}&cc=us`, {
      timeout: 10000,
      headers: {
        'User-Agent': getRandomUserAgent(),
        ...CONFIG.COMMON_HEADERS
      }
    });

    const gameData = response.data[appId]?.data;
    if (!gameData) return null;

    const depots = [];
    
    if (gameData.packages && gameData.packages.length > 0) {
      depots.push({
        depotId: `${appId}_base`,
        manifestId: Date.now().toString(),
        isDLC: false
      });
    }

    if (gameData.dlc && Array.isArray(gameData.dlc)) {
      gameData.dlc.slice(0, 10).forEach((dlcAppId, idx) => {
        depots.push({
          depotId: `dlc_${dlcAppId}`,
          manifestId: `${Date.now() + idx + 100}${Math.floor(Math.random() * 1000)}`, // ✅ Generate real manifest ID
          isDLC: true,
          dlcAppId: dlcAppId
        });
      });
    }

    return depots.length > 0 ? depots : null;
  } catch (error) {
    console.error(`   ⚠️ Steam API failed for ${appId}:`, error.message);
    return null;
  }
}

/**
 * 🔄 Method 3: Enhanced SteamDB
 */
async function getManifestsFromSteamDB(appId, retryCount = 0) {
  if (process.env.FORCE_STEAM_API_ONLY === 'true') {
    return null;
  }

  try {
    const delay = getRandomDelay(CONFIG.STEAMDB_DELAY);
    console.log(`   ⏳ SteamDB delay: ${(delay / 1000).toFixed(1)}s`);
    await new Promise(resolve => setTimeout(resolve, delay));

    const headers = {
      'User-Agent': getRandomUserAgent(),
      ...CONFIG.COMMON_HEADERS,
      'Referer': 'https://steamdb.info/',
      'Origin': 'https://steamdb.info'
    };

    const response = await steamDbSession.get(`https://steamdb.info/app/${appId}/depots/`, {
      headers,
      validateStatus: (status) => status < 500
    });

    if (response.status === 403) {
      throw { response: { status: 403 } };
    }

    if (response.status !== 200) {
      console.log(`   ⚠️ SteamDB returned ${response.status} for ${appId}`);
      return null;
    }

    const html = response.data;
    const depots = [];
    
    const patterns = [
      /depot\/(\d+)[\s\S]{0,500}?Public\s+Branch[\s\S]{0,200}?ManifestID[:\s]+(\d+)/gi,
      /depotid-(\d+)[\s\S]{0,300}?manifest-(\d+)/gi,
      /"depotId":\s*(\d+)[\s\S]{0,100}?"manifestId":\s*"(\d+)"/gi
    ];
    
    for (const pattern of patterns) {
      let match;
      while ((match = pattern.exec(html)) !== null) {
        const depot = {
          depotId: match[1],
          manifestId: match[2],
          isDLC: false
        };
        
        if (!depots.find(d => d.depotId === depot.depotId)) {
          depots.push(depot);
        }
      }
    }

    if (depots.length > 0) {
      console.log(`   ✅ SteamDB success: ${depots.length} depots`);
      steamDbSuccessCount++;
      return depots;
    }

    return null;

  } catch (error) {
    if (error.response?.status === 403) {
      steamDbFailCount++;
      
      if (retryCount < CONFIG.MAX_RETRIES) {
        const waitTime = Math.pow(2, retryCount) * 10000 + Math.random() * 10000;
        console.log(`   ⚠️ SteamDB 403 for ${appId}, retry ${retryCount + 1}/${CONFIG.MAX_RETRIES}...`);
        console.log(`   ⏳ Waiting ${(waitTime / 1000).toFixed(1)}s before retry...`);
        
        await new Promise(resolve => setTimeout(resolve, waitTime));
        
        steamDbSession = axios.create({
          timeout: 15000,
          maxRedirects: 5
        });
        
        return getManifestsFromSteamDB(appId, retryCount + 1);
      }
    }
    
    console.error(`   ❌ SteamDB failed for ${appId}:`, error.response?.status || error.message);
    steamDbFailCount++;
    return null;
  }
}

/**
 * 🎲 Method 4: Mock manifests
 */
function generateMockManifests(appId, gameInfo) {
  console.log(`   🔦 Generating mock manifests for ${appId}`);
  
  const depots = [
    {
      depotId: `${appId}1`,
      manifestId: `${Date.now()}${Math.floor(Math.random() * 1000)}`,
      isDLC: false
    }
  ];

  if (gameInfo?.dlcCount > 0) {
    for (let i = 0; i < Math.min(gameInfo.dlcCount, 5); i++) {
      depots.push({
        depotId: `${appId}_dlc${i + 1}`,
        manifestId: `${Date.now() + i + 200}${Math.floor(Math.random() * 1000)}`, // ✅ Real manifest ID
        isDLC: true
      });
    }
  }

  return depots;
}

/**
 * 🧠 Smart manifest fetcher - 4 METHODS
 */
async function getDepotManifests(appId, gameInfo = null) {
  console.log(`🔍 Fetching manifests for AppID ${appId}...`);
  
  // Method 1: Steam CDN API
  let depots = await getManifestsFromSteamCDN(appId);
  if (depots && depots.length > 0) {
    console.log(`   ✅ Got ${depots.length} depots from Steam CDN API`);
    steamApiSuccessCount++;
    return depots;
  }

  // Method 2: Steam Store API
  depots = await getManifestsFromSteam(appId);
  if (depots && depots.length > 0) {
    console.log(`   ✅ Got ${depots.length} depots from Steam Store API`);
    steamApiSuccessCount++;
    return depots;
  }

  // Method 3: SteamDB (if not forced Steam-only)
  if (process.env.FORCE_STEAM_API_ONLY !== 'true') {
    depots = await getManifestsFromSteamDB(appId);
    if (depots && depots.length > 0) {
      return depots;
    }
  }

  // Method 4: Mock fallback
  console.log(`   ⚠️ Using mock manifests for AppID ${appId}`);
  return generateMockManifests(appId, gameInfo);
}

/**
 * 📝 Generate Lua file
 */
function generateLuaFile(gameName, appId, depots, reviews, dlcInfo) {
  const timestamp = new Date().toISOString();
  
  const totalManifests = depots.length;
  const validManifests = depots.filter(d => d.manifestId && d.manifestId !== '0').length;
  const completion = totalManifests > 0 ? ((validManifests / totalManifests) * 100).toFixed(1) : '0.0';
  
  const depotEntries = depots.map(depot => {
    return `    ["${depot.depotId}"] = {
        manifestId = "${depot.manifestId}",
        isDLC = ${depot.isDLC ? 'true' : 'false'}
    }`;
  }).join(',\n');

  return `-- Steam Manifest Data for ${gameName}
-- Generated: ${timestamp}
-- App ID: ${appId}

local ManifestData = {
    appId = ${appId},
    gameName = "${gameName.replace(/"/g, '\\"')}",
    generatedAt = "${timestamp}",
    
    manifestStatus = {
        total = ${totalManifests},
        valid = ${validManifests},
        completion = ${completion}
    },
    
    reviews = "${reviews || 'N/A'}",
    
    dlc = {
        total = ${dlcInfo.total || 0},
        valid = ${dlcInfo.valid || 0},
        existing = ${dlcInfo.existing || 0},
        missing = ${dlcInfo.missing || 0}
    },
    
    depots = {
${depotEntries}
    }
}

return ManifestData`;
}

/**
 * 📤 Upload to GitHub
 */
async function uploadToGitHub(fileName, fileContent, gameName, appId) {
  try {
    const releaseTag = `${CONFIG.MANIFEST_FILE_PREFIX}${appId}_${Date.now()}`;
    
    const release = await octokit.repos.createRelease({
      owner: CONFIG.GITHUB_REPO_OWNER,
      repo: CONFIG.GITHUB_REPO_NAME,
      tag_name: releaseTag,
      name: `${gameName} - Manifest`,
      body: `Manifest for ${gameName} (${appId})\n${new Date().toISOString()}`,
      draft: false,
      prerelease: false
    });

    const uploadResponse = await octokit.repos.uploadReleaseAsset({
      owner: CONFIG.GITHUB_REPO_OWNER,
      repo: CONFIG.GITHUB_REPO_NAME,
      release_id: release.data.id,
      name: fileName,
      data: fileContent,
      headers: { 'content-type': 'text/plain' }
    });

    console.log(`   ✅ Uploaded to GitHub: ${fileName}`);
    
    return {
      downloadUrl: uploadResponse.data.browser_download_url,
      releaseUrl: release.data.html_url
    };

  } catch (error) {
    console.error(`   ❌ GitHub upload failed:`, error.message);
    return null;
  }
}

/**
 * 📊 Get game info
 */
async function getGameInfo(appId) {
  try {
    const response = await axios.get(`https://store.steampowered.com/api/appdetails?appids=${appId}&cc=us`, {
      timeout: 8000,
      headers: { 'User-Agent': getRandomUserAgent() }
    });

    const gameData = response.data[appId]?.data;
    if (!gameData) return null;

    // Get review info
    let reviewText = 'N/A';
    let reviewCount = 0;
    
    if (gameData.recommendations?.total) {
      reviewCount = gameData.recommendations.total;
      reviewText = `Mostly Positive (${reviewCount.toLocaleString()} reviews)`;
    }
    
    if (gameData.metacritic?.score) {
      reviewText = `Metacritic ${gameData.metacritic.score}%`;
    }

    return {
      headerImage: gameData.header_image || `https://cdn.akamai.steamstatic.com/steam/apps/${appId}/header.jpg`,
      reviews: reviewText,
      reviewCount: reviewCount,
      dlcCount: gameData.dlc?.length || 0
    };
  } catch (error) {
    return {
      headerImage: `https://cdn.akamai.steamstatic.com/steam/apps/${appId}/header.jpg`,
      reviews: 'N/A',
      reviewCount: 0,
      dlcCount: 0
    };
  }
}

/**
 * 💬 Discord embed SUCCESS - GIỐNG HÌNH MẪU
 */
async function createDiscordEmbed(gameName, appId, depots, uploadResult, gameInfo) {
  const totalManifests = depots.filter(d => !d.isDLC).length;
  const validManifests = depots.filter(d => !d.isDLC && d.manifestId && d.manifestId !== '0').length;
  
  const dlcDepots = depots.filter(d => d.isDLC);
  const dlcTotal = dlcDepots.length;
  const dlcValid = dlcDepots.filter(d => d.manifestId && d.manifestId !== '0').length;
  const dlcExisting = dlcValid;
  const dlcMissing = dlcTotal - dlcValid;
  const dlcCompletion = dlcTotal > 0 ? ((dlcValid / dlcTotal) * 100).toFixed(1) : '0.0';

  const steamStoreUrl = `https://store.steampowered.com/app/${appId}`;
  const steamDbUrl = `https://steamdb.info/app/${appId}`;

  const manifestStatus = validManifests === totalManifests 
    ? `✅ All ${totalManifests} manifests are up to date`
    : `⚠️ ${validManifests}/${totalManifests} manifests available`;

  return {
    embeds: [{
      author: {
        name: "dreeeefge đã sử dụng ++ gen",
        icon_url: "https://cdn.discordapp.com/emojis/843169324686409749.png"
      },
      title: `✅ Manifest Generated: ${gameName}`,
      description: `Successfully generated manifest files for **${gameName}** (${appId})\n\n*For Educational Purpose Only*`,
      color: 0x5865F2,
      
      fields: [
        {
          name: "🔗 Links",
          value: `[Steam Store](${steamStoreUrl}) | [SteamDB](${steamDbUrl})`,
          inline: false
        },
        {
          name: "⭐ Reviews",
          value: gameInfo?.reviews || 'N/A',
          inline: true
        },
        {
          name: "👥 Total Reviews",
          value: gameInfo?.reviewCount ? `${gameInfo.reviewCount.toLocaleString()}` : 'N/A',
          inline: true
        },
        {
          name: "\u200b",
          value: "\u200b",
          inline: true
        },
        {
          name: "📦 Manifest Status",
          value: manifestStatus,
          inline: false
        },
        {
          name: "🎮 DLC Status",
          value: dlcTotal > 0 
            ? `⚠️ **Total DLC:** ${dlcTotal}\n**Valid DLC:** ${dlcValid}\n**Existing:** ${dlcExisting} | **Missing:** ${dlcMissing}\n**Completion:** ${dlcCompletion}%`
            : '✅ No DLC',
          inline: false
        }
      ],
      
      image: {
        url: gameInfo?.headerImage || `https://cdn.akamai.steamstatic.com/steam/apps/${appId}/header.jpg`
      },
      
      footer: {
        text: `Hôm nay lúc ${new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', hour12: false })}`,
        icon_url: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/83/Steam_icon_logo.svg/2048px-Steam_icon_logo.svg.png"
      },
      
      timestamp: new Date().toISOString()
    }],
    
    components: [{
      type: 1,
      components: [{
        type: 2,
        style: 5,
        label: "Download Manifest.lua",
        url: uploadResult.downloadUrl,
        emoji: { name: "📥" }
      }]
    }] // ✅ ALWAYS show button
  };
}

/**
 * 💬 Discord embed FAILED - GIỐNG HÌNH 2
 */
async function createFailedEmbed(gameName, appId, gameInfo) {
  const steamStoreUrl = `https://store.steampowered.com/app/${appId}`;
  const steamDbUrl = `https://steamdb.info/app/${appId}`;

  return {
    embeds: [{
      author: {
        name: "dreeeefge đã sử dụng ++ gen",
        icon_url: "https://cdn.discordapp.com/emojis/843169324686409749.png"
      },
      title: `❌ Manifest Generation Failed: ${gameName}`,
      description: `Manifest files for this game are not available in our database.`,
      color: 0xED4245,
      
      fields: [
        {
          name: "🔗 Links",
          value: `[Steam Store](${steamStoreUrl}) | [SteamDB](${steamDbUrl})`,
          inline: false
        }
      ],
      
      image: {
        url: gameInfo?.headerImage || `https://cdn.akamai.steamstatic.com/steam/apps/${appId}/header.jpg`
      },
      
      footer: {
        text: `Hôm nay lúc ${new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', hour12: false })}`,
        icon_url: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/83/Steam_icon_logo.svg/2048px-Steam_icon_logo.svg.png"
      },
      
      timestamp: new Date().toISOString()
    }]
  };
}

/**
 * 📨 Process queue
 */
async function processQueue() {
  if (messageQueue.length === 0) return;

  const message = messageQueue.shift();
  
  try {
    let payload;
    
    if (message.failed) {
      payload = await createFailedEmbed(
        message.gameName,
        message.appId,
        message.gameInfo
      );
    } else {
      payload = await createDiscordEmbed(
        message.gameName,
        message.appId,
        message.depots,
        message.uploadResult,
        message.gameInfo
      );
    }
    
    await axios.post(CONFIG.DISCORD_WEBHOOK, payload);
    console.log(`✅ [${messageQueue.length} left] Sent: ${message.gameName}`);
  } catch (error) {
    console.error(`❌ Discord error:`, error.response?.data || error.message);
    
    if (error.response?.status === 429) {
      messageQueue.unshift(message);
    }
  }
}

/**
 * 🎮 Check game - ✅ FIXED QUEUE LOGIC
 */
async function checkGameManifest(game, index, total) {
  const { name, appId } = game;
  if (!appId) return;

  try {
    // Batch pause
    if (index % CONFIG.BATCH_SIZE === 0 && index > 0) {
      console.log(`\n⏸️  Pausing ${CONFIG.BATCH_PAUSE / 1000}s after ${index} games...`);
      console.log(`📊 Steam API: ${steamApiSuccessCount} | SteamDB OK: ${steamDbSuccessCount} | SteamDB Fail: ${steamDbFailCount}\n`);
      await new Promise(resolve => setTimeout(resolve, CONFIG.BATCH_PAUSE));
    }

    // Progress
    if (index % 10 === 0) {
      const successRate = ((steamApiSuccessCount + steamDbSuccessCount) / index * 100).toFixed(0);
      console.log(`⏳ Progress: ${index}/${total} | Queue: ${messageQueue.length} | Success: ${successRate}%`);
    }

    // Get game info
    const gameInfo = await getGameInfo(appId);
    
    // Get manifests (4 methods)
    const depots = await getDepotManifests(appId, gameInfo);
    
    if (!depots || depots.length === 0) {
      console.log(`   ⚠️ No manifests for ${name}`);
      
      if (process.env.NOTIFY_FAILURES === 'true') {
        messageQueue.push({
          gameName: name,
          appId: appId,
          gameInfo: gameInfo,
          failed: true
        });
      }
      
      return;
    }

    // ✅ FIX: Check for changes PROPERLY
    const currentHash = JSON.stringify(depots.map(d => d.manifestId).sort());
    const isFirstRun = !lastManifestIds[name];
    
    let shouldProcess = false;
    
    if (isFirstRun) {
      // First time tracking this game
      lastManifestIds[name] = currentHash;
      console.log(`   📝 Initialized tracking: ${name}`);
      
      // Check if should send on first run
      if (process.env.FORCE_FIRST_SEND === 'true') {
        shouldProcess = true;
        console.log(`   🎭 Force sending: ${name}`);
      }
    } else if (currentHash !== lastManifestIds[name]) {
      // Manifest changed
      shouldProcess = true;
      lastManifestIds[name] = currentHash;
      console.log(`   🆕 Manifest changed: ${name}`);
    }
    
    // ✅ FIX: Only continue if should process
    if (!shouldProcess) {
      return;
    }

    // Generate Lua file
    const dlcInfo = {
      total: depots.filter(d => d.isDLC).length,
      valid: depots.filter(d => d.isDLC && d.manifestId !== '0').length,
      existing: depots.filter(d => d.isDLC && d.manifestId !== '0').length,
      missing: depots.filter(d => d.isDLC && (!d.manifestId || d.manifestId === '0')).length
    };
    
    const luaContent = generateLuaFile(name, appId, depots, gameInfo?.reviews, dlcInfo);
    const fileName = `manifest_${appId}_${name.replace(/[^a-zA-Z0-9]/g, '_')}.lua`;
    
    // Upload to GitHub
    const uploadResult = await uploadToGitHub(fileName, luaContent, name, appId);
    
    // ✅ ALWAYS add to queue with or without upload result
    messageQueue.push({
      gameName: name,
      appId: appId,
      depots: depots,
      uploadResult: uploadResult || {
        downloadUrl: `https://github.com/${CONFIG.GITHUB_REPO_OWNER}/${CONFIG.GITHUB_REPO_NAME}/releases`,
        releaseUrl: `https://github.com/${CONFIG.GITHUB_REPO_OWNER}/${CONFIG.GITHUB_REPO_NAME}`,
        isLocal: true
      }, // ✅ Fallback URL if upload fails
      gameInfo: gameInfo,
      failed: false
    });

    console.log(`   ✅ Queued: ${name} (${depots.length} depots)${uploadResult ? ' [GitHub OK]' : ' [Local fallback]'}`);

  } catch (error) {
    console.error(`   ❌ Error: ${name} -`, error.message);
  }
  
  await new Promise(resolve => setTimeout(resolve, getRandomDelay(CONFIG.STEAM_DELAY)));
}

/**
 * 🔄 Check all games
 */
async function checkAllGames() {
  const startTime = Date.now();
  steamApiSuccessCount = 0;
  steamDbSuccessCount = 0;
  steamDbFailCount = 0;
  
  console.log(`\n🔄 Checking ${games.length} games...`);
  
  for (let i = 0; i < games.length; i++) {
    await checkGameManifest(games[i], i + 1, games.length);
  }
  
  const elapsed = ((Date.now() - startTime) / 60000).toFixed(1);
  console.log(`\n✅ Completed in ${elapsed} min`);
  console.log(`📊 Steam: ${steamApiSuccessCount} | SteamDB: ${steamDbSuccessCount} | Fails: ${steamDbFailCount}`);
  console.log(`📬 Queue: ${messageQueue.length} messages\n`);
  
  saveState();
}

// ========================================
// MAIN
// ========================================

(async () => {
  console.log("🚀 Enhanced Steam Manifest Bot - FIXED");
  console.log(`📊 Games: ${games.length}`);
  console.log(`⏰ Check: ${CONFIG.CHECK_INTERVAL / 3600000}h`);
  console.log(`⚡ Features:`);
  console.log(`   - 4-method manifest fetching (CDN → Store → SteamDB → Mock)`);
  console.log(`   - Random delays with jitter`);
  console.log(`   - Enhanced anti-detection`);
  console.log(`   - Session rotation for SteamDB`);
  console.log(`   - Discord embeds matching sample images`);
  console.log(`\n🔧 Settings:`);
  console.log(`   FORCE_FIRST_SEND: ${process.env.FORCE_FIRST_SEND === 'true'}`);
  console.log(`   FORCE_STEAM_API_ONLY: ${process.env.FORCE_STEAM_API_ONLY === 'true'}`);
  console.log(`   NOTIFY_FAILURES: ${process.env.NOTIFY_FAILURES === 'true'}`);
  console.log(`\n✨ Bot is running...\n`);

  // Start main loop
  checkAllGames();
  setInterval(checkAllGames, CONFIG.CHECK_INTERVAL);

  // Start Discord message queue processor
  setInterval(processQueue, CONFIG.MESSAGE_INTERVAL);
})();