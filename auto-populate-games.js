const axios = require('axios');
const fs = require('fs');
const cheerio = require('cheerio'); // npm install cheerio

/**
 * 🎮 Auto-populate games.json from multiple sources
 * 
 * Sources:
 * 1. SteamDB Top Games
 * 2. Steam Top Sellers
 * 3. Steam Charts
 * 4. Manual AppID list
 */

const CONFIG = {
  SOURCES: {
    STEAMDB_CHART: true,      // Top 100 games by players
    STEAM_TOP_SELLERS: true,   // Steam's top sellers
    STEAM_CHARTS: true,        // SteamCharts.com top games
    MANUAL_APPIDS: true        // Your custom list
  },
  
  MAX_GAMES: 500,              // Maximum games to add
  DELAY: 2000,                 // Delay between requests (ms)
  
  USER_AGENT: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'
};

// Existing games to avoid duplicates
let existingGames = [];
try {
  const raw = fs.readFileSync('games.json', 'utf8');
  existingGames = JSON.parse(raw);
  console.log(`📂 Loaded ${existingGames.length} existing games`);
} catch (error) {
  console.log("📝 Starting with empty games.json");
  existingGames = [];
}

const existingAppIds = new Set(existingGames.map(g => g.appId));
const newGames = [];

/**
 * 🔍 Method 1: Get top games from SteamDB Charts
 */
async function getFromSteamDBChart() {
  console.log("\n🔍 Fetching from SteamDB Charts...");
  
  try {
    const response = await axios.get('https://steamdb.info/charts/', {
      headers: { 'User-Agent': CONFIG.USER_AGENT },
      timeout: 15000
    });
    
    const $ = cheerio.load(response.data);
    const games = [];
    
    // Parse table rows
    $('table tbody tr').each((i, row) => {
      if (i >= CONFIG.MAX_GAMES) return false;
      
      const $row = $(row);
      const appId = $row.find('td').eq(2).find('a').attr('href')?.match(/\/app\/(\d+)/)?.[1];
      const name = $row.find('td').eq(2).find('a').text().trim();
      
      if (appId && name && !existingAppIds.has(parseInt(appId))) {
        games.push({
          name: name,
          appId: parseInt(appId)
        });
        existingAppIds.add(parseInt(appId));
      }
    });
    
    
    console.log(`✅ Found ${games.length} new games from SteamDB Charts`);
    return games;
  } catch (error) {
    console.error(`❌ SteamDB Charts failed:`, error.message);
    return [];
  }
}

/**
 * 🔍 Method 2: Get from Steam Top Sellers API
 */
async function getFromSteamTopSellers() {
  console.log("\n🔍 Fetching from Steam Top Sellers...");
  
  try {
    // Steam doesn't have public top sellers API, use featured games instead
    const response = await axios.get('https://store.steampowered.com/api/featured/', {
      headers: { 'User-Agent': CONFIG.USER_AGENT },
      timeout: 10000
    });
    
    const games = [];
    const featured = response.data;
    
    // Parse featured games
    const sections = [
      'featured_win',
      'featured_mac', 
      'featured_linux',
      'large_capsules',
      'specials'
    ];
    
    for (const section of sections) {
      if (!featured[section]) continue;
      
      const items = Array.isArray(featured[section]) 
        ? featured[section] 
        : [featured[section]];
        
      for (const item of items) {
        if (!item?.id || !item?.name) continue;
        
        const appId = parseInt(item.id);
        if (!existingAppIds.has(appId)) {
          games.push({
            name: item.name,
            appId: appId
          });
          existingAppIds.add(appId);
        }
      }
    }
    
    console.log(`✅ Found ${games.length} new games from Steam Featured`);
    return games;
  } catch (error) {
    console.error(`❌ Steam Featured failed:`, error.message);
    return [];
  }
}

/**
 * 🔍 Method 3: Get from SteamCharts.com
 */
