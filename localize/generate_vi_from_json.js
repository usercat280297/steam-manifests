const fs = require('fs');
const axios = require('axios');

// Usage:
// 1) Simple fallback (no API):
//    node generate_vi_from_json.js input.json output_vi.json
//    -> will produce translations by prefixing "[VI] " to each string
// 2) With Google Translate API (you must provide GOOGLE_API_KEY env var):
//    export GOOGLE_API_KEY=your_key
//    node generate_vi_from_json.js input.json output_vi.json
//    -> will call Google Translate API to translate each string to Vietnamese

const API_KEY = process.env.GOOGLE_API_KEY || null;

function loadInput(path) {
  if (!fs.existsSync(path)) {
    console.error('Input file not found:', path);
    process.exit(1);
  }
  const raw = fs.readFileSync(path, 'utf8');
  return JSON.parse(raw);
}

async function translateText(text) {
  if (!API_KEY) return `[VI] ${text}`; // fallback placeholder

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

async function processObject(obj) {
  // recursively translate string values in an object/array
  if (typeof obj === 'string') {
    return await translateText(obj);
  }
  if (Array.isArray(obj)) {
    const out = [];
    for (const item of obj) out.push(await processObject(item));
    return out;
  }
  if (typeof obj === 'object' && obj !== null) {
    const out = {};
    for (const k of Object.keys(obj)) {
      out[k] = await processObject(obj[k]);
    }
    return out;
  }
  return obj;
}

async function main() {
  const args = process.argv.slice(2);
  if (args.length < 2) {
    console.error('Usage: node generate_vi_from_json.js input.json output_vi.json');
    process.exit(1);
  }

  const inputPath = args[0];
  const outputPath = args[1];
  console.log('Loading', inputPath);
  const input = loadInput(inputPath);
  console.log('Translating... (this may take time if many strings)');

  const translated = await processObject(input);

  fs.writeFileSync(outputPath, JSON.stringify(translated, null, 2), 'utf8');
  console.log('Wrote', outputPath);
  console.log('Note: If you want automatic machine translation, set env GOOGLE_API_KEY with a valid key. Otherwise results are placeholder prefixed with "[VI] ".');
}

main().catch(err => { console.error(err); process.exit(1); });
