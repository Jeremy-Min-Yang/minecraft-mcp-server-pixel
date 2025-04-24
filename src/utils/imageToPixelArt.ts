import sharp from 'sharp';
import * as fs from 'fs';
import * as path from 'path';

// Define Minecraft block colors with their RGB values
const minecraftBlocks = [
  { name: 'white_wool', rgb: [233, 236, 236] },
  { name: 'light_gray_wool', rgb: [143, 143, 134] },
  { name: 'gray_wool', rgb: [71, 79, 82] },
  { name: 'black_wool', rgb: [29, 29, 33] },
  { name: 'brown_wool', rgb: [106, 76, 54] },
  { name: 'red_wool', rgb: [176, 46, 38] },
  { name: 'orange_wool', rgb: [240, 118, 19] },
  { name: 'yellow_wool', rgb: [248, 198, 39] },
  { name: 'lime_wool', rgb: [112, 185, 25] },
  { name: 'green_wool', rgb: [84, 109, 27] },
  { name: 'cyan_wool', rgb: [22, 156, 156] },
  { name: 'light_blue_wool', rgb: [58, 175, 217] },
  { name: 'blue_wool', rgb: [60, 68, 170] },
  { name: 'purple_wool', rgb: [137, 50, 184] },
  { name: 'magenta_wool', rgb: [199, 78, 189] },
  { name: 'pink_wool', rgb: [243, 139, 170] },
  { name: 'terracotta', rgb: [152, 94, 68] },
  { name: 'white_terracotta', rgb: [210, 178, 161] },
  { name: 'light_gray_terracotta', rgb: [135, 107, 98] },
  { name: 'gray_terracotta', rgb: [86, 66, 62] },
  { name: 'black_terracotta', rgb: [37, 22, 16] },
  { name: 'brown_terracotta', rgb: [86, 51, 36] },
  { name: 'red_terracotta', rgb: [143, 61, 47] },
  { name: 'orange_terracotta', rgb: [162, 84, 38] },
  { name: 'yellow_terracotta', rgb: [186, 133, 35] },
  { name: 'lime_terracotta', rgb: [103, 117, 53] },
  { name: 'green_terracotta', rgb: [76, 83, 42] },
  { name: 'cyan_terracotta', rgb: [87, 91, 91] },
  { name: 'light_blue_terracotta', rgb: [113, 109, 138] },
  { name: 'blue_terracotta', rgb: [74, 60, 91] },
  { name: 'purple_terracotta', rgb: [118, 70, 86] },
  { name: 'magenta_terracotta', rgb: [150, 88, 109] },
  { name: 'pink_terracotta', rgb: [162, 78, 79] },
  { name: 'oak_planks', rgb: [162, 130, 78] },
  { name: 'spruce_planks', rgb: [114, 84, 48] },
  { name: 'birch_planks', rgb: [196, 179, 123] },
  { name: 'jungle_planks', rgb: [160, 115, 80] },
  { name: 'acacia_planks', rgb: [168, 90, 50] },
  { name: 'dark_oak_planks', rgb: [84, 60, 31] },
  { name: 'sand', rgb: [219, 207, 163] },
  { name: 'sandstone', rgb: [224, 215, 164] },
  { name: 'gold_block', rgb: [248, 206, 84] },
  { name: 'iron_block', rgb: [220, 220, 220] },
  { name: 'diamond_block', rgb: [98, 219, 214] },
  { name: 'emerald_block', rgb: [42, 203, 88] },
  { name: 'lapis_block', rgb: [39, 67, 138] },
  { name: 'netherite_block', rgb: [68, 58, 59] },
  { name: 'glass', rgb: [200, 200, 200, 128] }
];

/**
 * Calculate color distance (Euclidean distance in RGB space)
 */
function colorDistance(rgb1: number[], rgb2: number[]): number {
  return Math.sqrt(
    Math.pow(rgb1[0] - rgb2[0], 2) +
    Math.pow(rgb1[1] - rgb2[1], 2) +
    Math.pow(rgb1[2] - rgb2[2], 2)
  );
}

/**
 * Find the closest Minecraft block to an RGB color
 */
function findClosestBlock(rgb: number[]): string {
  let closestBlock = minecraftBlocks[0];
  let minDistance = colorDistance(rgb, minecraftBlocks[0].rgb);
  
  for (let i = 1; i < minecraftBlocks.length; i++) {
    const distance = colorDistance(rgb, minecraftBlocks[i].rgb);
    if (distance < minDistance) {
      minDistance = distance;
      closestBlock = minecraftBlocks[i];
    }
  }
  
  return closestBlock.name;
}

/**
 * Convert image to Minecraft pixel art
 * @param imagePath Path to the image file
 * @param maxWidth Maximum width for the pixel art
 * @param maxHeight Maximum height for the pixel art
 * @returns Promise<string[][]> 2D array of Minecraft block names
 */