async function getFromSteamCharts() {
  console.log("\n🔍 Fetching from SteamCharts.com...");
  
  try {
    const response = await axios.get('https://steamcharts.com/', {
      headers: { 'User-Agent': CONFIG.USER_AGENT },
      timeout: 15000
    });
    
    const $ = cheerio.load(response.data);
    const games = [];
    
    // Parse top games table
    $('table.common-table tbody tr').each((i, row) => {
      if (i >= 100) return false;
      
      const $row = $(row);
      const link = $row.find('td').eq(1).find('a').attr('href');
      const name = $row.find('td').eq(1).find('a').text().trim();
      const appId = link?.match(/\/app\/(\d+)/)?.[1];
      
      if (appId && name && !existingAppIds.has(parseInt(appId))) {
        games.push({
          name: name,
          appId: parseInt(appId)
        });
        existingAppIds.add(parseInt(appId));
      }
    });
    
    console.log(`✅ Found ${games.length} new games from SteamCharts`);
    return games;
  } catch (error) {
    console.error(`❌ SteamCharts failed:`, error.message);
    return [];
  }
}

/**
 * 🔍 Method 4: Get from manual AppID list (AAA titles)
 */
function getManualGames() {
  console.log("\n🔍 Adding manual AAA games...");
  
  const manualAppIds = [
    // AAA Recent Releases
    { appId: 2357570, name: "Elden Ring" },
    { appId: 1938090, name: "Call of Duty" },
    { appId: 2050650, name: "Starfield" },
    { appId: 2138710, name: "Baldur's Gate 3" },
    { appId: 1817070, name: "Marvel's Spider-Man Remastered" },
    { appId: 1938090, name: "Cyberpunk 2077" },
    { appId: 1172470, name: "Apex Legends" },
    { appId: 1172620, name: "Sea of Thieves" },
    { appId: 2358720, name: "Black Myth: Wukong" },
    { appId: 2399830, name: "Palworld" },
    
    // Popular Multiplayer
    { appId: 730, name: "Counter-Strike 2" },
    { appId: 570, name: "Dota 2" },
    { appId: 578080, name: "PUBG: BATTLEGROUNDS" },
    { appId: 271590, name: "Grand Theft Auto V" },
    { appId: 252490, name: "Rust" },
    { appId: 322330, name: "Don't Starve Together" },
    { appId: 1623730, name: "Palworld" },
    { appId: 1966720, name: "Lethal Company" },
    
    // Popular Single Player
    { appId: 1245620, name: "Elden Ring" },
    { appId: 1174180, name: "Red Dead Redemption 2" },
    { appId: 292030, name: "The Witcher 3" },
    { appId: 1091500, name: "Cyberpunk 2077" },
    { appId: 1086940, name: "Baldur's Gate 3" },
    { appId: 489830, name: "The Elder Scrolls V: Skyrim" },
    { appId: 1237970, name: "Titanfall 2" },
    { appId: 813780, name: "Age of Empires II" },
    
    // Recent Indie Hits
    { appId: 1794680, name: "Vampire Survivors" },
    { appId: 1449850, name: "Yu-Gi-Oh! Master Duel" },
    { appId: 1593500, name: "God of War" },
    { appId: 1888160, name: "Marvel's Spider-Man: Miles Morales" },
    { appId: 1817230, name: "Uncharted: Legacy of Thieves" },
  ];
  
  const games = manualAppIds.filter(game => !existingAppIds.has(game.appId));
  
  games.forEach(game => existingAppIds.add(game.appId));
  
  console.log(`✅ Added ${games.length} manual games`);
  return games;
}

/**
 * ✅ Verify game exists on Steam
 */
async function verifyGame(appId) {
  try {
    const response = await axios.get(`https://store.steampowered.com/api/appdetails?appids=${appId}`, {
      headers: { 'User-Agent': CONFIG.USER_AGENT },
      timeout: 5000
    });
    
    const data = response.data[appId];
    if (data?.success && data?.data?.name) {
      return data.data.name;
    }
    
    return null;
  } catch (error) {
    return null;
  }
}

