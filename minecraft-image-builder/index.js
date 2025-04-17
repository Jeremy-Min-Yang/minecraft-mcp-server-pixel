/**
 * Minecraft Image Builder
 * Entry point file that starts the server
 */

// Check for dotenv and load environment variables if available
try {
  require('dotenv').config();
} catch (error) {
  console.log('dotenv not installed, skipping environment variable loading from .env file');
}

// Start the server
require('./src/server'); 