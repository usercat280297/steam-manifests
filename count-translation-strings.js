#!/usr/bin/env node
/**
 * 📊 Translation Statistics & QA Checker
 * Analyze translation projects for quality, completeness, and consistency
 */

const { MongoClient } = require('mongodb');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI;

// ═══════════════════════════════════════════════════════════════════════════
// MongoDB Connection
// ═══════════════════════════════════════════════════════════════════════════

async function connectMongo() {
  const client = new MongoClient(MONGODB_URI);
  await client.connect();
  return client.db('steam-manifest');
}

// ═══════════════════════════════════════════════════════════════════════════
// Statistics Analyzer
// ═══════════════════════════════════════════════════════════════════════════

async function getProjectStats(db, projectId) {
  const project = await db.collection('translation_projects').findOne({ projectId });
  
  if (!project) {
    console.error(`❌ Project not found: ${projectId}`);
    process.exit(1);
  }
  
  const files = await db.collection('translation_files')
    .find({ projectId })
    .toArray();
  
  const stats = {
    projectId,
    gameName: project.gameName,
    appId: project.appId,
    status: project.status,
    createdAt: project.createdAt,
    updatedAt: project.updatedAt,
    files: [],
    totals: {
      totalStrings: 0,
      translatedStrings: 0,
      reviewedStrings: 0,
      percentComplete: 0,
      averageQuality: 0,
      issues: 0
    }
  };
  
  for (const file of files) {
    const fileStats = {
      fileName: file.fileName,
      format: file.format,
      totalStrings: file.totalStrings,
      translatedStrings: file.translatedCount || 0,
      reviewedStrings: file.reviewedCount || 0,
      percentComplete: file.totalStrings > 0 ? Math.round((file.translatedCount / file.totalStrings) * 100) : 0,
      issues: []
    };
    
    // Check for quality issues
    const strings = file.strings || [];
    
    strings.forEach(str => {
      const issues = checkStringQuality(str.original, str.translated || '');
      if (issues.length > 0) {
        fileStats.issues.push(...issues);
      }
    });
    
    stats.files.push(fileStats);
    
    // Accumulate totals
    stats.totals.totalStrings += file.totalStrings;
    stats.totals.translatedStrings += (file.translatedCount || 0);
    stats.totals.reviewedStrings += (file.reviewedCount || 0);
  }
  
  // Calculate overall stats
  if (stats.totals.totalStrings > 0) {
    stats.totals.percentComplete = Math.round(
      (stats.totals.translatedStrings / stats.totals.totalStrings) * 100
    );
  }
  
  stats.totals.issues = stats.files.reduce((sum, f) => sum + f.issues.length, 0);
  
  return stats;
}

// ═══════════════════════════════════════════════════════════════════════════
// Quality Checker
// ═══════════════════════════════════════════════════════════════════════════

function checkStringQuality(original, translated) {
  const issues = [];
  
  // Check if empty
  if (!translated || translated.trim() === '') {
    issues.push(`⚠️  Empty translation: "${original}"`);
    return issues;
  }
  
  // Check for common mistakes
  if (original.endsWith('!') && !translated.endsWith('!')) {
    issues.push(`❌ Missing punctuation: "${original}" → "${translated}"`);
  }
  
  if (original.endsWith('?') && !translated.endsWith('?')) {
    issues.push(`❌ Missing question mark: "${original}" → "${translated}"`);
  }
  
  // Check for untranslated content (all English)
  const vietnameseCharPattern = /[àáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđ]/i;
  if (!vietnameseCharPattern.test(translated)) {
    // Check if it looks like it should be translated
    if (translated.toLowerCase() === original.toLowerCase()) {
      issues.push(`⚠️  Possible untranslated: "${original}"`);
    }
  }
  
  // Check for encoding issues
  if (translated.includes('?') && !original.includes('?')) {
    issues.push(`⚠️  Possible encoding issue: "${translated}"`);
  }
  
  // Check for excessive length difference (more than 50%)
  const lengthDiff = Math.abs(translated.length - original.length) / original.length;
  if (lengthDiff > 0.5) {
    console.log(`  (length: ${original.length} → ${translated.length})`);
  }
  
  return issues;
}

