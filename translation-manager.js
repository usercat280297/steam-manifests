#!/usr/bin/env node
/**
 * 🇻🇳 Game Translation Manager
 * Manages game translations across multiple formats (JSON, CSV, .po)
 * Supports Unreal Engine games and other platforms
 */

const fs = require('fs');
const path = require('path');
const axios = require('axios');
require('dotenv').config();
require('dotenv').config({ path: '.env.local' });

// ═══════════════════════════════════════════════════════════════════════════
// Configuration
// ═══════════════════════════════════════════════════════════════════════════

const MONGODB_URI = process.env.MONGODB_URI;
const { MongoClient } = require('mongodb');

const CONFIG = {
  TRANSLATIONS_DIR: path.join(__dirname, 'translations'),
  PROJECTS_DIR: path.join(__dirname, 'translation_projects'),
  MAX_FILE_SIZE: 50 * 1024 * 1024, // 50MB
  SUPPORTED_FORMATS: ['json', 'csv', 'po', 'txt', 'xml']
};

let mongoDb = null;

// ═══════════════════════════════════════════════════════════════════════════
// Database Connection
// ═══════════════════════════════════════════════════════════════════════════

async function connectMongo() {
  if (mongoDb) return mongoDb;
  
  try {
    const client = new MongoClient(MONGODB_URI, { 
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 5000 
    });
    
    await client.connect();
    mongoDb = client.db('steam-manifest');
    
    // Create collections if not exist
    await mongoDb.createCollection('translation_projects').catch(() => {});
    await mongoDb.createCollection('translation_files').catch(() => {});
    await mongoDb.createCollection('translation_strings').catch(() => {});
    
    console.log('✅ MongoDB connected');
    return mongoDb;
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    process.exit(1);
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// Translation Project Management
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Create a new translation project
 * @param {number} appId - Steam App ID
 * @param {string} gameName - Game name
 * @param {Object} options - Project options
 */
async function createTranslationProject(appId, gameName, options = {}) {
  const db = await connectMongo();
  
  const projectId = `${appId}_${Date.now()}`;
  const projectPath = path.join(CONFIG.PROJECTS_DIR, projectId);
  
  try {
    // Create project directory
    if (!fs.existsSync(projectPath)) {
      fs.mkdirSync(projectPath, { recursive: true });
    }
    
    // Create subdirectories
    const dirs = [
      'source_files',    // Original game files
      'translations',    // Translated files
      'backups',        // Backup originals
      'exports',        // Export for mod packaging
      'logs'            // Translation logs
    ];
    
    for (const dir of dirs) {
      const dirPath = path.join(projectPath, dir);
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
      }
    }
    
    // Create project metadata
    const projectData = {
      projectId: projectId,
      appId: Number(appId),
      gameName: gameName,
      targetLanguage: 'vi', // Vietnamese
      sourceLanguage: options.sourceLanguage || 'en',
      status: 'active', // active, paused, completed
      createdAt: new Date(),
      updatedAt: new Date(),
      progress: {
        totalStrings: 0,
        translatedStrings: 0,
        reviewedStrings: 0,
        percentComplete: 0
      },
      files: [],
      contributors: [options.mainContributor || 'Unknown'],
      notes: options.notes || '',
      description: options.description || `Vietnamese translation for ${gameName}`,
      supportedFormats: options.formats || ['json', 'csv', 'po']
    };
    
    // Save to MongoDB
    await db.collection('translation_projects').insertOne(projectData);
    
    // Create project.json file
    fs.writeFileSync(
      path.join(projectPath, 'project.json'),
      JSON.stringify(projectData, null, 2)
    );
    
    console.log(`✅ Created translation project: ${projectId}`);
    console.log(`📁 Location: ${projectPath}`);
    
    return {
      success: true,
      projectId: projectId,
      projectPath: projectPath,
      data: projectData
    };
    
  } catch (error) {
    console.error(`❌ Failed to create project: ${error.message}`);
    return { success: false, error: error.message };
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// File Format Detection & Parsing
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Detect file format
 */
function detectFileFormat(filePath) {
  const ext = path.extname(filePath).toLowerCase().slice(1);
  
  if (['json', 'csv', 'po', 'txt', 'xml'].includes(ext)) {
    return ext;
  }
  
  // Try to detect by content
  try {
    const content = fs.readFileSync(filePath, 'utf8').slice(0, 500);
    
    if (content.includes('{') && content.includes('"')) return 'json';
    if (content.includes(',')) return 'csv';
    if (content.includes('msgid')) return 'po';
    if (content.includes('<') && content.includes('>')) return 'xml';
    
    return 'txt';
  } catch (e) {
    return 'unknown';
  }
}

/**
 * Parse JSON translation file
 */
function parseJsonFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const data = JSON.parse(content);
    
    const strings = [];
    const flattenJson = (obj, prefix = '') => {
      Object.entries(obj).forEach(([key, value]) => {
        const fullKey = prefix ? `${prefix}.${key}` : key;
        
        if (typeof value === 'string') {
          strings.push({
            id: fullKey,
            original: value,
            translated: '',
            status: 'pending' // pending, translated, reviewed
          });
        } else if (typeof value === 'object' && value !== null) {
          flattenJson(value, fullKey);
        }
      });
    };
    
    flattenJson(data);
    
    return {
      format: 'json',
      totalStrings: strings.length,
      strings: strings
    };
  } catch (error) {
    console.error(`Error parsing JSON: ${error.message}`);
    return null;
  }
}

/**
 * Parse CSV translation file
 */
function parseCSVFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    
    // Assume format: id,original_text,context
    const strings = [];
    
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      // Simple CSV parsing (handle quoted values)
      const parts = line.split(',').map(s => s.replace(/^"|"$/g, ''));
      
      if (parts.length >= 2) {
        strings.push({
          id: parts[0] || `string_${i}`,
          original: parts[1] || '',
          context: parts[2] || '',
          translated: '',
          status: 'pending'
        });
      }
    }
    
    return {
      format: 'csv',
      totalStrings: strings.length,
      strings: strings
    };
  } catch (error) {
    console.error(`Error parsing CSV: ${error.message}`);
    return null;
  }
}

