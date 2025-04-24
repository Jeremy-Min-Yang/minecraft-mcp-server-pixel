import Jimp from 'jimp';
import fs from 'fs';
import path from 'path';

// Interface for color distance calculation options
interface ColorDistanceOptions {
  redWeight?: number;
  greenWeight?: number;
  blueWeight?: number;
  alphaThreshold?: number;
}

// Defines the color of a Minecraft block for matching
interface BlockColor {
  name: string;
  r: number;
  g: number;
  b: number;
}

// Block color palette for matching image colors to Minecraft blocks
const BLOCK_COLORS: BlockColor[] = [
  // White and light colors
  { name: "white_concrete", r: 207, g: 213, b: 214 },
  { name: "white_wool", r: 237, g: 237, b: 237 },
  { name: "smooth_quartz", r: 236, g: 233, b: 226 },
  { name: "birch_planks", r: 216, g: 200, b: 156 },
  { name: "bone_block", r: 225, g: 221, b: 201 },
  { name: "calcite", r: 223, g: 224, b: 220 },
  { name: "diorite", r: 225, g: 225, b: 225 },
  
  // Gray shades
  { name: "light_gray_concrete", r: 125, g: 125, b: 115 },
  { name: "gray_concrete", r: 54, g: 57, b: 61 },
  { name: "polished_andesite", r: 126, g: 126, b: 126 },
  { name: "cobblestone", r: 127, g: 127, b: 127 },
  { name: "stone", r: 125, g: 125, b: 125 },
  { name: "stone_bricks", r: 122, g: 122, b: 122 },
  { name: "black_concrete", r: 8, g: 10, b: 15 },
  { name: "deepslate", r: 82, g: 82, b: 82 },
  
  // Brown and wood tones
  { name: "oak_planks", r: 162, g: 130, b: 78 },
  { name: "spruce_planks", r: 114, g: 84, b: 48 },
  { name: "dark_oak_planks", r: 66, g: 43, b: 21 },
  { name: "jungle_planks", r: 159, g: 115, b: 81 },
  { name: "acacia_planks", r: 168, g: 90, b: 50 },
  { name: "mangrove_planks", r: 117, g: 54, b: 41 },
  { name: "brown_concrete", r: 96, g: 59, b: 31 },
  { name: "brown_wool", r: 114, g: 71, b: 40 },
  { name: "dirt", r: 134, g: 96, b: 67 },
  { name: "granite", r: 153, g: 109, b: 94 },
  { name: "terracotta", r: 152, g: 94, b: 67 },
  { name: "clay", r: 159, g: 164, b: 176 },
  
  // Red shades
  { name: "red_concrete", r: 142, g: 32, b: 32 },
  { name: "red_wool", r: 160, g: 39, b: 34 },
  { name: "red_terracotta", r: 142, g: 60, b: 46 },
  { name: "red_nether_bricks", r: 92, g: 7, b: 7 },
  { name: "redstone_block", r: 175, g: 24, b: 5 },
  { name: "crimson_nylium", r: 133, g: 20, b: 20 },
  { name: "nether_wart_block", r: 179, g: 26, b: 26 },
  
  // Orange shades
  { name: "orange_concrete", r: 224, g: 97, b: 1 },
  { name: "orange_wool", r: 240, g: 118, b: 19 },
  { name: "orange_terracotta", r: 161, g: 83, b: 37 },
  { name: "copper_block", r: 192, g: 105, b: 58 },
  { name: "raw_copper_block", r: 153, g: 109, b: 78 },
  { name: "honeycomb_block", r: 229, g: 148, b: 29 },
  
  // Yellow shades
  { name: "yellow_concrete", r: 240, g: 175, b: 21 },
  { name: "yellow_wool", r: 248, g: 197, b: 39 },
  { name: "yellow_terracotta", r: 186, g: 132, b: 35 },
  { name: "hay_block", r: 167, g: 137, b: 40 },
  { name: "gold_block", r: 247, g: 211, b: 38 },
  { name: "sponge", r: 195, g: 192, b: 70 },
  
  // Green shades
  { name: "green_concrete", r: 73, g: 91, b: 36 },
  { name: "green_wool", r: 85, g: 109, b: 27 },
  { name: "green_terracotta", r: 76, g: 83, b: 42 },
  { name: "moss_block", r: 89, g: 109, b: 44 },
  { name: "lime_concrete", r: 94, g: 169, b: 24 },
  { name: "lime_wool", r: 112, g: 185, b: 25 },
  { name: "lime_terracotta", r: 102, g: 116, b: 52 },
  { name: "oxidized_copper", r: 83, g: 139, b: 100 },
  { name: "leaves", r: 60, g: 130, b: 0 },
  
  // Blue shades
  { name: "blue_concrete", r: 45, g: 47, b: 143 },
  { name: "blue_wool", r: 53, g: 57, b: 156 },
  { name: "blue_terracotta", r: 74, g: 59, b: 91 },
  { name: "light_blue_concrete", r: 36, g: 137, b: 199 },
  { name: "light_blue_wool", r: 58, g: 175, b: 217 },
  { name: "light_blue_terracotta", r: 113, g: 108, b: 138 },
  { name: "cyan_concrete", r: 21, g: 119, b: 136 },
  { name: "cyan_wool", r: 21, g: 137, b: 145 },
  { name: "diamond_block", r: 98, g: 219, b: 214 },
  { name: "lapis_block", r: 39, g: 67, b: 138 },
  { name: "warped_stem", r: 43, g: 104, b: 99 },
  
  // Purple and pink shades
  { name: "purple_concrete", r: 100, g: 31, b: 156 },
  { name: "purple_wool", r: 121, g: 42, b: 172 },
  { name: "purple_terracotta", r: 118, g: 69, b: 86 },
  { name: "magenta_concrete", r: 169, g: 48, b: 159 },
  { name: "magenta_wool", r: 189, g: 68, b: 179 },
  { name: "magenta_terracotta", r: 149, g: 88, b: 108 },
  { name: "pink_concrete", r: 213, g: 101, b: 142 },
  { name: "pink_wool", r: 237, g: 141, b: 172 },
  { name: "pink_terracotta", r: 161, g: 78, b: 78 },
  { name: "purpur_block", r: 169, g: 125, b: 169 },
  { name: "amethyst_block", r: 135, g: 101, b: 196 },
  
  // Transparent or special
  { name: "", r: 0, g: 0, b: 0 }, // Empty space
];

