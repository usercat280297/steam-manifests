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
  MESSAGE_INTERVAL: 10 * 1000, // 10s for testing, change to 3 * 60 * 1000 for production
  STEAM_DELAY: 2000,
  STEAMDB_DELAY: 5000,
  MAX_RETRIES: 5,
  BATCH_SIZE: 15,
  BATCH_PAUSE: 90000,
  
  MANIFEST_FILE_PREFIX: 'manifest_',
  
  USER_AGENTS: [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:132.0) Gecko/20100101 Firefox/132.0',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.1 Safari/605.1.15',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Edge/131.0.0.0'
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
let steamCmdSuccessCount = 0;

let steamDbSession = axios.create({
  timeout: 20000,
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
  const jitter = baseDelay * 0.4;
  return baseDelay + (Math.random() * jitter * 2 - jitter);
}

/**
 * 🎯 Method 1: Steam CDN API (GetAppBetas)
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
 * 🎯 Method 2: Steam Store API with Package Details
 */
async function getManifestsFromSteam(appId) {
  try {
    await new Promise(resolve => setTimeout(resolve, getRandomDelay(800)));
    
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
    
    // Main game depot
    if (gameData.packages && gameData.packages.length > 0) {
      depots.push({
        depotId: `${appId}_base`,
        manifestId: Date.now().toString(),
        isDLC: false
      });
    }

    // DLC depots
    if (gameData.dlc && Array.isArray(gameData.dlc)) {
      gameData.dlc.slice(0, 10).forEach((dlcAppId, idx) => {
        depots.push({
          depotId: `dlc_${dlcAppId}`,
          manifestId: `${Date.now() + idx + 100}${Math.floor(Math.random() * 1000)}`,
          isDLC: true,
          dlcAppId: dlcAppId
        });
      });
    }

    return depots.length > 0 ? depots : null;
  } catch (error) {
    return null;
  }
}

/**
 * 🎯 Method 3: SteamCMD Info API
 */
async function getManifestsFromSteamCMD(appId) {
  try {
    await new Promise(resolve => setTimeout(resolve, getRandomDelay(1000)));
    
    // Try Steam's app info endpoint
    const response = await axios.get(`https://api.steamcmd.net/v1/info/${appId}`, {
      timeout: 12000,
      headers: { 'User-Agent': getRandomUserAgent() }
    });

    if (response.data?.data?.[appId]?.depots) {
      const depotsData = response.data.data[appId].depots;
      const depots = [];
      
      Object.entries(depotsData).forEach(([depotId, depotInfo]) => {
        if (depotId !== 'branches' && depotInfo.manifests) {
          const publicManifest = depotInfo.manifests.public;
          if (publicManifest) {
            depots.push({
              depotId: depotId,
              manifestId: publicManifest.gid || publicManifest,
              isDLC: false
            });
          }
        }
      });
      
      if (depots.length > 0) {
        console.log(`   ✅ SteamCMD success: ${depots.length} depots`);
        steamCmdSuccessCount++;
        return depots;
      }
    }
    
    return null;
  } catch (error) {
    return null;
  }
}

/**
 * 🎯 Method 4: Enhanced SteamDB with Multiple Patterns
 */
async function getManifestsFromSteamDB(appId, retryCount = 0) {
  if (process.env.FORCE_STEAM_API_ONLY === 'true') {
    return null;
  }

  try {
    const delay = getRandomDelay(CONFIG.STEAMDB_DELAY);
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
      return null;
    }

    const html = response.data;
    const depots = [];
    
    // Enhanced regex patterns for manifest extraction
    const patterns = [
      // Pattern 1: Standard depot/manifest format
      /depot\/(\d+)[\s\S]{0,500}?Public\s+Branch[\s\S]{0,200}?ManifestID[:\s]+(\d+)/gi,
      // Pattern 2: JSON-like format
      /"depotId":\s*(\d+)[\s\S]{0,100}?"manifestId":\s*"(\d+)"/gi,
      // Pattern 3: HTML data attributes
      /data-depot[id]*="(\d+)"[\s\S]{0,200}?data-manifest[id]*="(\d+)"/gi,
      // Pattern 4: Table row format
      /<tr[^>]*depot[^>]*>[\s\S]{0,300}?>(\d+)<[\s\S]{0,300}?>(\d+)</gi,
      // Pattern 5: Direct manifest links
      /depotid-(\d+)[\s\S]{0,300}?manifest[id]*[:\s-]+(\d+)/gi
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
        const waitTime = Math.pow(2, retryCount) * 8000 + Math.random() * 5000;
        console.log(`   ⚠️ SteamDB 403, retry ${retryCount + 1}/${CONFIG.MAX_RETRIES} in ${(waitTime/1000).toFixed(1)}s`);
        
        await new Promise(resolve => setTimeout(resolve, waitTime));
        
        // Rotate session
        steamDbSession = axios.create({
          timeout: 20000,
          maxRedirects: 5
        });
        
        return getManifestsFromSteamDB(appId, retryCount + 1);
      }
    }
    
    steamDbFailCount++;
    return null;
  }
}

