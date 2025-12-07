#!/usr/bin/env node
/**
 * 🇻🇳 Discord Translation Bot
 * Track and manage game translation projects via Discord
 */

const { Client, GatewayIntentBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, SlashCommandBuilder } = require('discord.js');
const axios = require('axios');
const { MongoClient } = require('mongodb');
require('dotenv').config();
require('dotenv').config({ path: '.env.local' });

// ═══════════════════════════════════════════════════════════════════════════
// Configuration
// ═══════════════════════════════════════════════════════════════════════════

const CONFIG = {
  DISCORD_TOKEN: process.env.DISCORD_BOT_TOKEN,
  DISCORD_CHANNEL_ID: process.env.TRANSLATION_CHANNEL_ID || '1000000000000000000',
  MONGODB_URI: process.env.MONGODB_URI,
  STATUS_UPDATE_INTERVAL: 60000 // Check every minute
};

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });
let mongoDb = null;

// ═══════════════════════════════════════════════════════════════════════════
// MongoDB Connection
// ═══════════════════════════════════════════════════════════════════════════

async function connectMongo() {
  if (mongoDb) return mongoDb;
  
  try {
    const dbClient = new MongoClient(CONFIG.MONGODB_URI);
    await dbClient.connect();
    mongoDb = dbClient.db('steam-manifest');
    console.log('✅ MongoDB connected');
    return mongoDb;
  } catch (error) {
    console.error('❌ MongoDB failed:', error.message);
    process.exit(1);
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// Discord Bot Events
// ═══════════════════════════════════════════════════════════════════════════

client.once('ready', async () => {
  console.log(`✅ Discord Bot ready as ${client.user.tag}`);
  await connectMongo();
  
  // Register slash commands
  await registerCommands();
  
  // Start periodic status updates
  startStatusUpdates();
});

client.on('interactionCreate', async (interaction) => {
  if (!interaction.isChatInputCommand()) return;
  
  const command = interaction.commandName;
  
  try {
    switch (command) {
      case 'project_create':
        await handleProjectCreate(interaction);
        break;
      case 'project_list':
        await handleProjectList(interaction);
        break;
      case 'project_status':
        await handleProjectStatus(interaction);
        break;
      case 'file_add':
        await handleFileAdd(interaction);
        break;
      case 'translation_progress':
        await handleTranslationProgress(interaction);
        break;
      default:
        await interaction.reply('❌ Unknown command');
    }
  } catch (error) {
    console.error(`Error handling ${command}:`, error);
    await interaction.reply('❌ Error processing command').catch(() => {});
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// Slash Commands Registration
// ═══════════════════════════════════════════════════════════════════════════

async function registerCommands() {
  const commands = [
    new SlashCommandBuilder()
      .setName('project_create')
      .setDescription('Create a new translation project')
      .addNumberOption(o => o.setName('appid').setDescription('Steam App ID').setRequired(true))
      .addStringOption(o => o.setName('game').setDescription('Game name').setRequired(true))
      .addStringOption(o => o.setName('translator').setDescription('Your name').setRequired(true)),
      
    new SlashCommandBuilder()
      .setName('project_list')
      .setDescription('List all translation projects'),
      
    new SlashCommandBuilder()
      .setName('project_status')
      .setDescription('Get project status')
      .addStringOption(o => o.setName('projectid').setDescription('Project ID').setRequired(true)),
      
    new SlashCommandBuilder()
      .setName('file_add')
      .setDescription('Add translation file to project')
      .addStringOption(o => o.setName('projectid').setDescription('Project ID').setRequired(true))
      .addStringOption(o => o.setName('filetype').setDescription('File type (localization/dialogue/menu/subtitles)').setRequired(true)),
      
    new SlashCommandBuilder()
      .setName('translation_progress')
      .setDescription('Show translation progress chart')
      .addStringOption(o => o.setName('projectid').setDescription('Project ID').setRequired(true))
  ];
  
  try {
    const guild = await client.guilds.fetch(process.env.DISCORD_GUILD_ID);
    if (guild) {
      await guild.commands.set(commands);
      console.log('✅ Slash commands registered');
    }
  } catch (error) {
    console.error('Failed to register commands:', error.message);
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// Command Handlers
// ═══════════════════════════════════════════════════════════════════════════

async function handleProjectCreate(interaction) {
  await interaction.deferReply();
  
  const appId = interaction.options.getNumber('appid');
  const gameName = interaction.options.getString('game');
  const translator = interaction.options.getString('translator');
  
  const db = await connectMongo();
  
  const projectId = `${appId}_${Date.now()}`;
  
  const projectData = {
    projectId: projectId,
    appId: appId,
    gameName: gameName,
    targetLanguage: 'vi',
    sourceLanguage: 'en',
    status: 'active',
    createdAt: new Date(),
    updatedAt: new Date(),
    progress: {
      totalStrings: 0,
      translatedStrings: 0,
      reviewedStrings: 0,
      percentComplete: 0
    },
    files: [],
    contributors: [translator],
    discordAuthor: interaction.user.id,
    discordUsername: interaction.user.tag
  };
  
  try {
    await db.collection('translation_projects').insertOne(projectData);
    
    const embed = new EmbedBuilder()
      .setColor(0x2ecc71)
      .setTitle('✅ Project Created')
      .setDescription(`New translation project for **${gameName}**`)
      .addFields(
        { name: 'Project ID', value: `\`${projectId}\``, inline: false },
        { name: 'App ID', value: `${appId}`, inline: true },
        { name: 'Main Translator', value: translator, inline: true },
        { name: 'Language', value: '🇻🇳 Vietnamese', inline: true }
      )
      .setTimestamp();
    
    await interaction.editReply({ embeds: [embed] });
    
    // Send to translation channel
    const channel = await client.channels.fetch(CONFIG.DISCORD_CHANNEL_ID);
    await channel.send({ embeds: [embed] });
    
  } catch (error) {
    await interaction.editReply(`❌ Error: ${error.message}`);
  }
}

async function handleProjectList(interaction) {
  await interaction.deferReply();
  
  const db = await connectMongo();
  
  try {
    const projects = await db.collection('translation_projects')
      .find({})
      .sort({ createdAt: -1 })
      .toArray();
    
    if (projects.length === 0) {
      await interaction.editReply('📭 No projects found');
      return;
    }
    
    const embed = new EmbedBuilder()
      .setColor(0x3498db)
      .setTitle('📋 Translation Projects')
      .setDescription(`${projects.length} project(s) in total`);
    
    projects.slice(0, 10).forEach(p => {
      embed.addFields({
        name: `${p.gameName} (${p.appId})`,
        value: `**Progress:** ${p.progress.percentComplete}% (${p.progress.translatedStrings}/${p.progress.totalStrings})\n**Status:** ${p.status}\n**ID:** \`${p.projectId}\``,
        inline: false
      });
    });
    
    await interaction.editReply({ embeds: [embed] });
    
  } catch (error) {
    await interaction.editReply(`❌ Error: ${error.message}`);
  }
}

async function handleProjectStatus(interaction) {
  await interaction.deferReply();
  
  const projectId = interaction.options.getString('projectid');
  const db = await connectMongo();
  
  try {
    const project = await db.collection('translation_projects').findOne({ projectId });
    
    if (!project) {
      await interaction.editReply('❌ Project not found');
      return;
    }
    
    const progressBar = createProgressBar(project.progress.percentComplete);
    
    const embed = new EmbedBuilder()
      .setColor(0x9b59b6)
      .setTitle(`📊 ${project.gameName}`)
      .addFields(
        { name: 'Project ID', value: `\`${projectId}\``, inline: true },
        { name: 'App ID', value: `${project.appId}`, inline: true },
        { name: 'Status', value: project.status, inline: true },
        { name: 'Progress', value: progressBar, inline: false },
        { name: 'Translated', value: `${project.progress.translatedStrings}/${project.progress.totalStrings}`, inline: true },
        { name: 'Percentage', value: `${project.progress.percentComplete}%`, inline: true },
        { name: 'Contributors', value: project.contributors.join(', ') || 'None', inline: false },
        { name: 'Created', value: new Date(project.createdAt).toLocaleDateString(), inline: true },
        { name: 'Updated', value: new Date(project.updatedAt).toLocaleDateString(), inline: true }
      )
      .setTimestamp();
    
    await interaction.editReply({ embeds: [embed] });
    
  } catch (error) {
    await interaction.editReply(`❌ Error: ${error.message}`);
  }
}

async function handleFileAdd(interaction) {
  await interaction.deferReply();
  
  const projectId = interaction.options.getString('projectid');
  const fileType = interaction.options.getString('filetype');
  const db = await connectMongo();
  
  try {
    const project = await db.collection('translation_projects').findOne({ projectId });
    
    if (!project) {
      await interaction.editReply('❌ Project not found');
      return;
    }
    
    const embed = new EmbedBuilder()
      .setColor(0xe74c3c)
      .setTitle('📁 File Management')
      .setDescription(`**Project:** ${project.gameName}\n**File Type:** ${fileType}`)
      .addFields(
        { name: 'Instructions', value: '1. Upload your file\n2. Run: `node translation-manager.js add <projectId> <filePath> <fileType>`\n3. Check progress with `/translation_progress`', inline: false }
      )
      .setFooter({ text: `ProjectID: ${projectId}` });
    
    await interaction.editReply({ embeds: [embed] });
    
  } catch (error) {
    await interaction.editReply(`❌ Error: ${error.message}`);
  }
}

async function handleTranslationProgress(interaction) {
  await interaction.deferReply();
  
  const projectId = interaction.options.getString('projectid');
  const db = await connectMongo();
  
  try {
    const project = await db.collection('translation_projects').findOne({ projectId });
    const files = await db.collection('translation_files')
      .find({ projectId })
      .toArray();
    
    if (!project) {
      await interaction.editReply('❌ Project not found');
      return;
    }
    
    const embed = new EmbedBuilder()
      .setColor(0xf39c12)
      .setTitle(`📈 ${project.gameName} - Detailed Progress`)
      .addFields(
        { name: 'Overall Progress', value: createProgressBar(project.progress.percentComplete), inline: false },
        { name: 'Statistics', value: `
🔤 Total Strings: **${project.progress.totalStrings}**
✅ Translated: **${project.progress.translatedStrings}**
👁️ Reviewed: **${project.progress.reviewedStrings}**
⏳ Pending: **${project.progress.totalStrings - project.progress.translatedStrings}**
        `, inline: false }
      );
    
    if (files.length > 0) {
      embed.addFields({
        name: `Files (${files.length})`,
        value: files.map(f => `• **${f.fileName}** - ${f.format.toUpperCase()} - ${Math.round((f.translatedCount / f.totalStrings) * 100)}%`).join('\n'),
        inline: false
      });
    }
    
    embed.setTimestamp();
    
    await interaction.editReply({ embeds: [embed] });
    
  } catch (error) {
    await interaction.editReply(`❌ Error: ${error.message}`);
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// Status Updates
// ═══════════════════════════════════════════════════════════════════════════

function startStatusUpdates() {
  setInterval(async () => {
    try {
      const db = await connectMongo();
      const channel = await client.channels.fetch(CONFIG.DISCORD_CHANNEL_ID);
      
      const projects = await db.collection('translation_projects')
        .find({ status: 'active' })
        .toArray();
      
      if (projects.length === 0) return;
      
      // Create summary embed
      const embed = new EmbedBuilder()
        .setColor(0x1abc9c)
        .setTitle('📊 Translation Status Summary')
        .setDescription(`${projects.length} active project(s)`)
        .setTimestamp();
      
      const totalStrings = projects.reduce((a, p) => a + p.progress.totalStrings, 0);
      const totalTranslated = projects.reduce((a, p) => a + p.progress.translatedStrings, 0);
      const avgProgress = totalStrings > 0 ? Math.round((totalTranslated / totalStrings) * 100) : 0;
      
      embed.addFields({
        name: '🎯 Overall Stats',
        value: `Total Strings: ${totalStrings}\nTranslated: ${totalTranslated}\nAverage Progress: ${avgProgress}%`,
        inline: false
      });
      
      projects.slice(0, 5).forEach(p => {
        embed.addFields({
          name: `${p.gameName} (${p.progress.percentComplete}%)`,
          value: createProgressBar(p.progress.percentComplete),
          inline: false
        });
      });
      
      // Post in channel (limit to once per hour to avoid spam)
      const lastMessageTime = new Date(Date.now() - CONFIG.STATUS_UPDATE_INTERVAL * 60);
      
    } catch (error) {
      console.error('Status update error:', error.message);
    }
  }, CONFIG.STATUS_UPDATE_INTERVAL);
}

// ═══════════════════════════════════════════════════════════════════════════
// Utility Functions
// ═══════════════════════════════════════════════════════════════════════════

function createProgressBar(percentage) {
  const filled = Math.round(percentage / 5);
  const empty = 20 - filled;
  const bar = '█'.repeat(filled) + '░'.repeat(empty);
  return `[${bar}] ${percentage}%`;
}

// ═══════════════════════════════════════════════════════════════════════════
// Start Bot
// ═══════════════════════════════════════════════════════════════════════════

client.login(CONFIG.DISCORD_TOKEN).catch(error => {
  console.error('❌ Discord login failed:', error.message);
  process.exit(1);
});

process.on('SIGINT', () => {
  console.log('\n👋 Bot shutting down...');
  client.destroy();
  process.exit(0);
});
