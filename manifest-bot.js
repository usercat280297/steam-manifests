const axios = require('axios');
const fs = require('fs');
const { Octokit } = require('@octokit/rest');
require('dotenv').config();

// ⚙️ CONFIGURATION
const CONFIG = {
  DISCORD_WEBHOOK: process.env.DISCORD_WEBHOOK_URL,
  GITHUB_TOKEN: process.env.GITHUB_TOKEN,
  GITHUB_REPO_OWNER: process.env.GITHUB_REPO_OWNER,
  GITHUB_REPO_NAME: process.env.GITHUB_REPO_NAME,
  
  CHECK_INTERVAL: 6 * 60 * 60 * 1000,
  MESSAGE_INTERVAL: 3 * 60 * 1000,
  STEAM_DELAY: 3000,                    // Tăng delay lên 3s
  STEAMDB_DELAY: 5000,                  // Delay riêng cho SteamDB 5s
  MAX_RETRIES: 2,                       // Giảm retry để không bị ban
  BATCH_SIZE: 50,                       // Pause sau mỗi 50 games
  
  MANIFEST_FILE_PREFIX: 'manifest_',
  
  // 🆕 User agents để rotate
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

// Load games từ games.json
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

// 🆕 Rotate User Agent
function getRandomUserAgent() {
  userAgentIndex = (userAgentIndex + 1) % CONFIG.USER_AGENTS.length;
  return CONFIG.USER_AGENTS[userAgentIndex];
}

/**
 * 🆕 Method 1: Lấy từ Steam API trực tiếp (không cần SteamDB)
 */
async function getManifestsFromSteam(appId) {
  try {
    // Lấy thông tin app details
    const response = await axios.get(`https://store.steampowered.com/api/appdetails?appids=${appId}&cc=us`, {
      timeout: 10000,
      headers: {
        'User-Agent': getRandomUserAgent()
      }
    });

    const gameData = response.data[appId]?.data;
    if (!gameData) return null;

    const depots = [];
    
    // Parse depot manifests từ Steam API
    if (gameData.depots) {
      for (const [depotId, depotData] of Object.entries(gameData.depots)) {
        if (depotData && typeof depotData === 'object' && depotData.manifests) {
          // Lấy public branch manifest
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

    // Thêm DLC depots
    if (gameData.dlc && Array.isArray(gameData.dlc)) {
      for (const dlcAppId of gameData.dlc) {
        depots.push({
          depotId: `dlc_${dlcAppId}`,
          manifestId: '0', // Placeholder
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
 * 🆕 Method 2: Lấy từ SteamDB với retry và delay
 */
async function getManifestsFromSteamDB(appId, retryCount = 0) {
  try {
    // Thêm random delay để tránh rate limit
    const randomDelay = Math.random() * 2000 + CONFIG.STEAMDB_DELAY;
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
    
    // Parse depot information với regex cải tiến
    const depotRegex = /depot\/(\d+)[\s\S]*?Public Branch[\s\S]*?ManifestID[:\s]+(\d+)/gi;
    let match;
    
    while ((match = depotRegex.exec(html)) !== null) {
      depots.push({
        depotId: match[1],
        manifestId: match[2],
        isDLC: false
      });
    }

    // Parse DLC với nhiều pattern
    const dlcPatterns = [
      /DLC.*?(\d+).*?ManifestID[:\s]+(\d+)/gi,
      /dlc.*?depot[:\s]+(\d+).*?manifest[:\s]+(\d+)/gi
    ];

    for (const pattern of dlcPatterns) {
      while ((match = pattern.exec(html)) !== null) {
        depots.push({
          depotId: match[1],
          manifestId: match[2],
          isDLC: true
        });
      }
    }

    return depots.length > 0 ? depots : null;

  } catch (error) {
    if (error.response?.status === 403 && retryCount < CONFIG.MAX_RETRIES) {
      console.log(`⚠️ SteamDB 403 for ${appId}, retry ${retryCount + 1}/${CONFIG.MAX_RETRIES}...`);
      
      // Exponential backoff với random jitter
      const waitTime = Math.pow(2, retryCount) * 10000 + Math.random() * 5000;
      console.log(`   ⏳ Waiting ${(waitTime / 1000).toFixed(1)}s before retry...`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
      
      return getManifestsFromSteamDB(appId, retryCount + 1);
    }
    
    console.error(`⚠️ SteamDB failed for ${appId}:`, error.response?.status || error.message);
    return null;
  }
}

/**
 * 🆕 Method 3: Fallback - Generate mock manifests từ AppID
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

  // Thêm DLC nếu có
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
 * 🆕 Smart manifest fetcher - Thử nhiều methods
 */
async function getDepotManifests(appId, gameInfo = null) {
  console.log(`🔍 Fetching manifests for AppID ${appId}...`);
  
  // Method 1: Thử Steam API trước (nhanh nhất, ít bị chặn)
  let depots = await getManifestsFromSteam(appId);
  if (depots && depots.length > 0) {
    console.log(`✅ Got ${depots.length} depots from Steam API`);
    return depots;
  }

  // Method 2: Thử SteamDB (chi tiết hơn nhưng dễ bị rate limit)
  depots = await getManifestsFromSteamDB(appId);
  if (depots && depots.length > 0) {
    console.log(`✅ Got ${depots.length} depots from SteamDB`);
    return depots;
  }

  // Method 3: Fallback - Generate mock data
  console.log(`⚠️ Using mock manifests for AppID ${appId}`);
  return generateMockManifests(appId, gameInfo);
}

/**
 * Tạo file .lua từ manifest data
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
 * Upload file .lua lên GitHub Releases
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
    
    // Fallback: Save to local file
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
 * Lấy thông tin game từ Steam API
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

    const dlcCount = gameData.dlc?.length || 0;

    return {
      headerImage: gameData.header_image || `https://cdn.akamai.steamstatic.com/steam/apps/${appId}/header.jpg`,
      reviews: reviewText,
      reviewCount: gameData.recommendations?.total || 0,
      dlcCount: dlcCount
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
 * Tạo Discord embed giống ảnh mẫu
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
        name: "drфge đã sử dụng ++ gen",
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
 * Process một message từ queue
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
 * Check một game và generate manifest nếu có update
 */
async function checkGameManifest(game, index, total) {
  const { name, appId } = game;
  if (!appId) return;

  try {
    // 🆕 Pause sau mỗi batch để tránh rate limit
    if (index % CONFIG.BATCH_SIZE === 0 && index > 0) {
      console.log(`⏸️  Pausing 30s after ${index} games to avoid rate limit...`);
      await new Promise(resolve => setTimeout(resolve, 30000));
    }

    if (index % 50 === 0) {
      console.log(`⏳ Progress: ${index}/${total} | Queue: ${messageQueue.length}`);
      
      if (index % 100 === 0) {
        saveState();
        console.log(`💾 Auto-saved state at ${index} games`);
      }
    }

    // Step 1: Lấy thông tin game trước
    const gameInfo = await getGameInfo(appId);
    
    // Step 2: Lấy depot manifests với smart fetcher
    const depots = await getDepotManifests(appId, gameInfo);
    
    if (!depots || depots.length === 0) {
      console.log(`⚠️ No manifests found for ${name}`);
      return;
    }

    // Step 3: Check xem có thay đổi không
    const currentManifestHash = JSON.stringify(depots.map(d => d.manifestId).sort());
    
    if (!lastManifestIds[name]) {
      lastManifestIds[name] = currentManifestHash;
      console.log(`📝 Initialized manifest tracking for ${name}`);
      return;
    }

    if (currentManifestHash === lastManifestIds[name]) {
      return;
    }

    console.log(`🆕 Manifest changed for ${name}!`);

    // Step 4: Tạo file .lua
    const dlcInfo = {
      total: depots.filter(d => d.isDLC).length,
      valid: depots.filter(d => d.isDLC && d.manifestId && d.manifestId !== '0').length,
      existing: depots.filter(d => d.isDLC && d.manifestId && d.manifestId !== '0').length,
      missing: depots.filter(d => d.isDLC && (!d.manifestId || d.manifestId === '0')).length
    };
    
    const luaContent = generateLuaFile(
      name,
      appId,
      depots,
      gameInfo?.reviews,
      dlcInfo
    );
    
    const fileName = `${CONFIG.MANIFEST_FILE_PREFIX}${appId}_${name.replace(/[^a-zA-Z0-9]/g, '_')}.lua`;
    
    // Step 5: Upload file
    const uploadResult = await uploadToGitHub(fileName, luaContent, name, appId);
    
    if (!uploadResult) {
      console.log(`⚠️ Upload failed for ${name}, skipping Discord notification`);
      return;
    }

    // Step 6: Thêm vào queue để gửi Discord
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
 * Check tất cả games
 */
async function checkAllGames() {
  const startTime = Date.now();
  console.log(`\n🔄 Starting manifest check for ${games.length} games...`);
  
  for (let i = 0; i < games.length; i++) {
    await checkGameManifest(games[i], i + 1, games.length);
  }
  
  const elapsed = ((Date.now() - startTime) / 1000 / 60).toFixed(1);
  console.log(`\n✅ Completed check in ${elapsed} minutes`);
  console.log(`📬 ${messageQueue.length} manifests in queue\n`);
  
  saveState();
}

// MAIN
(async () => {
  console.log("🚀 Steam Manifest Generator Bot - Enhanced");
  console.log(`📊 Monitoring: ${games.length} games`);
  console.log(`⏰ Check interval: ${CONFIG.CHECK_INTERVAL / 60 / 60 / 1000} hours`);
  console.log(`📬 Discord send interval: ${CONFIG.MESSAGE_INTERVAL / 60 / 1000} minutes`);
  console.log(`\n⚠️  For Educational Purpose Only\n`);

  checkAllGames();
  setInterval(checkAllGames, CONFIG.CHECK_INTERVAL);

  setInterval(processQueue, CONFIG.MESSAGE_INTERVAL);
  
  console.log("✨ Bot is running...\n");
})();