export async function imageToPixelArt(
  imagePath: string,
  maxWidth: number = 300,
  maxHeight: number = 300
): Promise<string[][]> {
  try {
    // Get image metadata
    const metadata = await sharp(imagePath).metadata();
    
    // Calculate resize dimensions while maintaining aspect ratio
    let width = metadata.width || 0;
    let height = metadata.height || 0;
    let resizeWidth = width;
    let resizeHeight = height;
    
    if (width > maxWidth || height > maxHeight) {
      const widthRatio = maxWidth / width;
      const heightRatio = maxHeight / height;
      const ratio = Math.min(widthRatio, heightRatio);
      
      resizeWidth = Math.floor(width * ratio);
      resizeHeight = Math.floor(height * ratio);
    }
    
    console.log(`Resizing image from ${width}x${height} to ${resizeWidth}x${resizeHeight}`);
    
    // Resize image
    const resizedImageBuffer = await sharp(imagePath)
      .resize(resizeWidth, resizeHeight, {
        fit: 'inside',
        withoutEnlargement: true
      })
      .raw()
      .toBuffer({ resolveWithObject: true });
    
    const { data, info } = resizedImageBuffer;
    const { width: finalWidth, height: finalHeight, channels } = info;
    
    console.log(`Processing ${finalWidth}x${finalHeight} image with ${channels} channels`);
    
    // Create 2D array for block types
    const blockMatrix: string[][] = [];
    
    // Process each pixel and map to Minecraft block
    for (let y = 0; y < finalHeight; y++) {
      const row: string[] = [];
      
      for (let x = 0; x < finalWidth; x++) {
        const idx = (y * finalWidth + x) * channels;
        
        // Get RGB values
        const r = data[idx] || 0;
        const g = data[idx + 1] || 0;
        const b = data[idx + 2] || 0;
        const a = channels === 4 ? data[idx + 3] : 255;
        
        // Skip fully transparent pixels
        if (channels === 4 && a < 50) {
          row.push('air');
          continue;
        }
        
        // Find closest Minecraft block color
        const closestBlock = findClosestBlock([r, g, b]);
        row.push(closestBlock);
      }
      
      blockMatrix.push(row);
    }
    
    return blockMatrix;
  } catch (error) {
    console.error('Error processing image:', error);
    throw error;
  }
}

/**
 * Convert image to vertical wall format for Minecraft building
 * @param imagePath Path to the image file
 * @param maxWidth Maximum width for the pixel art
 * @param maxHeight Maximum height for the pixel art
 * @returns Promise<string[][]> 2D array of Minecraft block names formatted for vertical building
 */
export async function imageToVerticalWall(
  imagePath: string,
  maxWidth: number = 300,
  maxHeight: number = 300
): Promise<string[][]> {
  const blockMatrix = await imageToPixelArt(imagePath, maxWidth, maxHeight);
  
  // For vertical wall, we need to rotate the matrix appropriately
  const verticalWallMatrix: string[][] = [];
  
  // Create columns for the wall (x-coordinate in Minecraft)
  for (let x = 0; x < blockMatrix[0].length; x++) {
    const column: string[] = [];
    
    // Fill column from bottom to top (y-coordinate in Minecraft)
    for (let y = blockMatrix.length - 1; y >= 0; y--) {
      column.push(blockMatrix[y][x]);
    }
    
    verticalWallMatrix.push(column);
  }
  
  return verticalWallMatrix;
}

/**
 * Process an image from base64 data URL
 * @param base64Data Base64 encoded image data
 * @param maxWidth Maximum width for the pixel art
 * @param maxHeight Maximum height for the pixel art
 * @returns Promise<string[][]> 2D array of Minecraft block names
 */
export async function imageBase64ToPixelArt(
  base64Data: string,
  maxWidth: number = 300,
  maxHeight: number = 300
): Promise<string[][]> {
  try {
    // Remove data URL prefix if present
    const base64Image = base64Data.replace(/^data:image\/\w+;base64,/, '');
    const imageBuffer = Buffer.from(base64Image, 'base64');
    
    // Create a temporary file for sharp to process
    const tempDir = path.join(__dirname, '../../temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    
    const tempFilePath = path.join(tempDir, `temp_${Date.now()}.png`);
    fs.writeFileSync(tempFilePath, imageBuffer);
    
    // Process the image
    const blockMatrix = await imageToPixelArt(tempFilePath, maxWidth, maxHeight);
    
    // Clean up temporary file
    fs.unlinkSync(tempFilePath);
    
    return blockMatrix;
  } catch (error) {
    console.error('Error processing base64 image:', error);
    throw error;
  }
}

/**
 * Convert base64 image to vertical wall format
 * @param base64Data Base64 encoded image data
 * @param maxWidth Maximum width for the pixel art
 * @param maxHeight Maximum height for the pixel art
 * @returns Promise<string[][]> 2D array for vertical wall building
 */
export async function imageBase64ToVerticalWall(
  base64Data: string,
  maxWidth: number = 300,
  maxHeight: number = 300
): Promise<string[][]> {
  const blockMatrix = await imageBase64ToPixelArt(base64Data, maxWidth, maxHeight);
  
  // Convert to vertical wall format
  const verticalWallMatrix: string[][] = [];
  
  for (let x = 0; x < blockMatrix[0].length; x++) {
    const column: string[] = [];
    
    for (let y = blockMatrix.length - 1; y >= 0; y--) {
      column.push(blockMatrix[y][x]);
    }
    
    verticalWallMatrix.push(column);
  }
  
  return verticalWallMatrix;
}