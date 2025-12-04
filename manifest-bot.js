const axios = require('axios');
const fs = require('fs');
const { Octokit } = require('@octokit/rest');
require('dotenv').config();

// ⚙️ CONFIGURATION
const CONFIG = {
  DISCORD_WEBHOOK: process.env.DISCORD_WEBHOOK_URL,
  GITHUB_TOKEN: process.env.GITHUB_TOKEN,
  GITHUB_REPO_OWNER: process.env.GITHUB_REPO_OWNER, // e.g., "yourusername"
  GITHUB_REPO_NAME: process.env.GITHUB_REPO_NAME,   // e.g., "steam-manifests"
  
  CHECK_INTERVAL: 6 * 60 * 60 * 1000,  // Check mỗi 6 giờ
  MESSAGE_INTERVAL: 3 * 60 * 1000,      // Gửi Discord mỗi 3 phút
  STEAM_DELAY: 1500,                    // 1.5s delay giữa các request
  MAX_RETRIES: 3,
  
  MANIFEST_FILE_PREFIX: 'manifest_',
  LUA_TEMPLATE_PATH: './lua_template.lua'
};

// Initialize GitHub API
const octokit = new Octokit({
  auth: CONFIG.GITHUB_TOKEN
});

let games = [];
let lastManifestIds = {};
const STATE_FILE = 'last_manifest_state.json';
const messageQueue = [];

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

/**
 * Lấy thông tin depot manifests từ SteamDB
 */
async function getDepotManifests(appId) {
  try {
    // Scrape SteamDB depots page
    const response = await axios.get(`https://steamdb.info/app/${appId}/depots/`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      timeout: 10000
    });

    const html = response.data;
    
    // Parse depot information
    const depots = [];
    
    // Regex để tìm depot ID và manifest ID
    const depotRegex = /depot\/(\d+)[\s\S]*?Public Branch[\s\S]*?ManifestID:\s*(\d+)/g;
    let match;
    
    while ((match = depotRegex.exec(html)) !== null) {
      depots.push({
        depotId: match[1],
        manifestId: match[2]
      });
    }

    // Lấy thêm thông tin DLC
    const dlcRegex = /DLC.*?(\d+).*?ManifestID:\s*(\d+)/g;
    while ((match = dlcRegex.exec(html)) !== null) {
      depots.push({
        depotId: match[1],
        manifestId: match[2],
        isDLC: true
      });
    }

    return depots;
  } catch (error) {
    console.error(`⚠️ Failed to fetch manifests for ${appId}:`, error.message);
    return null;
  }
}

/**
 * Tạo file .lua từ manifest data
 */
function generateLuaFile(gameName, appId, depots, reviews, dlcInfo) {
  const timestamp = new Date().toISOString();
  
  // Tính toán manifest status
  const totalManifests = depots.length;
  const validManifests = depots.filter(d => d.manifestId && d.manifestId !== '0').length;
  const completion = totalManifests > 0 ? ((validManifests / totalManifests) * 100).toFixed(1) : '0.0';
  
  // Tạo depot table
  const depotEntries = depots.map(depot => {
    return `    ["${depot.depotId}"] = {
        manifestId = "${depot.manifestId}",
        isDLC = ${depot.isDLC ? 'true' : 'false'}
    }`;
  }).join(',\n');

  const luaContent = `-- Steam Manifest Data for ${gameName}
-- Generated: ${timestamp}
-- App ID: ${appId}

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
    // Tạo release tag unique
    const releaseTag = `${CONFIG.MANIFEST_FILE_PREFIX}${appId}_${Date.now()}`;
    
    // Step 1: Tạo GitHub Release
    const release = await octokit.repos.createRelease({
      owner: CONFIG.GITHUB_REPO_OWNER,
      repo: CONFIG.GITHUB_REPO_NAME,
      tag_name: releaseTag,
      name: `${gameName} - Manifest`,
      body: `Manifest data for ${gameName} (App ID: ${appId})\nGenerated: ${new Date().toISOString()}`,
      draft: false,
      prerelease: false
    });

    console.log(`✅ Created GitHub release: ${releaseTag}`);

    // Step 2: Upload file as release asset
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
    
    // Fallback: Upload to file.io (temporary storage)
    try {
      const FormData = require('form-data');
      const formData = new FormData();
      formData.append('file', Buffer.from(fileContent), {
        filename: fileName,
        contentType: 'text/plain'
      });

      const fileIoResponse = await axios.post('https://file.io', formData, {
        headers: formData.getHeaders()
      });

      console.log(`✅ Fallback: Uploaded to file.io`);
      
      return {
        downloadUrl: fileIoResponse.data.link,
        releaseUrl: null
      };
    } catch (fallbackError) {
      console.error(`❌ Fallback upload also failed:`, fallbackError.message);
      return null;
    }
  }
}

/**
 * Lấy thông tin game từ Steam API
 */
async function getGameInfo(appId) {
  try {
    const response = await axios.get(`https://store.steampowered.com/api/appdetails?appids=${appId}`, {
      timeout: 8000
    });

    const gameData = response.data[appId]?.data;
    
    if (!gameData) return null;

    // Parse reviews
    let reviewText = 'N/A';
    if (gameData.metacritic?.score) {
      reviewText = `Metacritic ${gameData.metacritic.score}%`;
    }

    // Count DLC
    const dlcCount = gameData.dlc?.length || 0;

    return {
      headerImage: gameData.header_image,
      reviews: reviewText,
      reviewCount: gameData.recommendations?.total || 0,
      dlcCount: dlcCount
    };
  } catch (error) {
    return null;
  }
}

