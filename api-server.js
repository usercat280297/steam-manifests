const express = require('express');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const app = express();
app.use(express.json());

const PORT = process.env.API_PORT || 3000;
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || 'your-secret-token-here';
const GAMES_FILE = './games.json';
const STATE_FILE = './last_manifest_state.json';

// ═══════════════════════════════════════════════════════════
// 🔧 HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════

function loadGames() {
  try {
    const raw = fs.readFileSync(GAMES_FILE, 'utf8');
    return JSON.parse(raw);
  } catch (error) {
    console.error('❌ Load games failed:', error.message);
    return [];
  }
}

function saveGames(games) {
  try {
    fs.writeFileSync(GAMES_FILE, JSON.stringify(games, null, 2));
    console.log(`💾 Saved ${games.length} games to games.json`);
    return true;
  } catch (error) {
    console.error('❌ Save games failed:', error.message);
    return false;
  }
}

function loadState() {
  try {
    if (fs.existsSync(STATE_FILE)) {
      const data = fs.readFileSync(STATE_FILE, 'utf8');
      return JSON.parse(data);
    }
    return {};
  } catch (error) {
    return {};
  }
}

function clearGameState(gameName) {
  try {
    const state = loadState();
    if (state[gameName]) {
      delete state[gameName];
      fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
      console.log(`🗑️ Cleared state for: ${gameName}`);
      return true;
    }
    return false;
  } catch (error) {
    console.error('❌ Clear state error:', error.message);
    return false;
  }
}

// ═══════════════════════════════════════════════════════════
// 🔐 AUTH MIDDLEWARE
// ═══════════════════════════════════════════════════════════

function authenticate(req, res, next) {
  const token = req.headers['x-admin-token'] || req.query.token || req.body.token;
  
  if (!token || token !== ADMIN_TOKEN) {
    return res.status(403).json({
      success: false,
      error: 'Unauthorized - Invalid or missing token'
    });
  }
  
  next();
}

// ═══════════════════════════════════════════════════════════
// 📍 API ENDPOINTS
// ═══════════════════════════════════════════════════════════

// ──────────────────────────────────────────────────────────
// 🏠 Health check
// ──────────────────────────────────────────────────────────
app.get('/', (req, res) => {
  const games = loadGames();
  const state = loadState();
  
  res.json({
    status: 'online',
    service: 'Steam Manifest Bot API',
    version: '4.0',
    stats: {
      totalGames: games.length,
      trackedManifests: Object.keys(state).length,
      uptime: Math.floor(process.uptime()),
      memory: {
        used: Math.floor(process.memoryUsage().heapUsed / 1024 / 1024) + ' MB',
        total: Math.floor(process.memoryUsage().heapTotal / 1024 / 1024) + ' MB'
      }
    },
    endpoints: {
      public: {
        health: 'GET /',
        listGames: 'GET /games',
        stats: 'GET /stats'
      },
      protected: {
        addGame: 'POST /games/add (token required)',
        removeGame: 'DELETE /games/:appId (token required)',
        forceProcess: 'POST /process/:appId (token required)',
        clearState: 'POST /clear-state/:appId (token required)',
        bulkAdd: 'POST /games/bulk (token required)'
      }
    }
  });
});

// ──────────────────────────────────────────────────────────
// 📋 Get all games (PUBLIC)
// ──────────────────────────────────────────────────────────
app.get('/games', (req, res) => {
  const games = loadGames();
  const state = loadState();
  
  const gamesWithState = games.map(game => ({
    ...game,
    hasManifest: !!state[game.name]
  }));
  
  res.json({
    success: true,
    count: games.length,
    games: gamesWithState
  });
});

// ──────────────────────────────────────────────────────────
// 📊 Get stats (PUBLIC)
// ──────────────────────────────────────────────────────────
app.get('/stats', (req, res) => {
  const games = loadGames();
  const state = loadState();
  
  res.json({
    success: true,
    stats: {
      totalGames: games.length,
      trackedManifests: Object.keys(state).length,
      untracked: games.length - Object.keys(state).length,
      uptime: Math.floor(process.uptime()),
      uptimeFormatted: formatUptime(process.uptime()),
      memory: process.memoryUsage()
    }
  });
});

// ──────────────────────────────────────────────────────────
// ➕ Add single game (PROTECTED)
// ──────────────────────────────────────────────────────────
app.post('/games/add', authenticate, (req, res) => {
  const { name, appId } = req.body;
  
  if (!name || !appId) {
    return res.status(400).json({
      success: false,
      error: 'Missing required fields: name, appId'
    });
  }
  
  const games = loadGames();
  
  // Check duplicate
  const existing = games.find(g => g.appId === parseInt(appId));
  if (existing) {
    return res.status(409).json({
      success: false,
      error: `Game already exists: ${existing.name} (${existing.appId})`
    });
  }
  
  // Add game
  games.push({
    name: name.trim(),
    appId: parseInt(appId)
  });
  
  if (saveGames(games)) {
    console.log(`➕ Added: ${name} (${appId})`);
    
    res.json({
      success: true,
      message: `Successfully added ${name}`,
      game: { name, appId: parseInt(appId) },
      totalGames: games.length,
      note: 'Bot will automatically process this game on next file watch trigger'
    });
  } else {
    res.status(500).json({
      success: false,
      error: 'Failed to save games.json'
    });
  }
});