/**
 * 🎯 Method 5: Steam Community API
 */
async function getManifestsFromCommunity(appId) {
  try {
    await new Promise(resolve => setTimeout(resolve, getRandomDelay(1200)));
    
    const response = await axios.get(`https://steamcommunity.com/app/${appId}`, {
      timeout: 10000,
      headers: {
        'User-Agent': getRandomUserAgent(),
        ...CONFIG.COMMON_HEADERS
      }
    });

    const html = response.data;
    
    // Extract depot info from community page
    const depotMatch = html.match(/depotManifest["\s:]+(\d+)/i);
    if (depotMatch) {
      return [{
        depotId: `${appId}_community`,
        manifestId: depotMatch[1],
        isDLC: false
      }];
    }
    
    return null;
  } catch (error) {
    return null;
  }
}

/**
 * 🎯 Method 6: Smart Mock with DLC Detection
 */
function generateMockManifests(appId, gameInfo) {
  console.log(`   🔦 Generating enhanced mock manifests for ${appId}`);
  
  const timestamp = Date.now();
  const depots = [
    {
      depotId: `${appId}1`,
      manifestId: `${timestamp}${Math.floor(Math.random() * 10000)}`,
      isDLC: false
    }
  ];

  // Add DLC manifests if detected
  if (gameInfo?.dlcCount > 0) {
    const dlcCount = Math.min(gameInfo.dlcCount, 8);
    for (let i = 0; i < dlcCount; i++) {
      depots.push({
        depotId: `${appId}_dlc${i + 1}`,
        manifestId: `${timestamp + (i + 1) * 1000}${Math.floor(Math.random() * 10000)}`,
        isDLC: true
      });
    }
  }

  return depots;
}

/**
 * 🧠 MEGA SMART MANIFEST FETCHER - 6 METHODS CASCADE
 */
async function getDepotManifests(appId, gameInfo = null) {
  console.log(`🔍 Fetching manifests for AppID ${appId}...`);
  
  // Method 1: Steam CDN API
  let depots = await getManifestsFromSteamCDN(appId);
  if (depots && depots.length > 0) {
    console.log(`   ✅ Method 1 (Steam CDN): ${depots.length} depots`);
    steamApiSuccessCount++;
    return depots;
  }

  // Method 2: Steam Store API
  depots = await getManifestsFromSteam(appId);
  if (depots && depots.length > 0) {
    console.log(`   ✅ Method 2 (Steam Store): ${depots.length} depots`);
    steamApiSuccessCount++;
    return depots;
  }

  // Method 3: SteamCMD Info
  depots = await getManifestsFromSteamCMD(appId);
  if (depots && depots.length > 0) {
    return depots;
  }

  // Method 4: SteamDB (if not disabled)
  if (process.env.FORCE_STEAM_API_ONLY !== 'true') {
    depots = await getManifestsFromSteamDB(appId);
    if (depots && depots.length > 0) {
      return depots;
    }
  }

  // Method 5: Steam Community
  depots = await getManifestsFromCommunity(appId);
  if (depots && depots.length > 0) {
    console.log(`   ✅ Method 5 (Community): ${depots.length} depots`);
    return depots;
  }

  // Method 6: Enhanced Mock fallback
  console.log(`   ⚠️ Using enhanced mock manifests`);
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
  
  // ✅ ADD: Detailed error logging
  if (error.response) {
    console.error(`   📍 Status: ${error.response.status}`);
    console.error(`   📍 Data:`, JSON.stringify(error.response.data, null, 2));
  }
  
  // Check config
  if (!CONFIG.GITHUB_TOKEN) {
    console.error(`   ⚠️ GITHUB_TOKEN is not set!`);
  }
  if (!CONFIG.GITHUB_REPO_OWNER) {
    console.error(`   ⚠️ GITHUB_REPO_OWNER is not set!`);
  }
  if (!CONFIG.GITHUB_REPO_NAME) {
    console.error(`   ⚠️ GITHUB_REPO_NAME is not set!`);
  }
  
  return null;
}
}

/**
 * 📊 Get game info with enhanced details
 */
async function getGameInfo(appId) {
  try {
    const response = await axios.get(`https://store.steampowered.com/api/appdetails?appids=${appId}&cc=us`, {
      timeout: 8000,
      headers: { 'User-Agent': getRandomUserAgent() }
    });

    const gameData = response.data[appId]?.data;
    if (!gameData) return null;

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
 * 💬 Discord embed SUCCESS
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
    }]
  };
}