/**
 * 🧹 Clean and verify games
 */
async function cleanAndVerifyGames(games) {
  console.log(`\n🧹 Verifying ${games.length} games...`);
  
  const verified = [];
  
  for (let i = 0; i < games.length; i++) {
    const game = games[i];
    
    if (i % 10 === 0) {
      console.log(`⏳ Progress: ${i}/${games.length}`);
    }
    
    // Verify game exists
    const verifiedName = await verifyGame(game.appId);
    
    if (verifiedName) {
      verified.push({
        name: verifiedName,
        appId: game.appId
      });
      console.log(`✅ Verified: ${verifiedName} (${game.appId})`);
    } else {
      console.log(`❌ Invalid: ${game.name} (${game.appId})`);
    }
    
    // Rate limiting
    await new Promise(resolve => setTimeout(resolve, CONFIG.DELAY));
  }
  
  console.log(`\n✅ Verified ${verified.length}/${games.length} games`);
  return verified;
}

/**
 * 💾 Save to games.json
 */
function saveGames(allGames) {
  // Sort by appId
  allGames.sort((a, b) => a.appId - b.appId);
  
  // Save backup
  if (existingGames.length > 0) {
    const backupFile = `games.json.backup.${Date.now()}`;
    fs.writeFileSync(backupFile, JSON.stringify(existingGames, null, 2));
    console.log(`\n💾 Backup saved: ${backupFile}`);
  }
  
  // Save new games.json
  fs.writeFileSync('games.json', JSON.stringify(allGames, null, 2));
  console.log(`\n✅ Saved ${allGames.length} games to games.json`);
  
  // Print stats
  const newCount = allGames.length - existingGames.length;
  console.log(`\n📊 Stats:`);
  console.log(`   Previous: ${existingGames.length}`);
  console.log(`   New: ${newCount}`);
  console.log(`   Total: ${allGames.length}`);
}

/**
 * 🔍 Main function
 */
async function main() {
  console.log("🚀 Auto-populate games.json");
  console.log(`📊 Current games: ${existingGames.length}\n`);
  
  const allNewGames = [];
  
  // Fetch from all sources
  if (CONFIG.SOURCES.MANUAL_APPIDS) {
    const manual = getManualGames();
    allNewGames.push(...manual);
  }
  
  if (CONFIG.SOURCES.STEAMDB_CHART) {
    const steamdb = await getFromSteamDBChart();
    allNewGames.push(...steamdb);
    await new Promise(resolve => setTimeout(resolve, 3000));
  }
  
  if (CONFIG.SOURCES.STEAM_TOP_SELLERS) {
    const steamFeatured = await getFromSteamTopSellers();
    allNewGames.push(...steamFeatured);
    await new Promise(resolve => setTimeout(resolve, 3000));
  }
  
  if (CONFIG.SOURCES.STEAM_CHARTS) {
    const steamcharts = await getFromSteamCharts();
    allNewGames.push(...steamcharts);
  }
  
  console.log(`\n📊 Total new games found: ${allNewGames.length}`);
  
  if (allNewGames.length === 0) {
    console.log("✅ No new games to add!");
    return;
  }
  
  // Optional: Verify games (recommended but slow)
  const verifyGamesPrompt = process.env.SKIP_VERIFY !== 'true';
  
  let finalGames = allNewGames;
  if (verifyGamesPrompt) {
    finalGames = await cleanAndVerifyGames(allNewGames.slice(0, 100)); // Limit to 100 for verification
  }
  
  // Merge with existing
  const allGames = [...existingGames, ...finalGames];
  
  // Remove duplicates
  const uniqueGames = Array.from(
    new Map(allGames.map(game => [game.appId, game])).values()
  );
  
  // Save
  saveGames(uniqueGames);
  
  console.log("\n✨ Done!");
}

// Run
main().catch(error => {
  console.error("❌ Fatal error:", error);
  process.exit(1);
});