// Calculate weighted Euclidean distance between two colors
function getColorDistance(
  r1: number, g1: number, b1: number,
  r2: number, g2: number, b2: number,
  options: ColorDistanceOptions = {}
): number {
  const {
    redWeight = 0.299,
    greenWeight = 0.587,
    blueWeight = 0.114
  } = options;
  
  // Using weighted Euclidean distance to account for human perception
  return Math.sqrt(
    redWeight * Math.pow(r1 - r2, 2) +
    greenWeight * Math.pow(g1 - g2, 2) +
    blueWeight * Math.pow(b1 - b2, 2)
  );
}

// Find the closest Minecraft block to a given RGB color
function findClosestBlockColor(r: number, g: number, b: number, a: number = 255): string {
  // If mostly transparent, return empty block
  if (a < 128) {
    return "";
  }
  
  let closestBlock = BLOCK_COLORS[0];
  let minDistance = Infinity;
  
  for (const blockColor of BLOCK_COLORS) {
    const distance = getColorDistance(r, g, b, blockColor.r, blockColor.g, blockColor.b);
    if (distance < minDistance) {
      minDistance = distance;
      closestBlock = blockColor;
    }
  }
  
  return closestBlock.name;
}

// Process a Jimp image into a 2D array of Minecraft block names
function processJimpImage(image: Jimp, maxHeight: number): string[][] {
  // Resize image to fit within maxHeight while maintaining aspect ratio
  const aspectRatio = image.getWidth() / image.getHeight();
  const targetHeight = Math.min(maxHeight, image.getHeight());
  const targetWidth = Math.round(targetHeight * aspectRatio);
  
  image.resize(targetWidth, targetHeight);
  
  // Create 2D array for block names
  const result: string[][] = [];
  
  // Process each pixel
  for (let y = 0; y < image.getHeight(); y++) {
    const row: string[] = [];
    for (let x = 0; x < image.getWidth(); x++) {
      const pixel = Jimp.intToRGBA(image.getPixelColor(x, y));
      const blockName = findClosestBlockColor(pixel.r, pixel.g, pixel.b, pixel.a);
      row.push(blockName);
    }
    result.push(row);
  }
  
  return result;
}

