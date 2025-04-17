const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

/**
 * Process an image to generate a pixel grid
 * @param {string} imagePath - Path to the uploaded image
 * @param {number} size - Size of the pixel grid (default: 50)
 * @returns {Promise<Object>} - RGB pixel grid
 */
async function processImage(imagePath, size = 50) {
  try {
    // Resize the image to the specified size and convert to raw RGB pixel data
    const { data, info } = await sharp(imagePath)
      .resize(size, size, {
        fit: 'fill',
        position: 'center'
      })
      .raw()
      .toBuffer({ resolveWithObject: true });

    // Create a 2D array of pixels from the raw data
    const pixelGrid = [];
    
    // Calculate the stride
    const stride = info.width * info.channels;
    
    // Process each row
    for (let y = 0; y < info.height; y++) {
      const row = [];
      
      // Process each pixel in the row
      for (let x = 0; x < info.width; x++) {
        const offset = y * stride + x * info.channels;
        
        // Create an RGB object for each pixel
        const pixel = {
          r: data[offset],
          g: data[offset + 1],
          b: data[offset + 2]
        };
        
        row.push(pixel);
      }
      
      pixelGrid.push(row);
    }
    
    return {
      grid: pixelGrid,
      width: info.width,
      height: info.height
    };
  } catch (error) {
    console.error('Error processing image:', error);
    throw new Error('Failed to process image');
  }
}

/**
 * Save the processed pixel grid as a JSON file
 * @param {Object} pixelData - The processed pixel grid data
 * @param {string} filename - Name to save the file as
 * @returns {Promise<string>} - Path to the saved file
 */
async function savePixelData(pixelData, filename) {
  try {
    const outputPath = path.join(__dirname, '..', 'uploads', `${filename}.json`);
    await fs.promises.writeFile(outputPath, JSON.stringify(pixelData, null, 2));
    return outputPath;
  } catch (error) {
    console.error('Error saving pixel data:', error);
    throw new Error('Failed to save pixel data');
  }
}

module.exports = {
  processImage,
  savePixelData
}; 