/**
 * Tạo Discord embed giống ảnh mẫu
 */
async function createDiscordEmbed(gameName, appId, depots, uploadResult, gameInfo) {
  const totalManifests = depots.length;
  const validManifests = depots.filter(d => d.manifestId && d.manifestId !== '0').length;
  const completion = totalManifests > 0 ? ((validManifests / totalManifests) * 100).toFixed(1) : '0.0';
  
  // Count DLC
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
      color: 0x5865F2, // Discord blurple color
      
      title: `✅ Manifest Generated: ${gameName}`,
      description: `Successfully generated manifest files for **${gameName}** (${appId})`,
      
      fields: [
        {
          name: "Links",
          value: `[Steam Store](${steamStoreUrl}) | [SteamDB](${steamDbUrl})`,
          inline: false
        },
        {
          name: "Reviews",
          value: gameInfo?.reviews || 'N/A',
          inline: true
        },
        {
          name: "Total Reviews",
          value: gameInfo?.reviewCount ? `${gameInfo.reviewCount.toLocaleString()}` : 'N/A',
          inline: true
        },
        {
          name: "\u200b",
          value: "\u200b",
          inline: true
        },
        {
          name: "Manifest Status",
          value: `✅ All ${validManifests} manifests are up to date`,
          inline: false
        },
        {
          name: "DLC Status",
          value: `✅ **Total DLC:** ${dlcTotal}\n**Valid DLC:** ${dlcValid}\n**Existing:** ${dlcValid} | **Missing:** ${dlcMissing}\n**Completion:** ${completion}%`,
          inline: false
        }
      ],
      
      image: gameInfo?.headerImage ? { url: gameInfo.headerImage } : undefined,
      
      footer: {
        text: `Hôm qua lúc ${new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', hour12: false })}`,
        icon_url: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/83/Steam_icon_logo.svg/2048px-Steam_icon_logo.svg.png"
      }
    }],
    
    components: uploadResult ? [{
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
    if (index % 100 === 0) {
      console.log(`⏳ Progress: ${index}/${total} | Queue: ${messageQueue.length}`);
      
      if (index % 500 === 0) {
        saveState();
        console.log(`💾 Auto-saved state at ${index} games`);
      }
    }

    // Step 1: Lấy depot manifests
    const depots = await getDepotManifests(appId);
    
    if (!depots || depots.length === 0) {
      console.log(`⚠️ No manifests found for ${name}`);
      return;
    }

    // Step 2: Check xem có thay đổi không
    const currentManifestHash = JSON.stringify(depots.map(d => d.manifestId).sort());
    
    if (!lastManifestIds[name]) {
      // Lần đầu: chỉ lưu
      lastManifestIds[name] = currentManifestHash;
      console.log(`📝 Initialized manifest tracking for ${name}`);
      return;
    }

    if (currentManifestHash === lastManifestIds[name]) {
      // Không có thay đổi
      return;
    }

    console.log(`🆕 Manifest changed for ${name}!`);

    // Step 3: Lấy thông tin game
    const gameInfo = await getGameInfo(appId);
    
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

    // Update state
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

// ========================================
// MAIN
// ========================================

(async () => {
  console.log("🚀 Steam Manifest Generator Bot");
  console.log(`📊 Monitoring: ${games.length} games`);
  console.log(`⏰ Check interval: ${CONFIG.CHECK_INTERVAL / 60 / 60 / 1000} hours`);
  console.log(`📬 Discord send interval: ${CONFIG.MESSAGE_INTERVAL / 60 / 1000} minutes\n`);

  // Worker 1: Check manifests periodically
  checkAllGames();
  setInterval(checkAllGames, CONFIG.CHECK_INTERVAL);

  // Worker 2: Send Discord messages from queue
  setInterval(processQueue, CONFIG.MESSAGE_INTERVAL);
  
  console.log("✨ Bot is running...\n");
})();