#!/usr/bin/env node
/**
 * 🔄 File Format Converter
 * Convert between JSON, CSV, and .po formats
 */

const fs = require('fs').promises;
const path = require('path');
const readline = require('readline');

// ═══════════════════════════════════════════════════════════════════════════
// JSON Parser
// ═══════════════════════════════════════════════════════════════════════════

function flattenJson(obj, prefix = '') {
  const result = [];
  
  for (const key in obj) {
    const value = obj[key];
    const fullKey = prefix ? `${prefix}.${key}` : key;
    
    if (typeof value === 'string') {
      result.push({ key: fullKey, value });
    } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      result.push(...flattenJson(value, fullKey));
    } else if (Array.isArray(value)) {
      value.forEach((item, index) => {
        if (typeof item === 'string') {
          result.push({ key: `${fullKey}[${index}]`, value: item });
        } else if (typeof item === 'object') {
          result.push(...flattenJson(item, `${fullKey}[${index}]`));
        }
      });
    }
  }
  
  return result;
}

function unflattenJson(entries) {
  const result = {};
  
  entries.forEach(({ key, value }) => {
    const parts = key.split('.');
    let current = result;
    
    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i];
      if (!current[part]) {
        current[part] = {};
      }
      current = current[part];
    }
    
    const lastPart = parts[parts.length - 1];
    current[lastPart] = value;
  });
  
  return result;
}

async function parseJsonFile(filePath) {
  const content = await fs.readFile(filePath, 'utf8');
  const data = JSON.parse(content);
  return flattenJson(data);
}

async function exportToJson(entries, outputPath) {
  const data = unflattenJson(entries);
  const content = JSON.stringify(data, null, 2);
  await fs.writeFile(outputPath, content, 'utf8');
}

// ═══════════════════════════════════════════════════════════════════════════
// CSV Parser
// ═══════════════════════════════════════════════════════════════════════════

async function parseCSVFile(filePath) {
  const content = await fs.readFile(filePath, 'utf8');
  const lines = content.split('\n');
  const headers = lines[0].split(',').map(h => h.trim());
  const entries = [];
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    const parts = line.split(',');
    const entry = {};
    headers.forEach((header, index) => {
      entry[header.toLowerCase()] = parts[index] ? parts[index].trim() : '';
    });
    
    if (entry.key) {
      entries.push({ key: entry.key, value: entry.value || entry.english || '' });
    }
  }
  
  return entries;
}

async function exportToCSV(entries, outputPath) {
  const headers = ['Key', 'English', 'Vietnamese', 'Status'];
  const rows = [headers.join(',')];
  
  entries.forEach(({ key, value }) => {
    rows.push(`"${key}","${value}","","Pending"`);
  });
  
  await fs.writeFile(outputPath, rows.join('\n'), 'utf8');
}

// ═══════════════════════════════════════════════════════════════════════════
// PO (Gettext) Parser
// ═══════════════════════════════════════════════════════════════════════════

async function parsePoFile(filePath) {
  const content = await fs.readFile(filePath, 'utf8');
  const entries = [];
  const blocks = content.split('#:');
  
  blocks.forEach(block => {
    const lines = block.split('\n');
    let msgid = '';
    let context = '';
    
    lines.forEach(line => {
      if (line.startsWith('msgid "')) {
        msgid = line.match(/"(.*)"/)[1];
      }
      if (line.includes('.c:') || line.includes('.h:')) {
        context = line.trim();
      }
    });
    
    if (msgid) {
      entries.push({ key: context || msgid, value: msgid });
    }
  });
  
  return entries;
}

async function exportToPo(entries, outputPath) {
  const lines = [
    '# Translation file',
    'msgid ""',
    'msgstr ""',
    '"Content-Type: text/plain; charset=UTF-8\\n"',
    '',
  ];
  
  entries.forEach(({ key, value }, index) => {
    lines.push(`#: ${key || `string_${index}`}`);
    lines.push(`msgid "${value}"`);
    lines.push(`msgstr ""`);
    lines.push('');
  });
  
  await fs.writeFile(outputPath, lines.join('\n'), 'utf8');
}

// ═══════════════════════════════════════════════════════════════════════════
// Auto-Detect Format
// ═══════════════════════════════════════════════════════════════════════════

function detectFormat(filePath) {
  if (filePath.endsWith('.json')) return 'json';
  if (filePath.endsWith('.csv')) return 'csv';
  if (filePath.endsWith('.po')) return 'po';
  return 'unknown';
}

// ═══════════════════════════════════════════════════════════════════════════
// Main Conversion
// ═══════════════════════════════════════════════════════════════════════════

async function convertFile(inputPath, outputPath) {
  console.log(`\n🔄 Converting: ${path.basename(inputPath)} → ${path.basename(outputPath)}`);
  
  const inputFormat = detectFormat(inputPath);
  const outputFormat = detectFormat(outputPath);
  
  if (inputFormat === 'unknown' || outputFormat === 'unknown') {
    console.error('❌ Unsupported format. Use .json, .csv, or .po');
    process.exit(1);
  }
  
  try {
    // Parse input
    let entries;
    console.log(`📖 Parsing ${inputFormat.toUpperCase()}...`);
    
    switch (inputFormat) {
      case 'json':
        entries = await parseJsonFile(inputPath);
        break;
      case 'csv':
        entries = await parseCSVFile(inputPath);
        break;
      case 'po':
        entries = await parsePoFile(inputPath);
        break;
    }
    
    console.log(`✅ Found ${entries.length} strings`);
    
    // Export to output format
    console.log(`✍️  Writing ${outputFormat.toUpperCase()}...`);
    
    switch (outputFormat) {
      case 'json':
        await exportToJson(entries, outputPath);
        break;
      case 'csv':
        await exportToCSV(entries, outputPath);
        break;
      case 'po':
        await exportToPo(entries, outputPath);
        break;
    }
    
    console.log(`\n✅ Converted successfully!`);
    console.log(`📁 Output: ${outputPath}`);
    console.log(`📊 Total strings: ${entries.length}`);
    
  } catch (error) {
    console.error(`\n❌ Conversion failed: ${error.message}`);
    process.exit(1);
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// CLI
// ═══════════════════════════════════════════════════════════════════════════

async function main() {
  const args = process.argv.slice(2);
  
  if (args.length < 2) {
    console.log('Usage: node convert-game-files.js <input_file> <output_file>');
    console.log('\nSupported formats: .json, .csv, .po');
    console.log('\nExamples:');
    console.log('  node convert-game-files.js strings.json strings.csv');
    console.log('  node convert-game-files.js strings.csv strings.po');
    console.log('  node convert-game-files.js strings.po strings.json');
    process.exit(1);
  }
  
  const inputPath = args[0];
  const outputPath = args[1];
  
  try {
    await fs.access(inputPath);
  } catch (error) {
    console.error(`❌ Input file not found: ${inputPath}`);
    process.exit(1);
  }
  
  await convertFile(inputPath, outputPath);
}

main().catch(error => {
  console.error('Fatal error:', error.message);
  process.exit(1);
});
