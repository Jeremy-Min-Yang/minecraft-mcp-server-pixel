import { Vec3 } from 'vec3';
import { BlockPosition } from 'mineflayer';

export interface BlockWithPosition {
  blockType: string;
  x: number;
  y: number;
  z: number;
}

export interface PixelArtOptions {
  pixels: string[][];
  origin: BlockPosition;
  direction: "north" | "south" | "east" | "west";
  verticalBuild?: boolean;
  mirrorX?: boolean;
  mirrorY?: boolean;
  scale?: number;
}

export interface ColorBlockMap {
  [colorHex: string]: string[]; // Maps color HEX to block names
}

/**
 * Calculate the world position for each pixel in the pixel art
 */
export function calculatePixelPositions(options: PixelArtOptions): BlockWithPosition[] {
  const { pixels, origin, direction, verticalBuild = false, mirrorX = false, mirrorY = false, scale = 1 } = options;
  const result: BlockWithPosition[] = [];
  
  const height = pixels.length;
  const width = pixels[0].length;
  
  for (let row = 0; row < height; row++) {
    for (let col = 0; col < width; col++) {
      // Skip empty cells (represented by empty strings)
      const blockType = pixels[row][col];
      if (blockType === "") continue;
      
      // Apply mirroring if needed
      const effectiveRow = mirrorY ? height - 1 - row : row;
      const effectiveCol = mirrorX ? width - 1 - col : col;
      
      // Calculate position based on direction and build orientation
      let x = origin.x, y = origin.y, z = origin.z;
      
      if (verticalBuild) {
        // Vertical build (on a wall)
        if (direction === "north") {
          x += effectiveCol * scale;
          y += (height - 1 - effectiveRow) * scale;
          z -= 0;
        } else if (direction === "south") {
          x += effectiveCol * scale;
          y += (height - 1 - effectiveRow) * scale;
          z += 0;
        } else if (direction === "east") {
          x += 0;
          y += (height - 1 - effectiveRow) * scale;
          z += effectiveCol * scale;
        } else if (direction === "west") {
          x -= 0;
          y += (height - 1 - effectiveRow) * scale;
          z += effectiveCol * scale;
        }
      } else {
        // Horizontal build (on the ground)
        if (direction === "north") {
          x += effectiveCol * scale;
          z -= effectiveRow * scale;
        } else if (direction === "south") {
          x += effectiveCol * scale;
          z += effectiveRow * scale;
        } else if (direction === "east") {
          x += effectiveRow * scale;
          z += effectiveCol * scale;
        } else if (direction === "west") {
          x -= effectiveRow * scale;
          z += effectiveCol * scale;
        }
      }
      
      result.push({
        blockType,
        x,
        y,
        z
      });
    }
  }
  
  return result;
}

/**
 * Count the blocks needed for a pixel art
 */
export function countBlocksNeeded(pixels: string[][]): Record<string, number> {
  const counts: Record<string, number> = {};
  
  for (const row of pixels) {
    for (const blockType of row) {
      if (blockType !== "") {
        counts[blockType] = (counts[blockType] || 0) + 1;
      }
    }
  }
  
  return counts;
}

/**
 * Format block requirements for display
 */
export function formatBlockRequirements(blockCounts: Record<string, number>): string {
  return Object.entries(blockCounts)
    .map(([block, count]) => `${block}: ${count}`)
    .join(", ");
}

/**
 * Calculate the optimal build order to minimize movement
 */
export function calculateOptimalBuildOrder(blocks: BlockWithPosition[]): BlockWithPosition[] {
  // Simple implementation: sort by Y (bottom to top), then by distance from origin
  return [...blocks].sort((a, b) => {
    // First sort by Y coordinate (build from bottom to top)
    if (a.y !== b.y) return a.y - b.y;
    
    // Then sort by distance from origin (X-Z plane)
    const distA = Math.sqrt(a.x * a.x + a.z * a.z);
    const distB = Math.sqrt(b.x * b.x + b.z * b.z);
    return distA - distB;
  });
}

/**
 * Color map for common Minecraft blocks
 */
