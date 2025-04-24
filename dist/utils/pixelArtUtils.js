import { imageBase64ToVerticalWall } from './imageToPixelArt.js';
/**
 * Build pixel art in Minecraft
 * @param bot Mineflayer bot instance
 * @param params Build parameters
 */
export async function buildPixelArt(bot, params) {
    const { origin, pixels, direction } = params;
    // Validate game mode and OP status
    const botStatus = getBotStatus(bot);
    if (!botStatus.isCreative) {
        console.log('Not in creative mode. Attempting to switch...');
        bot.chat('/gamemode creative');
        // Wait a bit for gamemode to change
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
    if (!botStatus.isOP) {
        console.log('Warning: Bot is not OP. Some functions may not work properly.');
    }
    // Configure direction offsets
    const directionOffsets = {
        north: { x: 1, y: 0, z: 0 },
        south: { x: 1, y: 0, z: 0 },
        east: { x: 0, y: 0, z: 1 },
        west: { x: 0, y: 0, z: 1 }
    };
    const offset = directionOffsets[direction];
    // Build the pixel art using fill commands instead of individual blocks
    // This is much faster and more reliable
    // Group blocks by type and row for efficient building
    for (let y = 0; y < pixels.length; y++) {
        let currentBlockType = null;
        let startX = 0;
        for (let x = 0; x < pixels[y].length; x++) {
            const blockType = pixels[y][x];
            if (blockType === currentBlockType) {
                // Continue current fill
                continue;
            }
            else {
                // End previous fill if there was one
                if (currentBlockType !== null && currentBlockType !== 'air' && x > startX) {
                    // Calculate position based on direction
                    let pos1, pos2;
                    switch (direction) {
                        case 'north':
                            pos1 = { x: origin.x + startX, y: origin.y + y, z: origin.z };
                            pos2 = { x: origin.x + x - 1, y: origin.y + y, z: origin.z };
                            break;
                        case 'south':
                            pos1 = { x: origin.x + startX, y: origin.y + y, z: origin.z };
                            pos2 = { x: origin.x + x - 1, y: origin.y + y, z: origin.z };
                            break;
                        case 'east':
                            pos1 = { x: origin.x, y: origin.y + y, z: origin.z + startX };
                            pos2 = { x: origin.x, y: origin.y + y, z: origin.z + x - 1 };
                            break;
                        case 'west':
                            pos1 = { x: origin.x, y: origin.y + y, z: origin.z + startX };
                            pos2 = { x: origin.x, y: origin.y + y, z: origin.z + x - 1 };
                            break;
                        default:
                            pos1 = { x: origin.x + startX, y: origin.y + y, z: origin.z };
                            pos2 = { x: origin.x + x - 1, y: origin.y + y, z: origin.z };
                    }
                    try {
                        // Use fill command for efficiency
                        const fillCommand = `/fill ${pos1.x} ${pos1.y} ${pos1.z} ${pos2.x} ${pos2.y} ${pos2.z} ${currentBlockType}`;
                        bot.chat(fillCommand);
                        // Wait a small amount to prevent command overflow
                        await new Promise(resolve => setTimeout(resolve, 50));
                    }
                    catch (error) {
                        console.error(`Error executing fill command: ${error}`);
                    }
                }
                // Start new fill
                currentBlockType = blockType;
                startX = x;
            }
        }
        // End fill for end of row
        if (currentBlockType !== null && currentBlockType !== 'air' && startX < pixels[y].length) {
            // Calculate position based on direction
            let pos1, pos2;
            switch (direction) {
                case 'north':
                    pos1 = { x: origin.x + startX, y: origin.y + y, z: origin.z };
                    pos2 = { x: origin.x + pixels[y].length - 1, y: origin.y + y, z: origin.z };
                    break;
                case 'south':
                    pos1 = { x: origin.x + startX, y: origin.y + y, z: origin.z };
                    pos2 = { x: origin.x + pixels[y].length - 1, y: origin.y + y, z: origin.z };
                    break;
                case 'east':
                    pos1 = { x: origin.x, y: origin.y + y, z: origin.z + startX };
                    pos2 = { x: origin.x, y: origin.y + y, z: origin.z + pixels[y].length - 1 };
                    break;
                case 'west':
                    pos1 = { x: origin.x, y: origin.y + y, z: origin.z + startX };
                    pos2 = { x: origin.x, y: origin.y + y, z: origin.z + pixels[y].length - 1 };
                    break;
                default:
                    pos1 = { x: origin.x + startX, y: origin.y + y, z: origin.z };
                    pos2 = { x: origin.x + pixels[y].length - 1, y: origin.y + y, z: origin.z };
            }
            try {
                // Use fill command for efficiency
                const fillCommand = `/fill ${pos1.x} ${pos1.y} ${pos1.z} ${pos2.x} ${pos2.y} ${pos2.z} ${currentBlockType}`;
                bot.chat(fillCommand);
                // Wait a small amount to prevent command overflow
                await new Promise(resolve => setTimeout(resolve, 50));
            }
            catch (error) {
                console.error(`Error executing fill command: ${error}`);
            }
        }
        // Report progress every 10 rows
        if (y % 10 === 0 || y === pixels.length - 1) {
            const progress = Math.floor((y / pixels.length) * 100);
            console.log(`Building progress: ${progress}%`);
        }
    }
    console.log(`Pixel art building complete.`);
}
/**
 * Build pixel art from base64 image data
 * @param bot Mineflayer bot instance
 * @param base64Data Base64 encoded image data
 * @param origin Origin position for building
 * @param direction Build direction
 */
export async function buildPixelArtFromBase64(bot, base64Data, origin, direction = 'south') {
    try {
        console.log('Processing base64 image data');
        const pixels = await imageBase64ToVerticalWall(base64Data);
        console.log(`Building pixel art with ${pixels.length} columns and ${pixels[0].length} rows`);
        await buildPixelArt(bot, {
            origin,
            pixels,
            direction
        });
    }
    catch (error) {
        console.error(`Error building pixel art from base64: ${error}`);
        throw error;
    }
}
/**
 * Get bot status (game mode and OP status)
 * @param bot Mineflayer bot instance
 * @returns Object containing isCreative and isOP flags
 */
export function getBotStatus(bot) {
    // Check game mode - handle both number and string representations
    // Game mode can be 1 or 'creative' for creative mode
    const gameMode = bot.player?.gamemode;
    const isCreative = (gameMode === 1) ||
        (typeof gameMode === 'string' && (gameMode === '1' || gameMode.toLowerCase() === 'creative'));
    // Check OP status
    // Different bot implementations might store OP status differently
    const isOP = !!(bot.player && (bot.player.op || bot.isOp || bot.isOp));
    return { isCreative, isOP };
}
//# sourceMappingURL=pixelArtUtils.js.map