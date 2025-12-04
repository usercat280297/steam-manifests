const { spawn } = require('child_process');

console.log('🚀 Starting all bots...\n');

// Start auto-update bot
const updateBot = spawn('node', ['auto-update-queue-enhanced.js'], {
  stdio: 'inherit'
});

// Start manifest bot
const manifestBot = spawn('node', ['manifest-bot.js'], {
  stdio: 'inherit'
});

updateBot.on('error', (error) => {
  console.error('❌ Update bot error:', error);
});

manifestBot.on('error', (error) => {
  console.error('❌ Manifest bot error:', error);
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('\n⏹️  Shutting down...');
  updateBot.kill();
  manifestBot.kill();
  process.exit(0);
});

console.log('✨ Both bots are running!');
console.log('📊 Update bot: Checking game updates');
console.log('📦 Manifest bot: Generating manifests\n');