// ──────────────────────────────────────────────────────────
// ➕ Bulk add games (PROTECTED)
// ──────────────────────────────────────────────────────────
app.post('/games/bulk', authenticate, (req, res) => {
  const { games: newGames } = req.body;
  
  if (!Array.isArray(newGames) || newGames.length === 0) {
    return res.status(400).json({
      success: false,
      error: 'Missing or invalid games array'
    });
  }
  
  const games = loadGames();
  const added = [];
  const skipped = [];
  
  newGames.forEach(game => {
    if (!game.name || !game.appId) {
      skipped.push({ game, reason: 'Missing name or appId' });
      return;
    }
    
    if (games.find(g => g.appId === parseInt(game.appId))) {
      skipped.push({ game, reason: 'Already exists' });
      return;
    }
    
    games.push({
      name: game.name.trim(),
      appId: parseInt(game.appId)
    });
    
    added.push(game);
  });
  
  if (added.length > 0 && saveGames(games)) {
    console.log(`➕ Bulk added: ${added.length} games`);
    
    res.json({
      success: true,
      added: added.length,
      skipped: skipped.length,
      totalGames: games.length,
      details: { added, skipped }
    });
  } else {
    res.status(500).json({
      success: false,
      error: 'No games added or save failed'
    });
  }
});

// ──────────────────────────────────────────────────────────
// ❌ Remove game (PROTECTED)
// ──────────────────────────────────────────────────────────
app.delete('/games/:appId', authenticate, (req, res) => {
  const appId = parseInt(req.params.appId);
  let games = loadGames();
  
  const game = games.find(g => g.appId === appId);
  if (!game) {
    return res.status(404).json({
      success: false,
      error: `Game not found: ${appId}`
    });
  }
  
  games = games.filter(g => g.appId !== appId);
  
  if (saveGames(games)) {
    // Also clear state
    clearGameState(game.name);
    
    console.log(`🗑️ Removed: ${game.name} (${appId})`);
    
    res.json({
      success: true,
      message: `Removed ${game.name}`,
      totalGames: games.length
    });
  } else {
    res.status(500).json({
      success: false,
      error: 'Failed to save games.json'
    });
  }
});

// ──────────────────────────────────────────────────────────
// 🔄 Force process game (PROTECTED)
// ──────────────────────────────────────────────────────────
app.post('/process/:appId', authenticate, (req, res) => {
  const appId = parseInt(req.params.appId);
  const games = loadGames();
  const game = games.find(g => g.appId === appId);
  
  if (!game) {
    return res.status(404).json({
      success: false,
      error: `Game not found: ${appId}`
    });
  }
  
  // Clear state to force reprocessing
  clearGameState(game.name);
  
  res.json({
    success: true,
    message: `State cleared for ${game.name}`,
    note: 'Game will be processed on next scan cycle',
    game: game
  });
});

// ──────────────────────────────────────────────────────────
// 🗑️ Clear game state (PROTECTED)
// ──────────────────────────────────────────────────────────
app.post('/clear-state/:appId', authenticate, (req, res) => {
  const appId = parseInt(req.params.appId);
  const games = loadGames();
  const game = games.find(g => g.appId === appId);
  
  if (!game) {
    return res.status(404).json({
      success: false,
      error: `Game not found: ${appId}`
    });
  }
  
  if (clearGameState(game.name)) {
    res.json({
      success: true,
      message: `State cleared for ${game.name}`,
      game: game
    });
  } else {
    res.status(404).json({
      success: false,
      error: `No state found for ${game.name}`
    });
  }
});

// ──────────────────────────────────────────────────────────
// 🔍 Search games (PUBLIC)
// ──────────────────────────────────────────────────────────
app.get('/search', (req, res) => {
  const { q, appId } = req.query;
  
  if (!q && !appId) {
    return res.status(400).json({
      success: false,
      error: 'Missing search query (q) or appId'
    });
  }
  
  const games = loadGames();
  let results = [];
  
  if (appId) {
    results = games.filter(g => g.appId === parseInt(appId));
  } else {
    const query = q.toLowerCase();
    results = games.filter(g => 
      g.name.toLowerCase().includes(query)
    );
  }
  
  res.json({
    success: true,
    query: q || appId,
    count: results.length,
    results: results
  });
});

// ═══════════════════════════════════════════════════════════
// 🔧 UTILS
// ═══════════════════════════════════════════════════════════

function formatUptime(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  return `${hours}h ${minutes}m ${secs}s`;
}

// ═══════════════════════════════════════════════════════════
// 🚀 START SERVER
// ═══════════════════════════════════════════════════════════

app.listen(PORT, () => {
  console.log('\n' + '═'.repeat(60));
  console.log('🚀 API CONTROL SERVER STARTED');
  console.log('═'.repeat(60));
  console.log(`📍 URL: http://localhost:${PORT}`);
  console.log(`🔐 Auth: ${ADMIN_TOKEN ? 'Enabled' : 'Disabled'}`);
  console.log(`📋 Games: ${loadGames().length}`);
  console.log('═'.repeat(60) + '\n');
  
  console.log('📚 Quick Start:');
  console.log(`   Health: curl http://localhost:${PORT}/`);
  console.log(`   Add:    curl -X POST http://localhost:${PORT}/games/add \\`);
  console.log(`              -H "x-admin-token: ${ADMIN_TOKEN}" \\`);
  console.log(`              -H "Content-Type: application/json" \\`);
  console.log(`              -d '{"name":"Elden Ring","appId":1245620}'`);
  console.log('');
});