const fs = require('fs');
const axios = require('axios');

// Usage:
// node generate_vi_for_app.js 271590
// Requires optional GOOGLE_API_KEY env var for real translations; otherwise prefixes [VI]

const API_KEY = process.env.GOOGLE_API_KEY || null;

async function translateText(text) {
  if (!text) return text;
  if (!API_KEY) return `[VI] ${text}`;
  try {
    const url = `https://translation.googleapis.com/language/translate/v2?key=${API_KEY}`;
    const res = await axios.post(url, { q: text, target: 'vi', format: 'text' }, { timeout: 10000 });
    const data = res.data;
    if (data && data.data && data.data.translations && data.data.translations[0]) {
      return data.data.translations[0].translatedText;
    }
  } catch (err) {
    console.warn('Translate API failed:', err.message || err);
  }
  return `[VI] ${text}`;
}

async function fetchGame(appId) {
  try {
    const res = await axios.get(`https://store.steampowered.com/api/appdetails?appids=${appId}&cc=us`, { timeout: 10000 });
    return res.data[appId]?.data || null;
  } catch (err) {
    console.error('Failed to fetch game:', err.message || err);
    return null;
  }
}

async function main() {
  const args = process.argv.slice(2);
  if (args.length === 0) {
    console.error('Usage: node generate_vi_for_app.js <appId>');
    process.exit(1);
  }
  const appId = args[0];
  const game = await fetchGame(appId);
  if (!game) {
    console.error('Game not found or API failed');
    process.exit(1);
  }

  // Pick fields to translate
  const payload = {
    title: game.name || '',
    short_description: game.short_description || '',
    about_the_game: game.about_the_game || '',
    developers: game.developers || [],
    publishers: game.publishers || []
  };

  // Translate strings
  const translated = {};
  translated.title = await translateText(payload.title);
  translated.short_description = await translateText(payload.short_description);
  // about_the_game may contain HTML; strip tags crudely before translating
  const aboutPlain = payload.about_the_game.replace(/<[^>]*>/g, '');
  translated.about_the_game = await translateText(aboutPlain);
  translated.developers = payload.developers;
  translated.publishers = payload.publishers;

  const outDir = 'localize/out';
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  const outPath = `${outDir}/${appId}_vi.json`;
  fs.writeFileSync(outPath, JSON.stringify(translated, null, 2), 'utf8');
  console.log('Wrote', outPath);
}

main().catch(err => { console.error(err); process.exit(1); });
