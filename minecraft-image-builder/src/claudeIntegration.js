const axios = require('axios');

/**
 * Convert RGB pixel data to Minecraft block types using Claude API
 * @param {Array} pixelGrid - 2D array of RGB values
 * @returns {Promise<Array>} - 2D array of Minecraft block types
 */
async function convertPixelsToBlocks(pixelGrid) {
  try {
    const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY;
    if (!CLAUDE_API_KEY) {
      throw new Error('Claude API key not found. Please set the CLAUDE_API_KEY environment variable.');
    }

    // Convert the pixel grid to a simple string format for the prompt
    const gridData = JSON.stringify(pixelGrid);

    // Create the prompt for Claude
    const prompt = `
    Here is a ${pixelGrid.length}x${pixelGrid[0].length} grid of RGB colors represented as an array of arrays. 
    Each element is an object with r, g, b values from 0-255:
    
    ${gridData}
    
    For each pixel in this grid, suggest the best matching Minecraft block (using only wool, concrete, or terracotta).
    Output ONLY a 2D array in JSON format where each element is a string with the block name.
    For example: [["red_wool", "blue_concrete", ...], [...], ...].
    Use only valid Minecraft block names with no additional explanation.
    `;

    // Call Claude API
    const response = await axios.post('https://api.anthropic.com/v1/messages', {
      model: 'claude-3-sonnet-20240229',
      max_tokens: 100000,
      messages: [
        {
          role: 'user',
          content: prompt
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
    // Extract just the JSON array part of the response
    const jsonMatch = content.match(/\[\s*\[.*\]\s*\]/s);
    
    if (!jsonMatch) {
      throw new Error('Failed to parse blocks array from Claude response');
    }
    
    const blocksGrid = JSON.parse(jsonMatch[0]);
    
    // Validate the response
    if (!Array.isArray(blocksGrid) || 
        blocksGrid.length !== pixelGrid.length || 
        !blocksGrid.every(row => Array.isArray(row) && row.length === pixelGrid[0].length)) {
      throw new Error('Claude returned an invalid blocks grid format');
    }
    
    return blocksGrid;
  } catch (error) {
    console.error('Error converting pixels to blocks with Claude:', error);
    
    // Fallback: use a simple algorithm to map RGB to blocks
    return fallbackRgbToBlocks(pixelGrid);
  }
}

/**
 * Fallback function to convert RGB values to Minecraft blocks without using Claude
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
  convertPixelsToBlocks
}; 