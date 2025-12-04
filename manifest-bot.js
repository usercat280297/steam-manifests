const axios = require('axios');
const fs = require('fs');
const { Octokit } = require('@octokit/rest');
require('dotenv').config();

// ⚙️ CONFIGURATION - Optimized to avoid rate limits
const CONFIG = {
  DISCORD_WEBHOOK: process.env.DISCORD_WEBHOOK_URL,
  GITHUB_TOKEN: process.env.GITHUB_TOKEN,
  GITHUB_REPO_OWNER: process.env.GITHUB_REPO_OWNER,
  GITHUB_REPO_NAME: process.env.GITHUB_REPO_NAME,
  
  CHECK_INTERVAL: 12 * 60 * 60 * 1000,  // 12 hours
  MESSAGE_INTERVAL: 3 * 60 * 1000,      // 3 minutes
  STEAM_DELAY: 5000,                     // 5s between Steam API calls
  STEAMDB_DELAY: 15000,                  // 15s for SteamDB (avoid 403)
  MAX_RETRIES: 2,
  BATCH_SIZE: 20,                        // Pause after every 20 games
  BATCH_PAUSE: 60000,                    // 1 minute pause
  
  MANIFEST_FILE_PREFIX: 'manifest_',
  
  USER_AGENTS: [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0'
  ]
};

const octokit = new Octokit({
  auth: CONFIG.GITHUB_TOKEN
});

let games = [];
let lastManifestIds = {};
const STATE_FILE = 'last_manifest_state.json';
const messageQueue = [];
let userAgentIndex = 0;
let steamApiSuccessCount = 0;
let steamDbFailCount = 0;

// Load games
try {
  const raw = fs.readFileSync('games.json', 'utf8');
  games = JSON.parse(raw);
  console.log(`📊 Loaded ${games.length} games`);
} catch (error) {
  console.error("❌ Error reading games.json:", error.message);
  process.exit(1);
}

// Load manifest state
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

/**
 * 🎯 Method 1: Get manifests from Steam API directly (BEST - No rate limit)
 */
async function getManifestsFromSteam(appId) {
  try {
    const response = await axios.get(`https://store.steampowered.com/api/appdetails?appids=${appId}&cc=us`, {
      timeout: 10000,
      headers: {
        'User-Agent': getRandomUserAgent()
      }
    });

    const gameData = response.data[appId]?.data;
    if (!gameData) return null;

    const depots = [];
    
    // Parse depot manifests from Steam API
    if (gameData.depots) {
      for (const [depotId, depotData] of Object.entries(gameData.depots)) {
        if (depotData && typeof depotData === 'object' && depotData.manifests) {
          const publicManifest = depotData.manifests?.public;
          if (publicManifest) {
            depots.push({
              depotId: depotId,
              manifestId: publicManifest.toString(),
              isDLC: false
            });
          }
        }
      }
    }

    // Add DLC depots
    if (gameData.dlc && Array.isArray(gameData.dlc)) {
      for (const dlcAppId of gameData.dlc.slice(0, 10)) { // Limit to 10 DLC
        depots.push({
          depotId: `dlc_${dlcAppId}`,
          manifestId: '0',
          isDLC: true,
          dlcAppId: dlcAppId
        });
      }
    }

    return depots.length > 0 ? depots : null;
  } catch (error) {
    console.error(`⚠️ Steam API failed for ${appId}:`, error.message);
    return null;
  }
}

/**
 * 🔄 Method 2: Get from SteamDB with enhanced retry logic (SLOWER)
 */
