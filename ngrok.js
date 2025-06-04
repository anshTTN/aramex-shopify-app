const ngrok = require('ngrok');

async function startNgrok() {
  try {
    // Kill any existing tunnels
    await ngrok.kill();
    
    // Start new tunnel
    const url = await ngrok.connect({
      addr: 3001,
      proto: 'http'
    });

    console.log('\n=== Ngrok Tunnel is Running! ===');
    console.log('Your public URL is:', url);
    console.log('Use this URL in your .env file as SHOPIFY_APP_URL');
    console.log('\nKeep this terminal window open while testing.');
    console.log('Press Ctrl+C to stop the tunnel.\n');

    // Handle shutdown
    process.on('SIGINT', async () => {
      console.log('\nShutting down ngrok tunnel...');
      await ngrok.kill();
      process.exit(0);
    });

  } catch (err) {
    console.error('Error while connecting to ngrok:', err);
    process.exit(1);
  }
}

// Start the tunnel
startNgrok(); 