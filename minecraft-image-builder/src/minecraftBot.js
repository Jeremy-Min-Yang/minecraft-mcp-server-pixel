const mineflayer = require('mineflayer');
const { Vec3 } = require('vec3');

// Store the progress information
let buildProgress = {
  progress: 0,
  message: 'Waiting to start building...',
  isBuilding: false
};

// Map of block names to item names (some blocks have different item names)
const blockToItemMap = {
  // Default mapping (most blocks have the same name as their items)
  // Some special cases below
  'white_wool': 'white_wool',
  'orange_wool': 'orange_wool',
  'magenta_wool': 'magenta_wool',
  'light_blue_wool': 'light_blue_wool',
  'yellow_wool': 'yellow_wool',
  'lime_wool': 'lime_wool',
  'pink_wool': 'pink_wool',
  'gray_wool': 'gray_wool',
  'light_gray_wool': 'light_gray_wool',
  'cyan_wool': 'cyan_wool',
  'purple_wool': 'purple_wool',
  'blue_wool': 'blue_wool',
  'brown_wool': 'brown_wool',
  'green_wool': 'green_wool',
  'red_wool': 'red_wool',
  'black_wool': 'black_wool',
  // Concrete blocks
  'white_concrete': 'white_concrete',
  'orange_concrete': 'orange_concrete',
  'magenta_concrete': 'magenta_concrete',
  'light_blue_concrete': 'light_blue_concrete',
  'yellow_concrete': 'yellow_concrete',
  'lime_concrete': 'lime_concrete',
  'pink_concrete': 'pink_concrete',
  'gray_concrete': 'gray_concrete',
  'light_gray_concrete': 'light_gray_concrete',
  'cyan_concrete': 'cyan_concrete',
  'purple_concrete': 'purple_concrete',
  'blue_concrete': 'blue_concrete',
  'brown_concrete': 'brown_concrete',
  'green_concrete': 'green_concrete',
  'red_concrete': 'red_concrete',
  'black_concrete': 'black_concrete',
  // Terracotta blocks
  'white_terracotta': 'white_terracotta',
  'orange_terracotta': 'orange_terracotta',
  'magenta_terracotta': 'magenta_terracotta',
  'light_blue_terracotta': 'light_blue_terracotta',
  'yellow_terracotta': 'yellow_terracotta',
  'lime_terracotta': 'lime_terracotta',
  'pink_terracotta': 'pink_terracotta',
  'gray_terracotta': 'gray_terracotta',
  'light_gray_terracotta': 'light_gray_terracotta',
  'cyan_terracotta': 'cyan_terracotta',
  'purple_terracotta': 'purple_terracotta',
  'blue_terracotta': 'blue_terracotta',
  'brown_terracotta': 'brown_terracotta',
  'green_terracotta': 'green_terracotta',
  'red_terracotta': 'red_terracotta',
  'black_terracotta': 'black_terracotta',
  'terracotta': 'terracotta'
};

/**
 * Create and initialize a Minecraft bot
 * @param {Object} options - Options for connecting to the server
 * @returns {Object} - The bot instance
 */