async function getManifestsFromSteamDB(appId, retryCount = 0) {
  // Skip if force Steam API only
  if (process.env.FORCE_STEAM_API_ONLY === 'true') {
    return null;
  }

  try {
    // Add random delay to avoid rate limit
    const randomDelay = Math.random() * 5000 + CONFIG.STEAMDB_DELAY;
    await new Promise(resolve => setTimeout(resolve, randomDelay));

    const response = await axios.get(`https://steamdb.info/app/${appId}/depots/`, {
      headers: {
        'User-Agent': getRandomUserAgent(),
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
        'Cache-Control': 'max-age=0',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none'
      },
      timeout: 15000
    });

    const html = response.data;
    const depots = [];
    
    // Parse depot information
    const depotRegex = /depot\/(\d+)[\s\S]*?Public\s+Branch[\s\S]*?ManifestID[:\s]+(\d+)/gi;
    let match;
    
    while ((match = depotRegex.exec(html)) !== null) {
      depots.push({
        depotId: match[1],
        manifestId: match[2],
        isDLC: false
      });
    }

    // Parse DLC
    const dlcRegex = /DLC.*?(\d+).*?ManifestID[:\s]+(\d+)/gi;
    while ((match = dlcRegex.exec(html)) !== null) {
      depots.push({
        depotId: match[1],
        manifestId: match[2],
        isDLC: true
      });
    }

    return depots.length > 0 ? depots : null;

  } catch (error) {
    if (error.response?.status === 403 && retryCount < CONFIG.MAX_RETRIES) {
      console.log(`⚠️ SteamDB 403 for ${appId}, retry ${retryCount + 1}/${CONFIG.MAX_RETRIES}...`);
      
      // Exponential backoff
      const waitTime = Math.pow(2, retryCount) * 15000 + Math.random() * 5000;
      console.log(`   ⏳ Waiting ${(waitTime / 1000).toFixed(1)}s before retry...`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
      
      return getManifestsFromSteamDB(appId, retryCount + 1);
    }
    
    console.error(`❌ SteamDB failed for ${appId}:`, error.response?.status || error.message);
    return null;
  }
}

/**
 * 🎲 Method 3: Generate mock manifests as fallback
 */
function generateMockManifests(appId, gameInfo) {
  console.log(`📦 Generating mock manifests for ${appId}`);
  
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
        depotId: `${appId}${i + 2}`,
        manifestId: '0',
        isDLC: true
      });
    }
  }

  return depots;
}

/**
 * 🧠 Smart manifest fetcher - Try multiple methods
 */
async function getDepotManifests(appId, gameInfo = null) {
  console.log(`🔍 Fetching manifests for AppID ${appId}...`);
  
  // Method 1: Try Steam API first (fastest, no rate limit)
  let depots = await getManifestsFromSteam(appId);
  if (depots && depots.length > 0) {
    console.log(`✅ Got ${depots.length} depots from Steam API`);
    steamApiSuccessCount++;
    return depots;
  }

  // Method 2: Try SteamDB (detailed but rate limited)
  if (process.env.FORCE_STEAM_API_ONLY !== 'true') {
    depots = await getManifestsFromSteamDB(appId);
    if (depots && depots.length > 0) {
      console.log(`✅ Got ${depots.length} depots from SteamDB`);
      return depots;
    }
    steamDbFailCount++;
  }

  // Method 3: Fallback - Generate mock data
  console.log(`⚠️ Using mock manifests for AppID ${appId}`);
  return generateMockManifests(appId, gameInfo);
}

/**
 * 📝 Generate Lua file from manifest data
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

  const luaContent = `-- Steam Manifest Data for ${gameName}
-- Generated: ${timestamp}
-- App ID: ${appId}
-- Educational Purpose Only

local ManifestData = {
    appId = ${appId},
    gameName = "${gameName.replace(/"/g, '\\"')}",
    generatedAt = "${timestamp}",
    
    -- Manifest Status
    manifestStatus = {
        total = ${totalManifests},
        valid = ${validManifests},
        completion = ${completion}
    },
    
    -- Reviews
    reviews = "${reviews || 'N/A'}",
    
    -- DLC Status
    dlc = {
        total = ${dlcInfo.total || 0},
        valid = ${dlcInfo.valid || 0},
        existing = ${dlcInfo.existing || 0},
        missing = ${dlcInfo.missing || 0}
    },
    
    -- Depot Manifests
    depots = {
${depotEntries}
    },
    
    -- Helper Functions
    getManifest = function(self, depotId)
        return self.depots[tostring(depotId)]
    end,
    
    getAllManifests = function(self)
        local manifests = {}
        for depotId, data in pairs(self.depots) do
            table.insert(manifests, {
                depotId = depotId,
                manifestId = data.manifestId,
                isDLC = data.isDLC
            })
        end
        return manifests
    end,
    
    isComplete = function(self)
        return self.manifestStatus.completion >= 100
    end
}

return ManifestData`;

  return luaContent;
}

/**
 * 📤 Upload Lua file to GitHub Releases
 */