export const COLOR_TO_BLOCKS: ColorBlockMap = {
  // Reds
  "#ff0000": ["red_wool", "red_concrete", "red_terracotta"],
  "#aa0000": ["red_nether_bricks", "red_mushroom_block"],
  
  // Oranges
  "#ff7700": ["orange_wool", "orange_concrete", "orange_terracotta"],
  "#aa4400": ["acacia_planks", "copper_block"],
  
  // Yellows
  "#ffff00": ["yellow_wool", "yellow_concrete", "yellow_terracotta"],
  "#aaaa00": ["gold_block", "hay_block"],
  
  // Greens
  "#00ff00": ["lime_wool", "lime_concrete", "lime_terracotta"],
  "#00aa00": ["green_wool", "green_concrete", "green_terracotta"],
  "#004400": ["moss_block", "dark_oak_leaves"],
  
  // Cyans
  "#00ffff": ["light_blue_wool", "light_blue_concrete", "light_blue_terracotta"],
  "#00aaaa": ["cyan_wool", "cyan_concrete", "cyan_terracotta"],
  "#004444": ["prismarine", "dark_prismarine"],
  
  // Blues
  "#0000ff": ["blue_wool", "blue_concrete", "blue_terracotta"],
  "#0000aa": ["lapis_block", "blue_ice"],
  
  // Purples
  "#ff00ff": ["magenta_wool", "magenta_concrete", "magenta_terracotta"],
  "#aa00aa": ["purple_wool", "purple_concrete", "purple_terracotta"],
  "#440044": ["purpur_block", "amethyst_block"],
  
  // Browns
  "#aa5500": ["brown_wool", "brown_concrete", "brown_terracotta"],
  "#553300": ["oak_planks", "spruce_planks"],
  "#331100": ["dark_oak_planks", "jungle_planks"],
  
  // Whites and Light Grays
  "#ffffff": ["white_wool", "white_concrete", "quartz_block"],
  "#aaaaaa": ["light_gray_wool", "light_gray_concrete", "light_gray_terracotta"],
  "#dddddd": ["bone_block", "birch_planks", "diorite"],
  
  // Grays and Blacks
  "#555555": ["gray_wool", "gray_concrete", "gray_terracotta"],
  "#111111": ["black_wool", "black_concrete", "coal_block"],
  "#333333": ["deepslate", "polished_basalt"],
};

/**
 * Convert an RGB color to the closest Minecraft block
 */
export function rgbToMinecraftBlock(r: number, g: number, b: number): string {
  // Convert RGB to hex
  const hex = "#" + 
    Math.round(r).toString(16).padStart(2, '0') + 
    Math.round(g).toString(16).padStart(2, '0') + 
    Math.round(b).toString(16).padStart(2, '0');
  
  // Find closest color in our map
  let closestColor = "#000000";
  let minDistance = Infinity;
  
  for (const colorHex of Object.keys(COLOR_TO_BLOCKS)) {
    const distance = hexColorDistance(hex, colorHex);
    if (distance < minDistance) {
      minDistance = distance;
      closestColor = colorHex;
    }
  }
  
  // Return the first block for this color
  return COLOR_TO_BLOCKS[closestColor][0];
}

/**
 * Calculate distance between two hex colors
 */
function hexColorDistance(hex1: string, hex2: string): number {
  // Parse hex colors to RGB
  const r1 = parseInt(hex1.substring(1, 3), 16);
  const g1 = parseInt(hex1.substring(3, 5), 16);
  const b1 = parseInt(hex1.substring(5, 7), 16);
  
  const r2 = parseInt(hex2.substring(1, 3), 16);
  const g2 = parseInt(hex2.substring(3, 5), 16);
  const b2 = parseInt(hex2.substring(5, 7), 16);
  
  // Calculate Euclidean distance in RGB space
  return Math.sqrt(
    Math.pow(r1 - r2, 2) +
    Math.pow(g1 - g2, 2) +
    Math.pow(b1 - b2, 2)
  );
}

/**
 * Validate pixel art input
 */
export function validatePixelArt(pixels: string[][]): { valid: boolean; error?: string } {
  if (!Array.isArray(pixels) || pixels.length === 0) {
    return { valid: false, error: "Pixels must be a non-empty 2D array" };
  }
  
  const width = pixels[0].length;
  if (width === 0) {
    return { valid: false, error: "Each row must have at least one column" };
  }
  
  // Check that all rows have the same width
  for (let i = 1; i < pixels.length; i++) {
    if (!Array.isArray(pixels[i]) || pixels[i].length !== width) {
      return { valid: false, error: `Row ${i} has different width than the first row` };
    }
  }
  
  return { valid: true };
}
