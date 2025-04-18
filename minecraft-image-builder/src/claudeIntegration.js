const axios = require('axios');
const fs = require('fs');
const path = require('path');

/**
 * Send image to Claude for pixelization and block mapping
 * @param {string} imagePath - Path to the uploaded image
 * @param {number} gridSize - Size of the pixel grid (default: 50)
 * @returns {Promise<Array>} - 2D array of Minecraft block types
 */
async function processImageWithClaude(imagePath, gridSize = 50) {
  try {
    const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY;
    if (!CLAUDE_API_KEY) {
      throw new Error('Claude API key not found. Please set the CLAUDE_API_KEY environment variable.');
    }

    // Read the image as base64
    const imageBuffer = await fs.promises.readFile(imagePath);
    const base64Image = imageBuffer.toString('base64');
    const mimeType = path.extname(imagePath).toLowerCase() === '.png' ? 'image/png' : 'image/jpeg';

    // Create the prompt for Claude
    const prompt = `
    I'm sending you an image that I want to convert into a Minecraft pixel art.
    
    1. First, pixelize this image to a ${gridSize}x${gridSize} grid.
    2. For each pixel, determine the best matching Minecraft block (using only wool, concrete, or terracotta).
    3. Return a 2D array in JSON format where each element is a string with the block name.
    
    For example: [["red_wool", "blue_concrete", ...], [...], ...]
    
    Use only valid Minecraft block names. Focus on accuracy of color matching.
    Please ONLY return the JSON array and nothing else.
    `;

    // Call Claude API
    const response = await axios.post('https://api.anthropic.com/v1/messages', {
      model: 'claude-3-sonnet-20240229',
      max_tokens: 100000,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: prompt
            },
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: mimeType,
                data: base64Image
              }
            }
          ]
        }
      ]
    }, {
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': CLAUDE_API_KEY,
        'anthropic-version': '2023-06-01'
      }
    });

    // Extract the response content
    const content = response.data.content[0].text;
    
    // Parse the JSON array from the response
    const jsonMatch = content.match(/\[\s*\[.*\]\s*\]/s);
    
    if (!jsonMatch) {
      throw new Error('Failed to parse blocks array from Claude response');
    }
    
    const blocksGrid = JSON.parse(jsonMatch[0]);
    
    // Validate the response
    if (!Array.isArray(blocksGrid) || !blocksGrid.every(row => Array.isArray(row))) {
      throw new Error('Claude returned an invalid blocks grid format');
    }
    
    return blocksGrid;
  } catch (error) {
    console.error('Error processing image with Claude:', error);
    
    // If Claude processing fails, use the fallback method
    return fallbackProcessImage(imagePath, gridSize);
  }
}

/**
 * Fallback function to process and convert image without using Claude
 * @param {string} imagePath - Path to the uploaded image
 * @param {number} gridSize - Size of the pixel grid
 * @returns {Promise<Array>} - 2D array of Minecraft block types
 */
async function fallbackProcessImage(imagePath, gridSize) {
  console.log('Using fallback image processing method...');
  
  // Import local image processor here to avoid circular dependencies
  const { processImage } = require('./imageProcessor');
  
  // Process the image to get pixel data
  const pixelData = await processImage(imagePath, gridSize);
  
  // Convert pixels to blocks using the local algorithm
  return fallbackRgbToBlocks(pixelData.grid);
}

/**
 * Fallback function to convert RGB values to Minecraft blocks
 * @param {Array} pixelGrid - 2D array of RGB values
 * @returns {Array} - 2D array of Minecraft block types
 */
function fallbackRgbToBlocks(pixelGrid) {
  // Define a simple mapping of colors to blocks
  const colorMap = [
    { name: 'white_wool', r: 255, g: 255, b: 255 },
    { name: 'light_gray_wool', r: 180, g: 180, b: 180 },
    { name: 'gray_wool', r: 120, g: 120, b: 120 },
    { name: 'black_wool', r: 0, g: 0, b: 0 },
    { name: 'red_wool', r: 255, g: 0, b: 0 },
    { name: 'orange_wool', r: 255, g: 165, b: 0 },
    { name: 'yellow_wool', r: 255, g: 255, b: 0 },
    { name: 'lime_wool', r: 0, g: 255, b: 0 },
    { name: 'green_wool', r: 0, g: 128, b: 0 },
    { name: 'cyan_wool', r: 0, g: 255, b: 255 },
    { name: 'light_blue_wool', r: 135, g: 206, b: 250 },
    { name: 'blue_wool', r: 0, g: 0, b: 255 },
    { name: 'purple_wool', r: 128, g: 0, b: 128 },
    { name: 'magenta_wool', r: 255, g: 0, b: 255 },
    { name: 'pink_wool', r: 255, g: 192, b: 203 },
    { name: 'brown_wool', r: 139, g: 69, b: 19 }
  ];

  // Calculate Euclidean distance between two colors
  function colorDistance(color1, color2) {
    return Math.sqrt(
      Math.pow(color1.r - color2.r, 2) +
      Math.pow(color1.g - color2.g, 2) +
      Math.pow(color1.b - color2.b, 2)
    );
  }

  // Map each pixel to the closest matching block
  return pixelGrid.map(row => {
    return row.map(pixel => {
      // Find the closest color in our map
      let closestBlock = colorMap[0];
      let minDistance = colorDistance(pixel, colorMap[0]);

      for (let i = 1; i < colorMap.length; i++) {
        const distance = colorDistance(pixel, colorMap[i]);
        if (distance < minDistance) {
          minDistance = distance;
          closestBlock = colorMap[i];
        }
      }

      return closestBlock.name;
    });
  });
}

module.exports = {
  processImageWithClaude,
  fallbackRgbToBlocks
}; 