// ═══════════════════════════════════════════════════════════════════════════
// Report Generator
// ═══════════════════════════════════════════════════════════════════════════

function printReport(stats) {
  console.log('\n' + '═'.repeat(70));
  console.log(`📊 TRANSLATION REPORT: ${stats.gameName} (${stats.appId})`);
  console.log('═'.repeat(70));
  
  console.log(`\n📋 PROJECT INFO:`);
  console.log(`   ID: ${stats.projectId}`);
  console.log(`   Status: ${stats.status}`);
  console.log(`   Created: ${new Date(stats.createdAt).toLocaleDateString()}`);
  console.log(`   Updated: ${new Date(stats.updatedAt).toLocaleDateString()}`);
  
  console.log(`\n📈 OVERALL PROGRESS:`);
  const totalBar = createProgressBar(stats.totals.percentComplete);
  console.log(`   Progress: ${totalBar} ${stats.totals.percentComplete}%`);
  console.log(`   Translated: ${stats.totals.translatedStrings}/${stats.totals.totalStrings}`);
  console.log(`   Reviewed: ${stats.totals.reviewedStrings}/${stats.totals.totalStrings}`);
  
  console.log(`\n📁 FILE BREAKDOWN:`);
  stats.files.forEach(file => {
    const bar = createProgressBar(file.percentComplete);
    console.log(`\n   📄 ${file.fileName} (${file.format.toUpperCase()})`);
    console.log(`      ${bar} ${file.percentComplete}%`);
    console.log(`      ${file.translatedStrings}/${file.totalStrings} translated`);
    
    if (file.issues.length > 0) {
      console.log(`      ⚠️  Issues: ${file.issues.length}`);
      file.issues.slice(0, 3).forEach(issue => {
        console.log(`         ${issue}`);
      });
      if (file.issues.length > 3) {
        console.log(`         ... and ${file.issues.length - 3} more`);
      }
    }
  });
  
  console.log(`\n⚠️  QUALITY ISSUES:`);
  if (stats.totals.issues === 0) {
    console.log(`   ✅ No issues found!`);
  } else {
    console.log(`   Total: ${stats.totals.issues}`);
  }
  
  console.log('\n' + '═'.repeat(70));
}

function createProgressBar(percentage) {
  const filled = Math.round(percentage / 5);
  const empty = 20 - filled;
  return '[' + '█'.repeat(filled) + '░'.repeat(empty) + ']';
}

// ═══════════════════════════════════════════════════════════════════════════
// Export Functionality
// ═══════════════════════════════════════════════════════════════════════════

async function exportReport(stats, format = 'json') {
  const timestamp = new Date().toISOString().split('T')[0];
  const filename = `report_${stats.projectId}_${timestamp}.${format}`;
  
  const fs = require('fs').promises;
  
  if (format === 'json') {
    await fs.writeFile(filename, JSON.stringify(stats, null, 2));
  } else if (format === 'csv') {
    const csv = [
      'File,Format,Total,Translated,%,Reviewed,%',
      ...stats.files.map(f => 
        `${f.fileName},${f.format},${f.totalStrings},${f.translatedStrings},${f.percentComplete},${f.reviewedStrings},${Math.round((f.reviewedStrings/f.totalStrings)*100)}`
      )
    ];
    await fs.writeFile(filename, csv.join('\n'));
  }
  
  console.log(`\n💾 Report exported: ${filename}`);
}

// ═══════════════════════════════════════════════════════════════════════════
// CLI
// ═══════════════════════════════════════════════════════════════════════════

async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log('Usage: node count-strings.js <projectId> [format]');
    console.log('\nFormats:');
    console.log('  (default) - Display report in console');
    console.log('  json - Export as JSON');
    console.log('  csv - Export as CSV');
    console.log('\nExamples:');
    console.log('  node count-strings.js 1274570_1234567890');
    console.log('  node count-strings.js 1274570_1234567890 json');
    process.exit(1);
  }
  
  const projectId = args[0];
  const format = args[1] || 'console';
  
  try {
    const db = await connectMongo();
    const stats = await getProjectStats(db, projectId);
    
    if (format === 'console') {
      printReport(stats);
    } else {
      printReport(stats);
      await exportReport(stats, format);
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

main();
