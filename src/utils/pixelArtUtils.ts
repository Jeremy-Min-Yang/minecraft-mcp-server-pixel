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