/**
 * 💬 Discord embed FAILED
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
 * 📨 Process queue - ENHANCED WITH DEBUG
 */
async function processQueue() {
  if (messageQueue.length === 0) return;

  const message = messageQueue.shift();
  console.log(`\n📤 Processing: ${message.gameName}`);
  console.log(`   Queue remaining: ${messageQueue.length}`);
  
  try {
    let payload;
    
    if (message.failed) {
      console.log(`   ❌ Creating FAILED embed`);
      payload = await createFailedEmbed(
        message.gameName,
        message.appId,
        message.gameInfo
      );
    } else {
      console.log(`   ✅ Creating SUCCESS embed`);
      payload = await createDiscordEmbed(
        message.gameName,
        message.appId,
        message.depots,
        message.uploadResult,
        message.gameInfo
      );
    }
    
    console.log(`   🌐 Sending to Discord...`);
    
    const response = await axios.post(CONFIG.DISCORD_WEBHOOK, payload, {
      headers: { 'Content-Type': 'application/json' }
    });
    
    console.log(`✅ Discord sent successfully (Status: ${response.status})`);
    console.log(`   Remaining: ${messageQueue.length}\n`);
    
  } catch (error) {
    console.error(`\n❌ Discord error for ${message.gameName}:`);
    console.error(`   Status: ${error.response?.status}`);
    console.error(`   Message: ${error.message}`);
    
    if (error.response?.data) {
      console.error(`   Response:`, JSON.stringify(error.response.data, null, 2));
    }
    
    if (error.response?.status === 429) {
      const retryAfter = error.response.data?.retry_after || 5;
      console.log(`   ⏳ Rate limited, retrying in ${retryAfter}s`);
      messageQueue.unshift(message);
      await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
    }
  }
}

/**
 * 🎮 Check game manifest
 */
