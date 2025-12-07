#!/usr/bin/env node
/**
 * 🔍 Game File Finder & String Extractor
 * Automatically find and extract translatable strings from game folders
 */

const fs = require('fs').promises;
const path = require('path');
const readline = require('readline');

const SEARCH_PATTERNS = {
  json: /\.json$/i,
  csv: /\.csv$/i,
  po: /\.po$/i,
  yaml: /\.(yaml|yml)$/i,
  xml: /\.xml$/i,
  txt: /\.txt$/i
};

const GAME_PATHS = [
  'data', 'localization', 'lang', 'languages', 'strings', 'i18n',
  'content', 'assets', 'streaming_assets', 'resources',
  'Localization', 'Lang', 'Data'
];

// ═══════════════════════════════════════════════════════════════════════════
// Main Search Function
// ═══════════════════════════════════════════════════════════════════════════

async function findGameStrings(gamePath) {
  console.log(`\n🔍 Scanning: ${gamePath}`);
  console.log('═'.repeat(60));
  
  const results = {
    json: [],
    csv: [],
    po: [],
    yaml: [],
    xml: [],
    txt: [],
    stats: {
      totalFiles: 0,
      totalStrings: 0
    }
  };
  
  try {
    // Search in common paths
    for (const subPath of GAME_PATHS) {
      const fullPath = path.join(gamePath, subPath);
      try {
        await searchDirectory(fullPath, results);
      } catch (e) {
        // Path doesn't exist, continue
      }
    }
    
    // Also search root level
    await searchDirectory(gamePath, results, 2);
    
    // Display results
    displayResults(results);
    
  } catch (error) {
    console.error(`❌ Error scanning directory: ${error.message}`);
  }
}

async function searchDirectory(dirPath, results, maxDepth = 3, currentDepth = 0) {
  if (currentDepth >= maxDepth) return;
  
  try {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);
      
      // Skip common non-game folders
      if (['node_modules', '.git', '__pycache__', 'bin', 'obj'].includes(entry.name)) {
        continue;
      }
      
      if (entry.isDirectory()) {
        await searchDirectory(fullPath, results, maxDepth, currentDepth + 1);
      } else if (entry.isFile()) {
        // Check file extensions
        if (SEARCH_PATTERNS.json.test(entry.name)) {
          await processJsonFile(fullPath, results);
        } else if (SEARCH_PATTERNS.csv.test(entry.name)) {
          results.csv.push(fullPath);
          results.stats.totalFiles++;
        } else if (SEARCH_PATTERNS.po.test(entry.name)) {
          results.po.push(fullPath);
          results.stats.totalFiles++;
        } else if (SEARCH_PATTERNS.yaml.test(entry.name)) {
          results.yaml.push(fullPath);
          results.stats.totalFiles++;
        } else if (SEARCH_PATTERNS.xml.test(entry.name)) {
          results.xml.push(fullPath);
          results.stats.totalFiles++;
        }
      }
    }
  } catch (error) {
    // Directory read error, skip
  }
}

async function processJsonFile(filePath, results) {
  try {
    const content = await fs.readFile(filePath, 'utf8');
    const data = JSON.parse(content);
    const stringCount = countStringsInObject(data);
    
    if (stringCount > 0) {
      results.json.push({ path: filePath, strings: stringCount });
      results.stats.totalFiles++;
      results.stats.totalStrings += stringCount;
    }
  } catch (error) {
    // Not valid JSON or read error, skip
  }
}

function countStringsInObject(obj, depth = 0) {
  if (depth > 10) return 0;
  
  let count = 0;
  
  if (typeof obj === 'string') {
    return 1;
  } else if (Array.isArray(obj)) {
    return obj.reduce((sum, item) => sum + countStringsInObject(item, depth + 1), 0);
  } else if (typeof obj === 'object' && obj !== null) {
    for (const key in obj) {
      count += countStringsInObject(obj[key], depth + 1);
    }
  }
  
  return count;
}

// ═══════════════════════════════════════════════════════════════════════════
// Display Results
// ═══════════════════════════════════════════════════════════════════════════

function displayResults(results) {
  console.log('\n✅ FOUND FILES:');
  console.log('═'.repeat(60));
  
  if (results.json.length > 0) {
    console.log(`\n📄 JSON Files (${results.json.length})`);
    results.json.forEach(f => {
      console.log(`   • ${f.path.substring(f.path.lastIndexOf('\\') + 1)} - ${f.strings} strings`);
    });
  }
  
  if (results.csv.length > 0) {
    console.log(`\n📊 CSV Files (${results.csv.length})`);
    results.csv.forEach(f => {
      console.log(`   • ${f.substring(f.lastIndexOf('\\') + 1)}`);
    });
  }
  
  if (results.po.length > 0) {
    console.log(`\n📝 PO Files (${results.po.length})`);
    results.po.forEach(f => {
      console.log(`   • ${f.substring(f.lastIndexOf('\\') + 1)}`);
    });
  }
  
  if (results.yaml.length > 0) {
    console.log(`\n🔧 YAML Files (${results.yaml.length})`);
    results.yaml.forEach(f => {
      console.log(`   • ${f.substring(f.lastIndexOf('\\') + 1)}`);
    });
  }
  
  if (results.xml.length > 0) {
    console.log(`\n⚙️  XML Files (${results.xml.length})`);
    results.xml.forEach(f => {
      console.log(`   • ${f.substring(f.lastIndexOf('\\') + 1)}`);
    });
  }
  
  console.log(`\n📈 SUMMARY:`);
  console.log(`   Total Files: ${results.stats.totalFiles}`);
  console.log(`   Total Strings: ${results.stats.totalStrings}`);
  
  if (results.stats.totalFiles === 0) {
    console.log('\n⚠️  No translation files found. Try:');
    console.log('   1. Check game folder structure');
    console.log('   2. Look for "localization", "lang", "data" folders');
    console.log('   3. Game may use binary format (check modding community)');
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// CLI
// ═══════════════════════════════════════════════════════════════════════════

async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log('Usage: node find-game-strings.js <game_folder_path>');
    console.log('\nExample:');
    console.log('  node find-game-strings.js "C:\\Program Files (x86)\\Steam\\steamapps\\common\\Devour"');
    process.exit(1);
  }
  
  const gamePath = args[0];
  
  // Check if path exists
  try {
    await fs.access(gamePath);
    await findGameStrings(gamePath);
  } catch (error) {
    console.error(`❌ Path not found: ${gamePath}`);
    process.exit(1);
  }
}

main().catch(error => {
  console.error('Fatal error:', error.message);
  process.exit(1);
});