// Process a local image file
export async function processLocalImage(
  filePath: string, 
  maxHeight: number = 50,
  options: { dithering?: boolean } = {}
): Promise<string[][]> {
  try {
    let image = await Jimp.read(filePath);
    
    // Apply dithering if requested (gives better color representation)
    if (options.dithering) {
      image = image.dither16();
    }
    
    return processJimpImage(image, maxHeight);
  } catch (error) {
    console.error('Error processing local image:', error);
    throw new Error(`Failed to process image file: ${error}`);
  }
}

// Process an image from a URL
export async function processImageUrl(
  imageUrl: string, 
  maxHeight: number = 50,
  options: { dithering?: boolean } = {}
): Promise<string[][]> {
  try {
    console.error(`Attempting to download image from: ${imageUrl}`);
    
    // Try to clean the URL if it's from Claude
    if (imageUrl.includes('claude.ai') || imageUrl.includes('anthropic')) {
      console.error('Detected Claude/Anthropic URL, cleaning URL format...');
      // Strip CDN parameters to get direct access
      imageUrl = imageUrl.replace(/\?.*$/, '');
      console.error(`Cleaned URL: ${imageUrl}`);
    }
    
    // Attempt to download and process the image
    let image;
    try {
      image = await Jimp.read(imageUrl);
    } catch (downloadError) {
      console.error('Direct download failed, trying with fetch:', downloadError);
      // Try to use fetch API as a fallback for URLs that might need special handling
      try {
        const fetch = (await import('node-fetch')).default;
        const response = await fetch(imageUrl);
        if (!response.ok) {
          throw new Error(`HTTP Error: ${response.status} ${response.statusText}`);
        }
        const buffer = await response.buffer();
        image = await Jimp.read(buffer);
      } catch (fetchError) {
        console.error('Fetch method also failed:', fetchError);
        throw new Error(`All download methods failed for URL: ${imageUrl}`);
      }
    }
    
    // Apply dithering if requested
    if (options.dithering) {
      image = image.dither16();
    }
    
    const result = processJimpImage(image, maxHeight);
    console.error(`Successfully processed image: ${result.length}x${result[0].length} pixels`);
    return result;
  } catch (error) {
    console.error('Error processing image URL:', error);
    throw new Error(`Failed to process image URL: ${error}`);
  }
}

// Process a Base64 encoded image
export async function processBase64Image(
  base64String: string,
  maxHeight: number = 50,
  options: { dithering?: boolean } = {}
): Promise<string[][]> {
  try {
    // Remove data URL prefix if present
    const base64Data = base64String.replace(/^data:image\/(png|jpg|jpeg);base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');
    
    let image = await Jimp.read(buffer);
    
    // Apply dithering if requested
    if (options.dithering) {
      image = image.dither16();
    }
    
    return processJimpImage(image, maxHeight);
  } catch (error) {
    console.error('Error processing base64 image:', error);
    throw new Error(`Failed to process base64 image: ${error}`);
  }
}

// Process an image buffer
export async function processImageBuffer(
  buffer: Buffer,
  maxHeight: number = 50,
  options: { dithering?: boolean } = {}
): Promise<string[][]> {
  try {
    let image = await Jimp.read(buffer);
    
    // Apply dithering if requested
    if (options.dithering) {
      image = image.dither16();
    }
    
    return processJimpImage(image, maxHeight);
  } catch (error) {
    console.error('Error processing image buffer:', error);
    throw new Error(`Failed to process image buffer: ${error}`);
  }
}

// Save processed pixel art blueprint to a JSON file
export function savePixelArtBlueprintToFile(
  blockArray: string[][],
  filePath: string
): void {
  const blueprint = {
    pixels: blockArray,
    width: blockArray[0].length,
    height: blockArray.length
  };
  
  fs.writeFileSync(filePath, JSON.stringify(blueprint, null, 2));
}

// Get the block count for a pixel art design (helpful for planning)
export function getBlockCount(blockArray: string[][]): Record<string, number> {
  const blockCounts: Record<string, number> = {};
  
  for (const row of blockArray) {
    for (const block of row) {
      if (block !== "") {
        blockCounts[block] = (blockCounts[block] || 0) + 1;
      }
    }
  }
  
  return blockCounts;
}

// Format block requirements for display
export function formatBlockRequirements(blockCounts: Record<string, number>): string {
  return Object.entries(blockCounts)
    .sort((a, b) => b[1] - a[1]) // Sort by frequency
    .map(([block, count]) => `${block}: ${count}`)
    .join(", ");
}