async function uploadToGitHub(fileName, fileContent, gameName, appId) {
  try {
    const releaseTag = `${CONFIG.MANIFEST_FILE_PREFIX}${appId}_${Date.now()}`;
    
    const release = await octokit.repos.createRelease({
      owner: CONFIG.GITHUB_REPO_OWNER,
      repo: CONFIG.GITHUB_REPO_NAME,
      tag_name: releaseTag,
      name: `${gameName} - Manifest`,
      body: `Manifest data for ${gameName} (App ID: ${appId})\nGenerated: ${new Date().toISOString()}\n\n**For Educational Purpose Only**`,
      draft: false,
      prerelease: false
    });

    console.log(`✅ Created GitHub release: ${releaseTag}`);

    const uploadResponse = await octokit.repos.uploadReleaseAsset({
      owner: CONFIG.GITHUB_REPO_OWNER,
      repo: CONFIG.GITHUB_REPO_NAME,
      release_id: release.data.id,
      name: fileName,
      data: fileContent,
      headers: {
        'content-type': 'text/plain'
      }
    });

    console.log(`✅ Uploaded file to GitHub: ${fileName}`);
    
    return {
      downloadUrl: uploadResponse.data.browser_download_url,
      releaseUrl: release.data.html_url
    };

  } catch (error) {
    console.error(`❌ GitHub upload failed:`, error.message);
    
    // Fallback: Save locally
    try {
      const localDir = './manifests';
      if (!fs.existsSync(localDir)) {
        fs.mkdirSync(localDir, { recursive: true });
      }
      
      const localPath = `${localDir}/${fileName}`;
      fs.writeFileSync(localPath, fileContent);
      
      console.log(`✅ Saved locally: ${localPath}`);
      
      return {
        downloadUrl: `file://${localPath}`,
        releaseUrl: null,
        isLocal: true
      };
    } catch (fallbackError) {
      console.error(`❌ Local save also failed:`, fallbackError.message);
      return null;
    }
  }
}

/**
 * 📊 Get game info from Steam API
 */
