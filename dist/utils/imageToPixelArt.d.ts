/**
 * Convert image to Minecraft pixel art
 * @param imagePath Path to the image file
 * @param maxWidth Maximum width for the pixel art
 * @param maxHeight Maximum height for the pixel art
 * @returns Promise<string[][]> 2D array of Minecraft block names
 */
export declare function imageToPixelArt(imagePath: string, maxWidth?: number, maxHeight?: number): Promise<string[][]>;
/**
 * Convert image to vertical wall format for Minecraft building
 * @param imagePath Path to the image file
 * @param maxWidth Maximum width for the pixel art
 * @param maxHeight Maximum height for the pixel art
 * @returns Promise<string[][]> 2D array of Minecraft block names formatted for vertical building
 */
export declare function imageToVerticalWall(imagePath: string, maxWidth?: number, maxHeight?: number): Promise<string[][]>;
/**
 * Process an image from base64 data URL
 * @param base64Data Base64 encoded image data
 * @param maxWidth Maximum width for the pixel art
 * @param maxHeight Maximum height for the pixel art
 * @returns Promise<string[][]> 2D array of Minecraft block names
 */
export declare function imageBase64ToPixelArt(base64Data: string, maxWidth?: number, maxHeight?: number): Promise<string[][]>;
/**
 * Convert base64 image to vertical wall format
 * @param base64Data Base64 encoded image data
 * @param maxWidth Maximum width for the pixel art
 * @param maxHeight Maximum height for the pixel art
 * @returns Promise<string[][]> 2D array for vertical wall building
 */
export declare function imageBase64ToVerticalWall(base64Data: string, maxWidth?: number, maxHeight?: number): Promise<string[][]>;