/**
 * Parse .po (GNU Gettext) file
 */
function parsePoFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const strings = [];
    
    // Simple .po parser
    const poRegex = /msgid\s+"([^"]*)"[\s\S]*?msgstr\s+"([^"]*)"/g;
    let match;
    let count = 0;
    
    while ((match = poRegex.exec(content)) !== null) {
      if (match[1]) { // Skip empty msgid
        strings.push({
          id: `string_${count++}`,
          original: match[1],
          translated: match[2] || '',
          status: match[2] ? 'translated' : 'pending'
        });
      }
    }
    
    return {
      format: 'po',
      totalStrings: strings.length,
      strings: strings
    };
  } catch (error) {
    console.error(`Error parsing .po file: ${error.message}`);
    return null;
  }
}

/**
 * Parse any supported translation file
 */
function parseTranslationFile(filePath) {
  const format = detectFileFormat(filePath);
  
  console.log(`📄 Parsing file: ${path.basename(filePath)} (format: ${format})`);
  
  switch (format) {
    case 'json':
      return parseJsonFile(filePath);
    case 'csv':
      return parseCSVFile(filePath);
    case 'po':
      return parsePoFile(filePath);
    default:
      console.warn(`⚠️ Unsupported format: ${format}`);
      return null;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// Translation File Management
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Add file to translation project
 */
async function addFileToProject(projectId, filePath, fileType = 'localization') {
  const db = await connectMongo();
  
  try {
    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }
    
    const fileSize = fs.statSync(filePath).size;
    if (fileSize > CONFIG.MAX_FILE_SIZE) {
      throw new Error(`File too large: ${fileSize} bytes (max: ${CONFIG.MAX_FILE_SIZE})`);
    }
    
    // Parse file
    const parsedData = parseTranslationFile(filePath);
    if (!parsedData) {
      throw new Error('Failed to parse translation file');
    }
    
    // Create file entry
    const fileEntry = {
      projectId: projectId,
      fileName: path.basename(filePath),
      filePath: filePath,
      fileType: fileType, // localization, dialogue, menu, subtitles
      format: parsedData.format,
      fileSize: fileSize,
      addedAt: new Date(),
      totalStrings: parsedData.totalStrings,
      translatedCount: 0,
      reviewedCount: 0,
      lastModified: new Date(),
      strings: parsedData.strings
    };
    
    // Save to MongoDB
    const result = await db.collection('translation_files').insertOne(fileEntry);
    
    // Backup original file
    const projectPath = path.join(CONFIG.PROJECTS_DIR, projectId);
    const backupPath = path.join(projectPath, 'backups', path.basename(filePath));
    fs.copyFileSync(filePath, backupPath);
    
    // Update project progress
    await updateProjectProgress(projectId);
    
    console.log(`✅ Added file: ${path.basename(filePath)}`);
    console.log(`   Strings found: ${parsedData.totalStrings}`);
    
    return {
      success: true,
      fileId: result.insertedId,
      stringsFound: parsedData.totalStrings
    };
    
  } catch (error) {
    console.error(`❌ Failed to add file: ${error.message}`);
    return { success: false, error: error.message };
  }
}

/**
 * Update translation for a string
 */
async function updateTranslation(projectId, fileId, stringId, translatedText, reviewed = false) {
  const db = await connectMongo();
  
  try {
    const result = await db.collection('translation_files').updateOne(
      { 
        projectId: projectId,
        _id: fileId,
        'strings.id': stringId
      },
      {
        $set: {
          'strings.$.translated': translatedText,
          'strings.$.status': reviewed ? 'reviewed' : 'translated',
          'strings.$.translatedAt': new Date(),
          'lastModified': new Date()
        }
      }
    );
    
    await updateProjectProgress(projectId);
    
    return { success: result.modifiedCount > 0 };
  } catch (error) {
    console.error(`❌ Failed to update translation: ${error.message}`);
    return { success: false, error: error.message };
  }
}

/**
 * Update project progress
 */
async function updateProjectProgress(projectId) {
  const db = await connectMongo();
  
  try {
    const files = await db.collection('translation_files')
      .find({ projectId: projectId })
      .toArray();
    
    let totalStrings = 0;
    let translatedCount = 0;
    let reviewedCount = 0;
    
    for (const file of files) {
      totalStrings += file.totalStrings;
      translatedCount += file.strings.filter(s => s.translated).length;
      reviewedCount += file.strings.filter(s => s.status === 'reviewed').length;
    }
    
    const percentComplete = totalStrings > 0 
      ? Math.round((translatedCount / totalStrings) * 100)
      : 0;
    
    await db.collection('translation_projects').updateOne(
      { projectId: projectId },
      {
        $set: {
          'progress.totalStrings': totalStrings,
          'progress.translatedStrings': translatedCount,
          'progress.reviewedStrings': reviewedCount,
          'progress.percentComplete': percentComplete,
          'updatedAt': new Date()
        }
      }
    );
    
    console.log(`📊 Project progress: ${percentComplete}% (${translatedCount}/${totalStrings})`);
    
  } catch (error) {
    console.error(`❌ Failed to update progress: ${error.message}`);
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// Export Functionality
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Export translated file in original format
 */
async function exportTranslation(projectId, fileId, outputPath) {
  const db = await connectMongo();
  
  try {
    const file = await db.collection('translation_files').findOne({
      projectId: projectId,
      _id: fileId
    });
    
    if (!file) {
      throw new Error('File not found');
    }
    
    let content;
    
    switch (file.format) {
      case 'json':
        content = buildJsonExport(file.strings);
        break;
      case 'csv':
        content = buildCSVExport(file.strings);
        break;
      case 'po':
        content = buildPoExport(file.strings);
        break;
      default:
        throw new Error(`Unsupported format: ${file.format}`);
    }
    
    fs.writeFileSync(outputPath, content, 'utf8');
    
    console.log(`✅ Exported: ${outputPath}`);
    return { success: true, outputPath: outputPath };
    
  } catch (error) {
    console.error(`❌ Export failed: ${error.message}`);
    return { success: false, error: error.message };
  }
}

function buildJsonExport(strings) {
  const result = {};
  
  strings.forEach(str => {
    const keys = str.id.split('.');
    let current = result;
    
    for (let i = 0; i < keys.length - 1; i++) {
      if (!current[keys[i]]) {
        current[keys[i]] = {};
      }
      current = current[keys[i]];
    }
    
    current[keys[keys.length - 1]] = str.translated || str.original;
  });
  
  return JSON.stringify(result, null, 2);
}

function buildCSVExport(strings) {
  let csv = 'id,original,translated,context\n';
  
  strings.forEach(str => {
    const row = [
      `"${str.id}"`,
      `"${str.original.replace(/"/g, '""')}"`,
      `"${(str.translated || '').replace(/"/g, '""')}"`,
      `"${(str.context || '').replace(/"/g, '""')}"`
    ];
    csv += row.join(',') + '\n';
  });
  
  return csv;
}

function buildPoExport(strings) {
  let po = '# Vietnamese translation\n';
  po += `msgid ""\nmsgstr ""\n`;
  po += `"Language: vi\\n"\n`;
  po += `"Content-Type: text/plain; charset=UTF-8\\n"\n\n`;
  
  strings.forEach(str => {
    po += `msgid "${str.original}"\n`;
    po += `msgstr "${str.translated || ''}"\n\n`;
  });
  
  return po;
}

// ═══════════════════════════════════════════════════════════════════════════
// CLI Commands
// ═══════════════════════════════════════════════════════════════════════════

async function main() {
  const command = process.argv[2];
  const args = process.argv.slice(3);
  
  console.log(`\n🇻🇳 Game Translation Manager v1.0\n`);
  
  switch (command) {
    case 'create':
      // create <appId> <gameName> [options...]
      await createTranslationProject(args[0], args[1], {
        mainContributor: args[2] || 'Unknown'
      });
      break;
      
    case 'add':
      // add <projectId> <filePath> [fileType]
      await addFileToProject(args[0], args[1], args[2] || 'localization');
      break;
      
    case 'export':
      // export <projectId> <fileId> <outputPath>
      await exportTranslation(args[0], args[1], args[2]);
      break;
      
    case 'list':
      // list [projectId]
      await listProjects(args[0]);
      break;
      
    default:
      showHelp();
  }
  
  process.exit(0);
}

async function listProjects(projectId) {
  const db = await connectMongo();
  
  try {
    let query = {};
    if (projectId) {
      query = { projectId: projectId };
    }
    
    const projects = await db.collection('translation_projects')
      .find(query)
      .toArray();
    
    if (projects.length === 0) {
      console.log('No projects found');
      return;
    }
    
    console.log(`📋 Translation Projects:\n`);
    
    projects.forEach(project => {
      console.log(`📁 ${project.gameName} (AppID: ${project.appId})`);
      console.log(`   ID: ${project.projectId}`);
      console.log(`   Progress: ${project.progress.percentComplete}% (${project.progress.translatedStrings}/${project.progress.totalStrings})`);
      console.log(`   Status: ${project.status}`);
      console.log(`   Created: ${new Date(project.createdAt).toLocaleDateString()}`);
      console.log('');
    });
    
  } catch (error) {
    console.error(`Error: ${error.message}`);
  }
}

function showHelp() {
  console.log(`Usage:
  
  node translation-manager.js create <appId> <gameName> [mainContributor]
    Create a new translation project
    
  node translation-manager.js add <projectId> <filePath> [fileType]
    Add a translation file to project
    fileType: localization (default), dialogue, menu, subtitles
    
  node translation-manager.js export <projectId> <fileId> <outputPath>
    Export translated file in original format
    
  node translation-manager.js list [projectId]
    List all projects or specific project details

Examples:
  
  node translation-manager.js create 1274570 "Devour" "MyName"
  node translation-manager.js add project_123 ./game_strings.json localization
  node translation-manager.js export project_123 file_456 ./output_vi.json
  node translation-manager.js list
  `);
}

// Start
main().catch(console.error);
