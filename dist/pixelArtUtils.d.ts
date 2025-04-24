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
export declare function calculatePixelPositions(options: PixelArtOptions): BlockWithPosition[];
/**
 * Count the blocks needed for a pixel art
 */
export declare function countBlocksNeeded(pixels: string[][]): Record<string, number>;
/**
 * Format block requirements for display
 */
export declare function formatBlockRequirements(blockCounts: Record<string, number>): string;
/**
 * Calculate the optimal build order to minimize movement
 */
export declare function calculateOptimalBuildOrder(blocks: BlockWithPosition[]): BlockWithPosition[];
/**
 * Validate pixel art input
 */
export declare function validatePixelArt(pixels: string[][]): {
    valid: boolean;
    error?: string;
};