function createBot(options = {}) {
  const defaultOptions = {
    host: 'localhost',
    port: 25565,
    username: 'PixelArtBot',
    version: '1.19.2'
  };

  // Merge default options with provided options
  const botOptions = { ...defaultOptions, ...options };
  
  // Create the bot
  const bot = mineflayer.createBot(botOptions);
  
  // Set up event handlers
  bot.once('spawn', () => {
    console.log('Bot spawned in the Minecraft world');
    buildProgress.message = 'Bot connected to Minecraft server';
  });
  
  bot.on('error', (err) => {
    console.error('Bot error:', err);
    buildProgress.message = `Error: ${err.message}`;
  });
  
  bot.on('kicked', (reason) => {
    console.log('Bot was kicked:', reason);
    buildProgress.message = `Bot was kicked: ${reason}`;
  });
  
  bot.on('end', () => {
    console.log('Bot disconnected');
    buildProgress.message = 'Bot disconnected from server';
    buildProgress.isBuilding = false;
  });
  
  // Add custom methods to the bot
  
  /**
   * Place a block at the specified position
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate
   * @param {number} z - Z coordinate
   * @param {string} blockName - Name of the block to place
   * @returns {Promise<boolean>} - Whether the block was successfully placed
   */
  bot.placeBlock = async function(x, y, z, blockName) {
    try {
      const position = new Vec3(x, y, z);
      
      // Find the item in inventory
      const itemName = blockToItemMap[blockName] || blockName;
      await this.equip(itemName, 'hand');
      
      // Find a face to place against
      const faceVectors = [
        new Vec3(0, -1, 0), // Bottom
        new Vec3(0, 1, 0),  // Top
        new Vec3(-1, 0, 0), // West
        new Vec3(1, 0, 0),  // East
        new Vec3(0, 0, -1), // North
        new Vec3(0, 0, 1)   // South
      ];
      
      // Try each face until one works
      for (const faceVector of faceVectors) {
        const adjacentPosition = position.clone().add(faceVector);
        const block = this.blockAt(adjacentPosition);
        
        if (block && block.name !== 'air') {
          // Place the block against this face
          await this.placeBlock(block, faceVector.scaled(-1));
          return true;
        }
      }
      
      return false;
    } catch (error) {
      console.error('Error placing block:', error);
      return false;
    }
  };
  
  /**
   * Build a pixel art image from a block grid
   * @param {Array} blockGrid - 2D array of block names
   * @param {Object} options - Building options
   * @returns {Promise<void>}
   */
  bot.buildImage = async function(blockGrid, options = {}) {
    const defaultBuildOptions = {
      startX: 0,
      startY: 64,
      startZ: 0,
      orientation: 'horizontal', // 'horizontal' or 'vertical'
      delay: 250 // ms between block placements
    };
    
    const buildOptions = { ...defaultBuildOptions, ...options };
    const { startX, startY, startZ, orientation, delay } = buildOptions;
    
    if (buildProgress.isBuilding) {
      console.log('Already building. Please wait for the current build to finish.');
      return;
    }
    
    buildProgress.isBuilding = true;
    buildProgress.progress = 0;
    buildProgress.message = 'Starting build process...';
    
    const height = blockGrid.length;
    const width = blockGrid[0].length;
    const totalBlocks = width * height;
    
    try {
      // Teleport to the starting position
      if (this.entity.username !== 'PixelArtBot') {
        // Only teleport if this is a player (for testing)
        this.chat(`/teleport ${startX} ${startY} ${startZ}`);
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
      // Build the image
      for (let row = 0; row < height; row++) {
        buildProgress.message = `Building row ${row + 1} of ${height}...`;
        
        for (let col = 0; col < width; col++) {
          const blockName = blockGrid[row][col];
          
          let x, y, z;
          if (orientation === 'horizontal') {
            // Build flat on the ground
            x = startX + col;
            y = startY;
            z = startZ + row;
          } else {
            // Build vertically like a wall
            x = startX;
            y = startY + (height - row - 1); // Start from the top
            z = startZ + col;
          }
          
          await this.placeBlock(x, y, z, blockName);
          
          // Update progress
          const blockCount = row * width + col + 1;
          buildProgress.progress = Math.floor((blockCount / totalBlocks) * 100);
          
          // Delay between block placements
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
      
      buildProgress.message = 'Build completed successfully!';
      buildProgress.progress = 100;
    } catch (error) {
      console.error('Error building image:', error);
      buildProgress.message = `Error building: ${error.message}`;
    } finally {
      buildProgress.isBuilding = false;
    }
  };
  
  return bot;
}

/**
 * Get the current build progress
 * @returns {Object} - Progress information
 */
function getBuildProgress() {
  return buildProgress;
}

module.exports = {
  createBot,
  getBuildProgress
}; 