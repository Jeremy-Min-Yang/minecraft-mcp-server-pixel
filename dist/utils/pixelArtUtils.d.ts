export interface BlockPosition {
    x: number;
    y: number;
    z: number;
}
export interface BuildParameters {
    origin: BlockPosition;
    pixels: string[][];
    direction: 'north' | 'south' | 'east' | 'west';
}
/**
 * Build pixel art in Minecraft
 * @param bot Mineflayer bot instance
 * @param params Build parameters
 */
export declare function buildPixelArt(bot: any, params: BuildParameters): Promise<void>;
/**
 * Build pixel art from base64 image data
 * @param bot Mineflayer bot instance
 * @param base64Data Base64 encoded image data
 * @param origin Origin position for building
 * @param direction Build direction
 */
export declare function buildPixelArtFromBase64(bot: any, base64Data: string, origin: BlockPosition, direction?: 'north' | 'south' | 'east' | 'west'): Promise<void>;
/**
 * Get bot status (game mode and OP status)
 * @param bot Mineflayer bot instance
 * @returns Object containing isCreative and isOP flags
 */
export declare function getBotStatus(bot: any): {
    isCreative: boolean;
    isOP: boolean;
};