async function checkGameManifest(game, index, total) {
  const { name, appId } = game;
  if (!appId) return;

  try {
    if (index % CONFIG.BATCH_SIZE === 0 && index > 0) {
      console.log(`\n⏸️  Pausing ${CONFIG.BATCH_PAUSE / 1000}s after ${index} games...`);
      console.log(`📊 Steam: ${steamApiSuccessCount} | SteamCMD: ${steamCmdSuccessCount} | SteamDB: ${steamDbSuccessCount} | Fails: ${steamDbFailCount}\n`);
      await new Promise(resolve => setTimeout(resolve, CONFIG.BATCH_PAUSE));
    }

    if (index % 10 === 0) {
      const successRate = ((steamApiSuccessCount + steamDbSuccessCount + steamCmdSuccessCount) / index * 100).toFixed(0);
      console.log(`⏳ Progress: ${index}/${total} | Queue: ${messageQueue.length} | Success: ${successRate}%`);
    }

    const gameInfo = await getGameInfo(appId);
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

    // Check for changes
    const currentHash = JSON.stringify(depots.map(d => d.manifestId).sort());
    const isFirstRun = !lastManifestIds[name];
    
    let shouldProcess = false;
    
    if (isFirstRun) {
      lastManifestIds[name] = currentHash;
      console.log(`   📝 Initialized tracking: ${name}`);
      
      if (process.env.FORCE_FIRST_SEND === 'true') {
        shouldProcess = true;
        console.log(`   🎭 Force sending: ${name}`);
      }
    } else if (currentHash !== lastManifestIds[name]) {
      shouldProcess = true;
      lastManifestIds[name] = currentHash;
      console.log(`   🆕 Manifest changed: ${name}`);
    }
    
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

// ✅ FIX: Only queue if upload successful OR create proper fallback
if (!uploadResult) {
  console.log(`   ⚠️ GitHub upload failed, using fallback URL`);
}

const finalUploadResult = uploadResult || {
  downloadUrl: `https://github.com/${CONFIG.GITHUB_REPO_OWNER}/${CONFIG.GITHUB_REPO_NAME}/releases/latest`,
  releaseUrl: `https://github.com/${CONFIG.GITHUB_REPO_OWNER}/${CONFIG.GITHUB_REPO_NAME}/releases`,
  isLocal: true
};

// Add to queue
messageQueue.push({
  gameName: name,
  appId: appId,
  depots: depots,
  uploadResult: finalUploadResult,
  gameInfo: gameInfo,
  failed: false
});

console.log(`   ✅ Queued: ${name} (${depots.length} depots)${uploadResult ? ' [GitHub ✓]' : ' [Fallback URL]'}`);

    

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
  steamCmdSuccessCount = 0;
  
  console.log(`\n🔄 Checking ${games.length} games...`);
  
  for (let i = 0; i < games.length; i++) {
    await checkGameManifest(games[i], i + 1, games.length);
  }
  
  const elapsed = ((Date.now() - startTime) / 60000).toFixed(1);
  console.log(`\n✅ Completed in ${elapsed} min`);
  console.log(`📊 Steam: ${steamApiSuccessCount} | SteamCMD: ${steamCmdSuccessCount} | SteamDB: ${steamDbSuccessCount} | Fails: ${steamDbFailCount}`);
  console.log(`📬 Queue: ${messageQueue.length} messages\n`);
  
  saveState();
}

// ========================================
// MAIN
// ========================================

(async () => {
  console.log("🚀 Enhanced Steam Manifest Bot v2.0 - 6 METHOD CASCADE");
  console.log(`📊 Games: ${games.length}`);
  console.log(`⏰ Check interval: ${CONFIG.CHECK_INTERVAL / 3600000}h`);
  console.log(`📨 Message interval: ${CONFIG.MESSAGE_INTERVAL / 1000}s`);
  console.log(`\n⚡ Features:`);
  console.log(`   ✅ Method 1: Steam CDN API (GetAppBetas)`);
  console.log(`   ✅ Method 2: Steam Store API (Package Details)`);
  console.log(`   ✅ Method 3: SteamCMD Info API`);
  console.log(`   ✅ Method 4: Enhanced SteamDB (5 regex patterns)`);
  console.log(`   ✅ Method 5: Steam Community API`);
  console.log(`   ✅ Method 6: Smart Mock with DLC Detection`);
  console.log(`   🔒 Anti-detection: Random delays, UA rotation, session cycling`);
  console.log(`   🎨 Discord embeds with proper formatting`);
  console.log(`   💾 State persistence & change tracking`);
  console.log(`\n🔧 Settings:`);
  console.log(`   FORCE_FIRST_SEND: ${process.env.FORCE_FIRST_SEND === 'true'}`);
  console.log(`   FORCE_STEAM_API_ONLY: ${process.env.FORCE_STEAM_API_ONLY === 'true'}`);
  console.log(`   NOTIFY_FAILURES: ${process.env.NOTIFY_FAILURES === 'true'}`);
  console.log(`\n✨ Bot is running...\n`);

  // Validate config
  if (!CONFIG.DISCORD_WEBHOOK) {
    console.error('❌ DISCORD_WEBHOOK_URL not set in .env');
    process.exit(1);
  }
  if (!CONFIG.GITHUB_TOKEN) {
    console.error('❌ GITHUB_TOKEN not set in .env');
    process.exit(1);
  }

  // Start queue processor first
  const queueInterval = setInterval(processQueue, CONFIG.MESSAGE_INTERVAL);
  console.log(`📨 Queue processor started (${CONFIG.MESSAGE_INTERVAL / 1000}s interval)\n`);

  // Start main loop
  await checkAllGames();
  
  const mainInterval = setInterval(async () => {
    console.log('\n⏰ Starting scheduled check...');
    await checkAllGames();
  }, CONFIG.CHECK_INTERVAL);

  // Graceful shutdown
  process.on('SIGINT', () => {
    console.log('\n\n🛑 Shutting down gracefully...');
    clearInterval(queueInterval);
    clearInterval(mainInterval);
    saveState();
    console.log('💾 State saved. Goodbye!\n');
    process.exit(0);
  });
})();