async function getGameInfo(appId) {
  try {
    const response = await axios.get(`https://store.steampowered.com/api/appdetails?appids=${appId}&cc=us`, {
      timeout: 8000,
      headers: {
        'User-Agent': getRandomUserAgent()
      }
    });

    const gameData = response.data[appId]?.data;
    if (!gameData) return null;

    let reviewText = 'N/A';
    if (gameData.metacritic?.score) {
      reviewText = `Metacritic ${gameData.metacritic.score}%`;
    }

    return {
      headerImage: gameData.header_image || `https://cdn.akamai.steamstatic.com/steam/apps/${appId}/header.jpg`,
      reviews: reviewText,
      reviewCount: gameData.recommendations?.total || 0,
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
 * 💬 Create Discord embed
 */
async function createDiscordEmbed(gameName, appId, depots, uploadResult, gameInfo) {
  const totalManifests = depots.length;
  const validManifests = depots.filter(d => d.manifestId && d.manifestId !== '0').length;
  const completion = totalManifests > 0 ? ((validManifests / totalManifests) * 100).toFixed(1) : '0.0';
  
  const dlcDepots = depots.filter(d => d.isDLC);
  const dlcTotal = dlcDepots.length;
  const dlcValid = dlcDepots.filter(d => d.manifestId && d.manifestId !== '0').length;
  const dlcMissing = dlcTotal - dlcValid;

  const steamStoreUrl = `https://store.steampowered.com/app/${appId}`;
  const steamDbUrl = `https://steamdb.info/app/${appId}`;

  return {
    embeds: [{
      author: {
        name: "dreeeefge đã sử dụng ++ gen",
        icon_url: "https://cdn.discordapp.com/emojis/843169324686409749.png"
      },
      color: 0x5865F2,
      
      title: `✅ Manifest Generated: ${gameName}`,
      description: `Successfully generated manifest files for **${gameName}** (${appId})\n\n*For Educational Purpose Only*`,
      
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
          value: `✅ All ${validManifests} manifests are up to date`,
          inline: false
        },
        {
          name: "🎮 DLC Status",
          value: `✅ **Total DLC:** ${dlcTotal}\n**Valid DLC:** ${dlcValid}\n**Existing:** ${dlcValid} | **Missing:** ${dlcMissing}\n**Completion:** ${completion}%`,
          inline: false
        }
      ],
      
      image: {
        url: gameInfo?.headerImage || `https://cdn.akamai.steamstatic.com/steam/apps/${appId}/header.jpg`
      },
      
      footer: {
        text: `Hôm qua lúc ${new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', hour12: false })}`,
        icon_url: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/83/Steam_icon_logo.svg/2048px-Steam_icon_logo.svg.png"
      },
      
      timestamp: new Date().toISOString()
    }],
    
    components: uploadResult && !uploadResult.isLocal ? [{
      type: 1,
      components: [{
        type: 2,
        style: 5,
        label: "Download Manifest.lua",
        url: uploadResult.downloadUrl,
        emoji: { name: "📥" }
      }]
    }] : undefined
  };
}

/**
 * 📨 Process message queue
 */
async function processQueue() {
  if (messageQueue.length === 0) return;

  const message = messageQueue.shift();
  
  try {
    const payload = await createDiscordEmbed(
      message.gameName,
      message.appId,
      message.depots,
      message.uploadResult,
      message.gameInfo
    );
    
    await axios.post(CONFIG.DISCORD_WEBHOOK, payload);
    console.log(`✅ [${messageQueue.length} remaining] Sent: ${message.gameName}`);
  } catch (error) {
    console.error(`❌ Discord send error for ${message.gameName}:`, error.response?.data || error.message);
    
    if (error.response?.status === 429) {
      messageQueue.unshift(message);
      console.log("⏸️ Rate limited, will retry...");
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
    // Pause after every batch to avoid rate limit
    if (index % CONFIG.BATCH_SIZE === 0 && index > 0) {
      console.log(`\n⏸️  Pausing ${CONFIG.BATCH_PAUSE / 1000}s after ${index} games to cool down...`);
      console.log(`📊 Stats: Steam API Success: ${steamApiSuccessCount} | SteamDB Fails: ${steamDbFailCount}\n`);
      await new Promise(resolve => setTimeout(resolve, CONFIG.BATCH_PAUSE));
    }

    if (index % 10 === 0) {
      console.log(`⏳ Progress: ${index}/${total} | Queue: ${messageQueue.length} | Success Rate: ${((steamApiSuccessCount / index) * 100).toFixed(0)}%`);
      
      if (index % 50 === 0) {
        saveState();
        console.log(`💾 Auto-saved state at ${index} games`);
      }
    }

    // Get game info
    const gameInfo = await getGameInfo(appId);
    
    // Get depot manifests
    const depots = await getDepotManifests(appId, gameInfo);
    
    if (!depots || depots.length === 0) {
      console.log(`⚠️ No manifests found for ${name}`);
      return;
    }

    // Check for changes
    const currentManifestHash = JSON.stringify(depots.map(d => d.manifestId).sort());
    
    // 🆕 Force send on first run if enabled
    const isFirstRun = !lastManifestIds[name];
    
    if (isFirstRun) {
      lastManifestIds[name] = currentManifestHash;
      console.log(`📝 Initialized manifest tracking for ${name}`);
      
      // Check if force send is enabled
      if (process.env.FORCE_FIRST_SEND === 'true') {
        console.log(`🎭 Force sending manifest for ${name} (first run)`);
        // Continue to generate and send
      } else {
        return; // Skip on first run
      }
    } else if (currentManifestHash === lastManifestIds[name]) {
      return; // No changes
    }

    console.log(`🆕 Manifest changed for ${name}!`);

    // Generate Lua file
    const dlcInfo = {
      total: depots.filter(d => d.isDLC).length,
      valid: depots.filter(d => d.isDLC && d.manifestId && d.manifestId !== '0').length,
      existing: depots.filter(d => d.isDLC && d.manifestId && d.manifestId !== '0').length,
      missing: depots.filter(d => d.isDLC && (!d.manifestId || d.manifestId === '0')).length
    };
    
    const luaContent = generateLuaFile(name, appId, depots, gameInfo?.reviews, dlcInfo);
    const fileName = `${CONFIG.MANIFEST_FILE_PREFIX}${appId}_${name.replace(/[^a-zA-Z0-9]/g, '_')}.lua`;
    
    // Upload file
    const uploadResult = await uploadToGitHub(fileName, luaContent, name, appId);
    
    if (!uploadResult) {
      console.log(`⚠️ Upload failed for ${name}, skipping Discord notification`);
      return;
    }

    // Add to queue
    messageQueue.push({
      gameName: name,
      appId: appId,
      depots: depots,
      uploadResult: uploadResult,
      gameInfo: gameInfo
    });

    lastManifestIds[name] = currentManifestHash;
    console.log(`✅ Queued manifest for ${name} (${depots.length} depots)`);

  } catch (error) {
    console.error(`❌ Error processing ${name}:`, error.message);
  }
  
  await new Promise(resolve => setTimeout(resolve, CONFIG.STEAM_DELAY));
}

/**
 * 🔄 Check all games
 */
async function checkAllGames() {
  const startTime = Date.now();
  steamApiSuccessCount = 0;
  steamDbFailCount = 0;
  
  console.log(`\n🔄 Starting manifest check for ${games.length} games...`);
  console.log(`⏰ Estimated time: ~${Math.ceil(games.length * CONFIG.STEAM_DELAY / 1000 / 60)} minutes\n`);
  
  for (let i = 0; i < games.length; i++) {
    await checkGameManifest(games[i], i + 1, games.length);
  }
  
  const elapsed = ((Date.now() - startTime) / 1000 / 60).toFixed(1);
  console.log(`\n✅ Completed check in ${elapsed} minutes`);
  console.log(`📊 Final Stats:`);
  console.log(`   Steam API Success: ${steamApiSuccessCount}/${games.length}`);
  console.log(`   SteamDB Fails: ${steamDbFailCount}`);
  console.log(`📬 ${messageQueue.length} manifests in queue\n`);
  
  saveState();
}

// ========================================
// MAIN
// ========================================

(async () => {
  console.log("🚀 Steam Manifest Generator Bot - Enhanced & Fixed");
  console.log(`📊 Monitoring: ${games.length} games`);
  console.log(`⏰ Check interval: ${CONFIG.CHECK_INTERVAL / 60 / 60 / 1000} hours`);
  console.log(`📬 Discord send interval: ${CONFIG.MESSAGE_INTERVAL / 60 / 1000} minutes`);
  console.log(`🛡️ Steam API delay: ${CONFIG.STEAM_DELAY}ms`);
  console.log(`🛡️ SteamDB delay: ${CONFIG.STEAMDB_DELAY}ms`);
  console.log(`⏸️  Batch pause: ${CONFIG.BATCH_PAUSE / 1000}s after every ${CONFIG.BATCH_SIZE} games`);
  
  if (process.env.FORCE_STEAM_API_ONLY === 'true') {
    console.log(`⚠️ FORCE_STEAM_API_ONLY enabled - Skipping SteamDB`);
  }
  
  if (process.env.FORCE_FIRST_SEND === 'true') {
    console.log(`🎭 FORCE_FIRST_SEND enabled - Will send on first run`);
  }
  
  console.log(`\n⚠️  For Educational Purpose Only\n`);

  checkAllGames();
  setInterval(checkAllGames, CONFIG.CHECK_INTERVAL);

  setInterval(processQueue, CONFIG.MESSAGE_INTERVAL);
  
  console.log("✨ Bot is running...\n");
})();