#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { processImageWithClaude } = require('./claudeIntegration');
const { createBot } = require('./minecraftBot');
const readline = require('readline');

// Configure readline interface
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Make sure required env variables are set
if (!process.env.CLAUDE_API_KEY) {
  console.error('Error: CLAUDE_API_KEY environment variable is not set.');
  console.error('Please set your Claude API key in the .env file or environment variables.');
  process.exit(1);
}

// Create the Minecraft bot
let minecraftBot;
try {
  minecraftBot = createBot({
    host: process.env.MC_HOST || 'localhost',
    port: parseInt(process.env.MC_PORT || '25565'),
    username: process.env.MC_USERNAME || 'PixelArtBot',
    version: process.env.MC_VERSION || '1.19.2'
  });
  
  console.log('Minecraft bot initialized and connecting to server...');
} catch (error) {
  console.error('Failed to initialize Minecraft bot:', error);
  process.exit(1);
}

// Wait for the bot to spawn before proceeding
minecraftBot.once('spawn', () => {
  console.log('Bot spawned in the Minecraft world. Ready to build!');
  startCLI();
});

// Start the CLI interface
function startCLI() {
  console.log('\n=== Minecraft Image Builder CLI ===');
  console.log('Enter the path to an image file to build it in Minecraft.\n');
  
  promptForImage();
}

// Prompt for image path
function promptForImage() {
  rl.question('Image path: ', async (imagePath) => {
    // Check if file exists
    if (!fs.existsSync(imagePath)) {
      console.error(`Error: File "${imagePath}" does not exist.`);
      return promptForImage();
    }
    
    // Check if file is an image
    const ext = path.extname(imagePath).toLowerCase();
    if (!['.jpg', '.jpeg', '.png', '.gif', '.bmp'].includes(ext)) {
      console.error('Error: File must be an image (jpg, png, gif, bmp).');
      return promptForImage();
    }
    
    // Get grid size
    rl.question('Grid size (10-100, default: 50): ', async (gridSizeInput) => {
      const gridSize = parseInt(gridSizeInput) || 50;
      if (gridSize < 10 || gridSize > 100) {
        console.log('Using default grid size of 50 (input out of range).');
      }
      
      // Get build position
      rl.question('Build position (x,y,z, default: 0,64,0): ', async (posInput) => {
        let startX = 0, startY = 64, startZ = 0;
        
        if (posInput && posInput.includes(',')) {
          const [x, y, z] = posInput.split(',').map(p => parseInt(p.trim()));
          startX = isNaN(x) ? 0 : x;
          startY = isNaN(y) ? 64 : y;
          startZ = isNaN(z) ? 0 : z;
        }
        
        // Get orientation
        rl.question('Build orientation (vertical/horizontal, default: vertical): ', async (orientInput) => {
          const orientation = orientInput && orientInput.toLowerCase() === 'horizontal' ? 'horizontal' : 'vertical';
          
          // Process the image with Claude
          console.log(`\nProcessing image: ${imagePath}`);
          console.log(`Grid size: ${gridSize}x${gridSize}`);
          console.log(`Build position: ${startX},${startY},${startZ}`);
          console.log(`Orientation: ${orientation}`);
          console.log('\nSending to Claude for analysis...');
          
          try {
            // Process image
            const blocksGrid = await processImageWithClaude(imagePath, gridSize);
            
            // Save the blocks data to a file
            const filename = path.basename(imagePath, path.extname(imagePath));
            const outputDir = path.join(__dirname, '..', 'outputs');
            
            // Create output directory if it doesn't exist
            if (!fs.existsSync(outputDir)) {
              fs.mkdirSync(outputDir, { recursive: true });
            }
            
            const blocksDataPath = path.join(outputDir, `${filename}-blocks.json`);
            await fs.promises.writeFile(blocksDataPath, JSON.stringify(blocksGrid, null, 2));
            console.log(`Blocks data saved to: ${blocksDataPath}`);
            
            // Create a simple visualization
            const visualizationPath = path.join(outputDir, `${filename}-visualization.txt`);
            const visualization = blocksGrid.map(row => row.map(block => {
              // Create a simple visualization using first letter or symbol of each block
              if (block.includes('white')) return 'W';
              if (block.includes('light_gray')) return 'l';
              if (block.includes('gray')) return 'g';
              if (block.includes('black')) return 'B';
              if (block.includes('red')) return 'R';
              if (block.includes('orange')) return 'O';
              if (block.includes('yellow')) return 'Y';
              if (block.includes('lime')) return 'L';
              if (block.includes('green')) return 'G';
              if (block.includes('cyan')) return 'C';
              if (block.includes('light_blue')) return 'b';
              if (block.includes('blue')) return 'U';
              if (block.includes('purple')) return 'P';
              if (block.includes('magenta')) return 'M';
              if (block.includes('pink')) return 'K';
              if (block.includes('brown')) return 'N';
              return '?';
            }).join('')).join('\n');
            
            await fs.promises.writeFile(visualizationPath, visualization);
            console.log(`Visualization saved to: ${visualizationPath}`);
            
            // Ask if the user wants to build it
            rl.question('\nStart building in Minecraft? (y/n): ', async (answer) => {
              if (answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes') {
                console.log('\nStarting build process...');
                
                // Build the image
                await minecraftBot.buildImage(blocksGrid, {
                  startX,
                  startY,
                  startZ,
                  orientation,
                  delay: 250 // Quarter second between block placements
                });
                
                console.log('\nBuild completed!');
              }
              
              // Ask if the user wants to process another image
              rl.question('\nProcess another image? (y/n): ', (answer) => {
                if (answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes') {
                  promptForImage();
                } else {
                  console.log('Goodbye!');
                  process.exit(0);
                }
              });
            });
          } catch (error) {
            console.error('Error processing image:', error);
            promptForImage();
          }
        });
      });
    });
  });
}

// Handle CTRL+C to exit gracefully
rl.on('SIGINT', () => {
  console.log('\nExiting...');
  process.exit(0);
}); 