#!/usr/bin/env node
console.error("=== minecraftbuildmcp starting ===");
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import mineflayer from 'mineflayer';
import pathfinderPkg from 'mineflayer-pathfinder';
const { pathfinder, Movements, goals } = pathfinderPkg;
import { Vec3 } from 'vec3';
import minecraftData from 'minecraft-data';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
// Import image processing utilities
import { processImageUrl, processBase64Image, getBlockCount, formatBlockRequirements as formatImageBlockRequirements } from './utils/imageProcessor.js';
// Import image-to-pixel-art utilities
import { imageBase64ToVerticalWall } from './utils/imageToPixelArt.js';
// Note: These functions need to be imported from elsewhere or recreated
// These were not found in pixelArtUtils.js
const calculatePixelPositions = (params) => {
    // Implementation needed
    return params.pixels.flatMap((row, y) => row.map((blockType, x) => ({
        blockType,
        x: params.direction === 'east' || params.direction === 'west'
            ? params.origin.x
            : params.origin.x + (params.mirrorX ? (row.length - 1 - x) : x) * (params.scale || 1),
        y: params.verticalBuild
            ? params.origin.y + (params.mirrorY ? y : (params.pixels.length - 1 - y)) * (params.scale || 1)
            : params.origin.y,
        z: params.direction === 'north' || params.direction === 'south'
            ? params.origin.z
            : params.origin.z + (params.mirrorX ? (row.length - 1 - x) : x) * (params.scale || 1)
    })));
};
const calculateOptimalBuildOrder = (pixelPositions) => {
    // Simplified implementation - normally would optimize the path
    return pixelPositions.filter(pixel => pixel.blockType !== 'air' && pixel.blockType !== '');
};
const countBlocksNeeded = (pixels) => {
    const blockCounts = {};
    for (const row of pixels) {
        for (const blockType of row) {
            if (blockType !== 'air' && blockType !== '') {
                blockCounts[blockType] = (blockCounts[blockType] || 0) + 1;
            }
        }
    }
    return blockCounts;
};
const formatBlockRequirements = (blockCounts) => {
    return Object.entries(blockCounts)
        .filter(([blockType]) => blockType !== 'air' && blockType !== '')
        .map(([blockType, count]) => `${blockType}: ${count}`)
        .join(', ');
};
const validatePixelArt = (pixels) => {
    if (!Array.isArray(pixels) || pixels.length === 0) {
        return { valid: false, error: 'Pixel art must be a non-empty 2D array' };
    }
    const width = pixels[0].length;
    if (!width) {
        return { valid: false, error: 'Each row of pixel art must have at least one column' };
    }
    for (let i = 1; i < pixels.length; i++) {
        if (pixels[i].length !== width) {
            return { valid: false, error: 'All rows of pixel art must have the same width' };
        }
    }
    return { valid: true };
};
import { getAllTemplateIds, getTemplateById } from './templates/pixelArtTemplates.js';
// ========== Command Line Argument Parsing ==========
function parseCommandLineArgs() {
    return yargs(hideBin(process.argv))
        .option('host', {
        type: 'string',
        description: 'Minecraft server host',
        default: 'localhost'
    })
        .option('port', {
        type: 'number',
        description: 'Minecraft server port',
        default: 25565
    })
        .option('username', {
        type: 'string',
        description: 'Bot username',
        default: 'Bob_the_Builder'
    })
        .help()
        .alias('help', 'h')
        .parseSync();
}
// ========== Response Helpers ==========
function createResponse(text) {
    return {
        content: [{ type: "text", text }]
    };
}
function createErrorResponse(error) {
    const errorMessage = typeof error === 'string' ? error : error.message;
    console.error(`Error: ${errorMessage}`);
    return {
        content: [{ type: "text", text: `Failed: ${errorMessage}` }],
        isError: true
    };
}
// ========== Creative Equip Helper ==========
async function ensureBlockInInventory(bot, blockName) {
    const mcData = minecraftData(bot.version);
    const item = mcData.itemsByName[blockName];
    if (!item)
        throw new Error(`Unknown block: ${blockName}. Use 'list-block-names' to see valid names.`);
    // Check if already in inventory
    const existing = bot.inventory.items().find((i) => i.name === blockName);
    if (existing)
        return existing;
    // Find an empty slot
    const emptySlot = bot.inventory.firstEmptyInventorySlot();
    if (emptySlot === null)
        throw new Error("No empty inventory slot available");
    // Use creative API to set the slot
    const isCreativeMode = bot.game && ((typeof bot.game.gameMode === 'number' && bot.game.gameMode === 1) || (typeof bot.game.gameMode === 'string' && bot.game.gameMode.toLowerCase().includes('creative')));
    if (bot.creative && isCreativeMode) {
        // Create the item by ID
        const giveItem = { id: item.id, count: 64 };
        await bot.creative.setInventorySlot(emptySlot, giveItem);
        // Wait for inventory update
        await new Promise(res => setTimeout(res, 100));
        return bot.inventory.slots[emptySlot];
    }
    else {
        throw new Error("Not in creative mode or not OP. Make sure the bot is OP and in creative mode. Use 'get-bot-status' to check.");
    }
}
// ========== Block Placeability Helper ==========
function isPlaceableFloor(block) {
    if (!block)
        return false;
    // List of non-solid or non-placeable block names
    const nonPlaceable = [
        'air', 'cave_air', 'void_air', 'water', 'lava', 'tall_grass', 'grass', 'snow_layer',
        'seagrass', 'kelp', 'vine', 'fire', 'torch', 'redstone_torch', 'tripwire', 'carpet',
        'rail', 'powered_rail', 'detector_rail', 'activator_rail', 'button', 'lever', 'ladder',
        'flower', 'poppy', 'dandelion', 'blue_orchid', 'allium', 'azure_bluet', 'red_tulip',
        'orange_tulip', 'white_tulip', 'pink_tulip', 'oxeye_daisy', 'cornflower', 'lily_of_the_valley',
        'wither_rose', 'sunflower', 'lilac', 'rose_bush', 'peony', 'dead_bush', 'fern', 'large_fern',
        'mushroom', 'brown_mushroom', 'red_mushroom', 'sugar_cane', 'bamboo', 'sapling', 'wheat',
        'carrots', 'potatoes', 'beetroots', 'melon_stem', 'pumpkin_stem', 'nether_wart', 'cactus',
        'reeds', 'cocoa', 'chorus_flower', 'chorus_plant', 'scaffolding', 'bubble_column', 'sweet_berry_bush',
        'torchflower', 'pitcher_crop', 'spore_blossom', 'dripleaf', 'small_dripleaf', 'big_dripleaf',
        'amethyst_cluster', 'budding_amethyst', 'pointed_dripstone', 'hanging_roots', 'rooted_dirt',
        'moss_carpet', 'glow_lichen', 'candle', 'campfire', 'soul_campfire', 'bell', 'lightning_rod',
        'frogspawn', 'turtle_egg', 'sea_pickle', 'end_rod', 'snow', 'ice', 'blue_ice', 'packed_ice',
        'slime_block', 'honey_block', 'barrier', 'structure_void', 'structure_block', 'command_block',
        'repeating_command_block', 'chain_command_block', 'jigsaw', 'light', 'spawner', 'mob_spawner',
        'shulker_box', 'moving_piston', 'piston_head', 'piston_extension', 'tripwire_hook', 'string',
        'item_frame', 'glow_item_frame', 'painting', 'sign', 'wall_sign', 'standing_sign', 'banner',
        'wall_banner', 'standing_banner', 'end_gateway', 'end_portal', 'end_portal_frame', 'nether_portal',
        'portal', 'barrier', 'structure_void', 'structure_block', 'jigsaw', 'light', 'sculk_sensor',
        'sculk_shrieker', 'sculk_catalyst', 'sculk_vein', 'sculk', 'powder_snow', 'bubble_column',
        'tripwire', 'tripwire_hook', 'string', 'cobweb', 'web', 'dragon_egg', 'bed', 'monster_egg',
        'infested_stone', 'infested_cobblestone', 'infested_stone_bricks', 'infested_mossy_stone_bricks',
        'infested_cracked_stone_bricks', 'infested_chiseled_stone_bricks', 'infested_deepslate',
        'barrier', 'structure_void', 'structure_block', 'jigsaw', 'light', 'air', 'cave_air', 'void_air'
    ];
    return !nonPlaceable.includes(block.name);
}
// ========== Bot Setup ==========
function setupBot(argv) {
    // Configure bot options based on command line arguments
    const botOptions = {
        host: argv.host,
        port: argv.port,
        username: argv.username,
        plugins: { pathfinder }
    };
    // Log connection information
    console.error(`Connecting to Minecraft server at ${argv.host}:${argv.port} as ${argv.username}`);
    // Create a bot instance
    const bot = mineflayer.createBot(botOptions);
    // Set up the bot when it spawns
    bot.once('spawn', async () => {
        console.error('Bot has spawned in the world');
        // Set up pathfinder movements
        const mcData = minecraftData(bot.version);
        const defaultMove = new Movements(bot, mcData);
        bot.pathfinder.setMovements(defaultMove);
        // Try to get OP status and set creative mode
        bot.chat('/op ' + bot.username);
        setTimeout(() => {
            bot.chat('/gamemode creative');
            setTimeout(() => {
                console.error('Attempted to get OP and set creative mode');
                bot.chat('Claude-powered bot ready to receive instructions! Image building enabled.');
            }, 500);
        }, 500);
    });
    // Register common event handlers
    bot.on('chat', (username, message) => {
        if (username === bot.username)
            return;
        console.error(`[CHAT] ${username}: ${message}`);
    });
    bot.on('kicked', (reason) => {
        console.error(`Bot was kicked: ${reason}`);
    });
    bot.on('error', (err) => {
        console.error(`Bot error: ${err.message}`);
    });
    return bot;
}
// ========== MCP Server Configuration ==========
function createMcpServer(bot) {
    const server = new McpServer({
        name: "minecraftbuildmcp-bot",
        version: "1.0.0",
    });
    // Register all tool categories
    registerPositionTools(server, bot);
    registerInventoryTools(server, bot);
    registerBlockTools(server, bot);
    registerEntityTools(server, bot);
    registerChatTools(server, bot);
    registerPixelArtTools(server, bot);
    registerAdvancedImageTools(server, bot);
    return server;
}
// ========== Position and Movement Tools ==========
function registerPositionTools(server, bot) {
    server.tool("get-position", "Get the current position of the bot", {}, async () => {
        try {
            const position = bot.entity.position;
            const pos = {
                x: Math.floor(position.x),
                y: Math.floor(position.y),
                z: Math.floor(position.z)
            };
            return createResponse(`Current position: (${pos.x}, ${pos.y}, ${pos.z})`);
        }
        catch (error) {
            return createErrorResponse(error);
        }
    });
    server.tool("move-to-position", "Move or teleport the bot to a specific position (teleports in creative mode)", {
        x: z.number().describe("X coordinate"),
        y: z.number().describe("Y coordinate"),
        z: z.number().describe("Z coordinate"),
        range: z.number().optional().describe("How close to get to the target (default: 1)")
    }, async ({ x, y, z, range = 1 }) => {
        try {
            const isCreative = bot.game.gameMode === 1 || (typeof bot.game.gameMode === 'string' && bot.game.gameMode.toLowerCase().includes('creative'));
            if (isCreative && bot.creative) {
                // Teleport in creative mode
                bot.entity.position.set(x, y, z);
                // Skip emitting the move event to avoid typing issues
                // bot.emit('move');
                bot._client.write('position', {
                    x, y, z,
                    yaw: bot.entity.yaw,
                    pitch: bot.entity.pitch,
                    flags: 0x00
                });
                return createResponse(`Teleported to (${x}, ${y}, ${z})`);
            }
            else {
                // Use pathfinder in survival
                const goal = new goals.GoalNear(x, y, z, range);
                await bot.pathfinder.goto(goal);
                return createResponse(`Successfully moved to position near (${x}, ${y}, ${z})`);
            }
        }
        catch (error) {
            return createErrorResponse(error);
        }
    });
}
// ========== Inventory Management Tools ==========
function registerInventoryTools(server, bot) {
    server.tool("equip-item", "Equip a specific item", {
        itemName: z.string().describe("Name of the item to equip"),
        destination: z.string().optional().describe("Where to equip the item (default: 'hand')")
    }, async ({ itemName, destination = 'hand' }) => {
        try {
            let item = bot.inventory.items().find((i) => i.name.includes(itemName.toLowerCase()));
            if (!item && bot.game.gameMode === 1 && bot.creative) {
                // In creative, give the item
                item = await ensureBlockInInventory(bot, itemName.toLowerCase());
            }
            if (!item) {
                return createResponse(`Couldn't find or give any item matching '${itemName}'. (Check block name, creative mode, and OP status)`);
            }
            await bot.equip(item, destination);
            return createResponse(`Equipped ${item.name} to ${destination}`);
        }
        catch (error) {
            return createErrorResponse(error);
        }
    });
    // Tool: Print bot's current game mode and OP status
    server.tool("get-bot-status", "Print the bot's current game mode and OP status", {}, async () => {
        try {
            const gm = bot.game && bot.game.gameMode;
            let isCreative = (gm === 1) || (typeof gm === 'string' && gm.toLowerCase().includes('creative'));
            // For some Minecraft versions, the gameMode might be a string
            if (typeof gm === 'string' && gm.toLowerCase().includes('creative')) {
                isCreative = true;
            }
            // OP status is not directly available, but we can check if bot.creative exists
            const isOp = !!bot.creative;
            // Force OP and creative mode if not already
            if (!isOp || !isCreative) {
                bot.chat('/op ' + bot.username);
                setTimeout(() => {
                    bot.chat('/gamemode creative');
                }, 250);
            }
            return createResponse(`Game mode: ${gm} (${isCreative ? 'creative' : 'not creative'}), OP: ${isOp ? 'yes' : 'no'}`);
        }
        catch (error) {
            return createErrorResponse(error);
        }
    });
    // Tool: List all valid block names for this Minecraft version
    server.tool("list-block-names", "List all valid block names for the current Minecraft version", {}, async () => {
        try {
            const mcData = minecraftData(bot.version);
            const blockNames = Object.keys(mcData.itemsByName).filter(name => mcData.itemsByName[name].stackSize === 64);
            // Only show the first 100 for brevity
            const preview = blockNames.slice(0, 100).join(", ");
            return createResponse(`First 100 block names: ${preview} ... (total: ${blockNames.length})`);
        }
        catch (error) {
            return createErrorResponse(error);
        }
    });
}
// ========== Block Interaction Tools ==========
function registerBlockTools(server, bot) {
    server.tool("place-block", "Place a block at the specified position", {
        x: z.number().describe("X coordinate"),
        y: z.number().describe("Y coordinate"),
        z: z.number().describe("Z coordinate"),
        faceDirection: z.enum(['up', 'down', 'north', 'south', 'east', 'west']).optional().describe("Direction to place against (default: 'down')")
    }, async (args) => {
        try {
            const { x, y, z, faceDirection = 'down' } = args;
            const placePos = new Vec3(x, y, z);
            const blockAtPos = bot.blockAt(placePos);
            if (blockAtPos && blockAtPos.name !== 'air') {
                return createResponse(`There's already a block (${blockAtPos.name}) at (${x}, ${y}, ${z})`);
            }
            const possibleFaces = [
                { direction: 'down', vector: new Vec3(0, -1, 0) },
                { direction: 'north', vector: new Vec3(0, 0, -1) },
                { direction: 'south', vector: new Vec3(0, 0, 1) },
                { direction: 'east', vector: new Vec3(1, 0, 0) },
                { direction: 'west', vector: new Vec3(-1, 0, 0) },
                { direction: 'up', vector: new Vec3(0, 1, 0) }
            ];
            if (faceDirection !== 'down') {
                const specificFace = possibleFaces.find(face => face.direction === faceDirection);
                if (specificFace) {
                    possibleFaces.unshift(possibleFaces.splice(possibleFaces.indexOf(specificFace), 1)[0]);
                }
            }
            for (const face of possibleFaces) {
                const referencePos = placePos.plus(face.vector);
                const referenceBlock = bot.blockAt(referencePos);
                if (isPlaceableFloor(referenceBlock)) {
                    if (!bot.canSeeBlock(referenceBlock)) {
                        const goal = new goals.GoalNear(referencePos.x, referencePos.y, referencePos.z, 2);
                        await bot.pathfinder.goto(goal);
                    }
                    await bot.lookAt(placePos, true);
                    try {
                        await bot.placeBlock(referenceBlock, face.vector.scaled(-1));
                        return createResponse(`Placed block at (${x}, ${y}, ${z}) using ${face.direction} face`);
                    }
                    catch (placeError) {
                        console.error(`Failed to place using ${face.direction} face: ${placeError.message}`);
                        continue;
                    }
                }
            }
            return createResponse(`Failed to place block at (${x}, ${y}, ${z}): No suitable reference block found`);
        }
        catch (error) {
            return createErrorResponse(error);
        }
    });
}
// ========== Entity Interaction Tools ==========
function registerEntityTools(server, bot) {
    server.tool("find-entity", "Find the nearest entity of a specific type", {
        type: z.string().optional().describe("Type of entity to find (empty for any entity)"),
        maxDistance: z.number().optional().describe("Maximum search distance (default: 16)")
    }, async ({ type = '', maxDistance = 16 }) => {
        try {
            const entityFilter = (entity) => {
                if (!type)
                    return true;
                if (type === 'player')
                    return entity.type === 'player';
                if (type === 'mob')
                    return entity.type === 'mob';
                return entity.name && entity.name.includes(type.toLowerCase());
            };
            const entity = bot.nearestEntity(entityFilter);
            if (!entity || bot.entity.position.distanceTo(entity.position) > maxDistance) {
                return createResponse(`No ${type || 'entity'} found within ${maxDistance} blocks`);
            }
            return createResponse(`Found ${entity.name || entity.username || entity.type} at position (${Math.floor(entity.position.x)}, ${Math.floor(entity.position.y)}, ${Math.floor(entity.position.z)})`);
        }
        catch (error) {
            return createErrorResponse(error);
        }
    });
}
// ========== Chat Tool ==========
function registerChatTools(server, bot) {
    server.tool("send-chat", "Send a chat message in-game", {
        message: z.string().describe("Message to send in chat")
    }, async ({ message }) => {
        try {
            bot.chat(message);
            return createResponse(`Sent message: "${message}"`);
        }
        catch (error) {
            return createErrorResponse(error);
        }
    });
}
// ========== Advanced Image Processing Tools ==========
function registerAdvancedImageTools(server, bot) {
    server.tool("image-to-pixel-art", "Build pixel art from an image with high-quality processing", {
        imageBase64: z.string().describe("Base64 encoded image data"),
        origin: z.object({
            x: z.number(),
            y: z.number(),
            z: z.number()
        }).describe("Origin position for building"),
        direction: z.enum(["north", "south", "east", "west"]).default("south").describe("Direction to build (default: south)"),
        maxDimension: z.number().optional().default(300).describe("Maximum dimension (width/height) in blocks (default: 300)"),
        clearArea: z.boolean().optional().default(false).describe("Whether to clear the area before building")
    }, async ({ imageBase64, origin, direction, maxDimension = 300, clearArea = false }) => {
        try {
            // Make sure we're in creative mode
            bot.chat('/gamemode creative');
            await new Promise(res => setTimeout(res, 500));
            // Process the image to get blocks
            bot.chat('Processing image data using high-quality image processor...');
            const pixels = await imageBase64ToVerticalWall(imageBase64, maxDimension, maxDimension);
            // Clear the area if requested
            if (clearArea) {
                bot.chat('Clearing building area...');
                const width = pixels.length;
                const height = pixels[0].length;
                const clearCommand = `/fill ${origin.x} ${origin.y} ${origin.z} ${origin.x + width} ${origin.y + height} ${origin.z} air`;
                bot.chat(clearCommand);
                await new Promise(res => setTimeout(res, 500));
            }
            // Report dimensions
            bot.chat(`Processed image to ${pixels.length}x${pixels[0].length} blocks. Starting build...`);
            // Calculate build positions using the functions we defined
            const pixelPositions = calculatePixelPositions({
                pixels,
                origin,
                direction,
                verticalBuild: true,
                mirrorX: false,
                mirrorY: false,
                scale: 1
            });
            // Optimize build order for efficiency
            const optimizedOrder = calculateOptimalBuildOrder(pixelPositions);
            // Start building
            let placedCount = 0;
            const totalCount = optimizedOrder.length;
            for (const pixel of optimizedOrder) {
                try {
                    // Give the bot the block
                    const mcData = minecraftData(bot.version);
                    const blockName = pixel.blockType;
                    const item = mcData.itemsByName[blockName];
                    if (item) {
                        await bot.creative.setInventorySlot(36, { id: item.id, count: 64 });
                        await bot.equip(bot.registry.itemsByName[blockName], 'hand');
                        // Teleport to position near block placement
                        if (placedCount % 100 === 0) {
                            bot.entity.position.set(pixel.x, pixel.y, pixel.z);
                            await new Promise(res => setTimeout(res, 50));
                        }
                        // Place the block
                        const fillCommand = `/setblock ${pixel.x} ${pixel.y} ${pixel.z} ${blockName}`;
                        bot.chat(fillCommand);
                        placedCount++;
                        // Report progress
                        if (placedCount % 500 === 0 || placedCount === totalCount) {
                            const progress = Math.floor((placedCount / totalCount) * 100);
                            bot.chat(`Building progress: ${progress}% (${placedCount}/${totalCount} blocks)`);
                        }
                        // Small delay to prevent overwhelming the server
                        if (placedCount % 10 === 0) {
                            await new Promise(res => setTimeout(res, 10));
                        }
                    }
                }
                catch (error) {
                    console.error(`Error placing block: ${error}`);
                }
            }
            bot.chat("Pixel art build complete!");
            return createResponse(`Successfully built pixel art with ${placedCount} blocks!`);
        }
        catch (error) {
            return createErrorResponse(error);
        }
    });
}
// ========== Pixel Art Builder Tool ==========
/**
 * Place a block at the specified position
 */
async function placeBlockAt(bot, blockType, pos) {
    // Skip empty blocks
    if (blockType === "")
        return true;
    // Find or get the block in inventory
    let item = bot.inventory.items().find((i) => i.name === blockType);
    if (!item && bot.game.gameMode === 1 && bot.creative) {
        // In creative, give the item
        item = await ensureBlockInInventory(bot, blockType);
    }
    if (!item) {
        bot.chat(`Missing block: ${blockType} at (${pos.x}, ${pos.y}, ${pos.z})`);
        return false;
    }
    // Equip the block
    await bot.equip(item, 'hand');
    // Find a block to place against (try below first)
    const referencePos = new Vec3(pos.x, pos.y - 1, pos.z);
    const referenceBlock = bot.blockAt(referencePos);
    if (!isPlaceableFloor(referenceBlock)) {
        // Try other sides if below doesn't work
        const sides = [
            { x: pos.x + 1, y: pos.y, z: pos.z },
            { x: pos.x - 1, y: pos.y, z: pos.z },
            { x: pos.x, y: pos.y, z: pos.z + 1 },
            { x: pos.x, y: pos.y, z: pos.z - 1 },
            { x: pos.x, y: pos.y + 1, z: pos.z }
        ];
        let foundSide = false;
        for (const side of sides) {
            const sideBlock = bot.blockAt(new Vec3(side.x, side.y, side.z));
            if (isPlaceableFloor(sideBlock)) {
                // Calculate the face vector
                const faceVector = new Vec3(pos.x - side.x, pos.y - side.y, pos.z - side.z);
                // Move close to the target if needed
                if (!bot.canSeeBlock(sideBlock)) {
                    const goal = new goals.GoalNear(side.x, side.y, side.z, 2);
                    await bot.pathfinder.goto(goal);
                }
                // Look at the target
                await bot.lookAt(new Vec3(pos.x, pos.y, pos.z), true);
                // Try to place the block
                try {
                    await bot.placeBlock(sideBlock, faceVector);
                    return true;
                }
                catch (error) {
                    continue;
                }
                foundSide = true;
                break;
            }
        }
        if (!foundSide) {
            bot.chat(`No placeable surface around ${blockType} at (${pos.x}, ${pos.y}, ${pos.z})`);
            return false;
        }
    }
    // If the block is above the bot, fly up to it (creative mode only)
    if (bot.game.gameMode === 1 && bot.creative) {
        const botPos = bot.entity.position;
        if (pos.y > botPos.y + 1 || pos.y < botPos.y - 2 || botPos.distanceTo(new Vec3(pos.x, botPos.y, pos.z)) > 4) {
            // Move/fly close to the block position, but not inside the block
            bot.entity.position.set(pos.x, pos.y, pos.z);
            // Skip emitting the move event to avoid typing issues
            // bot.emit('move');
            bot._client.write('position', {
                x: pos.x,
                y: pos.y,
                z: pos.z,
                yaw: bot.entity.yaw,
                pitch: bot.entity.pitch,
                flags: 0x00
            });
            await new Promise(res => setTimeout(res, 100));
        }
    }
    // Look at the reference
    await bot.lookAt(referencePos, true);
    // Place the block
    try {
        await bot.placeBlock(referenceBlock, new Vec3(0, 1, 0));
        return true;
    }
    catch (err) {
        bot.chat(`Failed to place ${blockType} at (${pos.x}, ${pos.y}, ${pos.z}): ${err.message}`);
        return false;
    }
}
function registerPixelArtTools(server, bot) {
    // Tool to build from uploaded image base64 data
    server.tool("build-from-uploaded-image", "Build a pixel art from an uploaded image (base64 encoded)", {
        imageBase64: z.string().describe("Base64 encoded image data"),
        origin: z.object({
            x: z.number(),
            y: z.number(),
            z: z.number()
        }).describe("Origin position"),
        direction: z.enum(["north", "south", "east", "west"]).default("north").describe("Direction to build (default: north)"),
        verticalBuild: z.boolean().optional().describe("Build vertically on a wall instead of horizontally on the ground (default: true)"),
        maxHeight: z.number().optional().describe("Maximum height of the pixel art (default: 40 blocks)"),
        dithering: z.boolean().optional().describe("Whether to apply dithering for better color representation (default: true)")
    }, async ({ imageBase64, origin, direction, verticalBuild = true, maxHeight = 40, dithering = true }) => {
        try {
            // Make sure we're in creative mode
            bot.chat('/gamemode creative');
            // Validate max height
            if (maxHeight > 256) {
                return createErrorResponse("Maximum height cannot exceed 256 blocks due to Minecraft's height limit");
            }
            bot.chat(`Processing uploaded image...`);
            bot.chat(`This may take a moment. Converting image to blocks with max height: ${maxHeight}...`);
            // Process the base64 image data to get a 2D array of blocks
            const pixels = await processBase64Image(imageBase64, maxHeight, { dithering });
            // Get block requirements
            const blockCounts = getBlockCount(pixels);
            const blockSummary = formatImageBlockRequirements(blockCounts);
            const totalBlocks = Object.values(blockCounts).reduce((sum, count) => sum + count, 0);
            bot.chat(`Image processed! Size: ${pixels[0].length}x${pixels.length} (${totalBlocks} blocks total)`);
            bot.chat(`Blocks needed: ${blockSummary}`);
            // Directly call build logic similar to the image URL method
            const buildToolHandler = async () => {
                try {
                    // Validate pixel art input
                    const validation = validatePixelArt(pixels);
                    if (!validation.valid) {
                        return createErrorResponse(validation.error || "Invalid pixel art format");
                    }
                    // Calculate block requirements
                    const blockCounts = countBlocksNeeded(pixels);
                    const blockSummary = formatBlockRequirements(blockCounts);
                    // Prepare build environment
                    if (bot.game.gameMode === 1 && bot.creative) {
                        // Clear inventory before starting build
                        for (let slot = 0; slot < 9; slot++) {
                            if (bot.inventory.slots[slot]) {
                                await bot.creative.setInventorySlot(slot, null);
                            }
                        }
                        // Pre-populate hotbar with needed blocks
                        let slotIndex = 0;
                        for (const blockType of Object.keys(blockCounts)) {
                            if (slotIndex < 9 && blockType !== "") {
                                await ensureBlockInInventory(bot, blockType);
                                slotIndex++;
                            }
                        }
                    }
                    // Print out the block requirements for the user
                    bot.chat(`Blocks needed for pixel art: ${blockSummary}`);
                    bot.chat(`Building ${pixels.length}x${pixels[0].length} pixel art facing ${direction}${verticalBuild ? ' vertically' : ''}`);
                    // Teleport to origin position in creative mode
                    if (bot.game.gameMode === 1 && bot.creative) {
                        bot.entity.position.set(origin.x, origin.y, origin.z);
                        bot.emit('move');
                        bot._client.write('position', {
                            x: origin.x,
                            y: origin.y,
                            z: origin.z,
                            yaw: bot.entity.yaw,
                            pitch: bot.entity.pitch,
                            flags: 0x00
                        });
                        await new Promise(res => setTimeout(res, 500)); // Wait for teleport
                    }
                    else {
                        // Try teleport command as fallback
                        bot.chat(`/tp ${bot.username} ${origin.x} ${origin.y} ${origin.z}`);
                        await new Promise(res => setTimeout(res, 500));
                    }
                    // Calculate all pixel positions
                    const pixelPositions = calculatePixelPositions({
                        pixels,
                        origin: origin,
                        direction,
                        verticalBuild,
                        mirrorX: false,
                        mirrorY: false,
                        scale: 1
                    });
                    // Optimize build order
                    const optimizedOrder = calculateOptimalBuildOrder(pixelPositions);
                    // Start building
                    bot.chat("Starting pixel art build!");
                    let placedCount = 0;
                    const totalCount = optimizedOrder.length;
                    let lastProgressReport = 0;
                    for (const pixel of optimizedOrder) {
                        const success = await placeBlockAt(bot, pixel.blockType, { x: pixel.x, y: pixel.y, z: pixel.z });
                        if (success)
                            placedCount++;
                        // Report progress at key percentages
                        const currentProgress = Math.floor((placedCount / totalCount) * 100);
                        if ((currentProgress >= 10 && lastProgressReport < 10) ||
                            (currentProgress >= 25 && lastProgressReport < 25) ||
                            (currentProgress >= 50 && lastProgressReport < 50) ||
                            (currentProgress >= 75 && lastProgressReport < 75) ||
                            (placedCount === totalCount)) {
                            lastProgressReport = currentProgress;
                            bot.chat(`Building progress: ${currentProgress}% complete (${placedCount}/${totalCount} blocks)`);
                        }
                        // Small delay to prevent overwhelming the server
                        if (placedCount % 50 === 0) {
                            await new Promise(res => setTimeout(res, 100));
                        }
                    }
                    bot.chat("Pixel art build complete!");
                    return createResponse(`Successfully built pixel art with ${placedCount} blocks!`);
                }
                catch (error) {
                    return createErrorResponse(error);
                }
            };
            return await buildToolHandler();
        }
        catch (error) {
            return createErrorResponse(`Failed to process uploaded image: ${error.message}`);
        }
    });
    // Main pixel art builder tool
    server.tool("build-pixel-art", "Build a pixel art image from a 2D array of block types", {
        pixels: z.array(z.array(z.string())).describe("2D array of block types"),
        origin: z.object({
            x: z.number(),
            y: z.number(),
            z: z.number()
        }).describe("Origin position"),
        direction: z.enum(["north", "south", "east", "west"]).default("north").describe("Direction to build (default: north)"),
        verticalBuild: z.boolean().optional().describe("Build vertically on a wall instead of horizontally on the ground (default: false)"),
        scale: z.number().optional().describe("Scale factor for the pixel art (default: 1)"),
        mirrorX: z.boolean().optional().describe("Mirror the pixel art horizontally (default: false)"),
        mirrorY: z.boolean().optional().describe("Mirror the pixel art vertically (default: false)")
    }, async ({ pixels, origin, direction, verticalBuild = false, scale = 1, mirrorX = false, mirrorY = false }) => {
        try {
            // Validate pixel art input
            const validation = validatePixelArt(pixels);
            if (!validation.valid) {
                return createErrorResponse(validation.error || "Invalid pixel art format");
            }
            // Calculate block requirements
            const blockCounts = countBlocksNeeded(pixels);
            const blockSummary = formatBlockRequirements(blockCounts);
            // Prepare build environment
            if (bot.game.gameMode === 1 && bot.creative) {
                // Clear inventory before starting build
                for (let slot = 0; slot < 9; slot++) {
                    if (bot.inventory.slots[slot]) {
                        await bot.creative.setInventorySlot(slot, null);
                    }
                }
                // Pre-populate hotbar with needed blocks
                let slotIndex = 0;
                for (const blockType of Object.keys(blockCounts)) {
                    if (slotIndex < 9 && blockType !== "") {
                        await ensureBlockInInventory(bot, blockType);
                        slotIndex++;
                    }
                }
            }
            // Print out the block requirements for the user
            bot.chat(`Blocks needed for pixel art: ${blockSummary}`);
            bot.chat(`Building ${pixels.length}x${pixels[0].length} pixel art facing ${direction}${verticalBuild ? ' vertically' : ''}`);
            // Move to the origin position
            await bot.pathfinder.goto(new goals.GoalNear(origin.x, origin.y, origin.z, 2));
            // Calculate all pixel positions
            const pixelPositions = calculatePixelPositions({
                pixels,
                origin: origin,
                direction,
                verticalBuild,
                mirrorX,
                mirrorY,
                scale
            });
            // Optimize build order
            const optimizedOrder = calculateOptimalBuildOrder(pixelPositions);
            // Start building
            bot.chat("Starting pixel art build!");
            let placedCount = 0;
            const totalCount = optimizedOrder.length;
            for (const pixel of optimizedOrder) {
                const success = await placeBlockAt(bot, pixel.blockType, { x: pixel.x, y: pixel.y, z: pixel.z });
                if (success)
                    placedCount++;
                // Report progress at 25%, 50%, 75%, and 100%
                if (placedCount % Math.ceil(totalCount / 4) === 0 || placedCount === totalCount) {
                    const percentage = Math.floor((placedCount / totalCount) * 100);
                    bot.chat(`Building progress: ${percentage}% complete (${placedCount}/${totalCount} blocks)`);
                }
            }
            bot.chat("Pixel art build complete!");
            return createResponse(`Successfully built pixel art with ${placedCount} blocks!`);
        }
        catch (error) {
            return createErrorResponse(error);
        }
    });
    // Add within the registerPixelArtTools function
    server.tool("build-pixel-art-from-image-url", "Build a pixel art from an image URL", {
        imageUrl: z.string().describe("URL of the image to convert to pixel art"),
        origin: z.object({
            x: z.number(),
            y: z.number(),
            z: z.number()
        }).describe("Origin position"),
        direction: z.enum(["north", "south", "east", "west"]).default("north").describe("Direction to build (default: north)"),
        verticalBuild: z.boolean().optional().describe("Build vertically on a wall instead of horizontally on the ground (default: true)"),
        maxHeight: z.number().optional().describe("Maximum height of the pixel art (default: 50 blocks)"),
        dithering: z.boolean().optional().describe("Whether to apply dithering for better color representation (default: true)")
    }, async ({ imageUrl, origin, direction, verticalBuild = true, maxHeight = 50, dithering = true }) => {
        try {
            // Validate max height
            if (maxHeight > 256) {
                return createErrorResponse("Maximum height cannot exceed 256 blocks due to Minecraft's height limit");
            }
            bot.chat(`Processing image from URL: ${imageUrl}`);
            bot.chat(`This may take a moment. Converting image to blocks with max height: ${maxHeight}...`);
            // Process the image URL to get a 2D array of blocks
            const pixels = await processImageUrl(imageUrl, maxHeight, { dithering });
            // Get block requirements
            const blockCounts = getBlockCount(pixels);
            const blockSummary = formatImageBlockRequirements(blockCounts);
            const totalBlocks = Object.values(blockCounts).reduce((sum, count) => sum + count, 0);
            bot.chat(`Image processed! Size: ${pixels[0].length}x${pixels.length} (${totalBlocks} blocks total)`);
            bot.chat(`Blocks needed: ${blockSummary}`);
            // Use the standard pixel art builder
            // Call the build-pixel-art tool directly
            // Create a new tool config with the standard handler but using the processed image pixels
            const buildToolHandler = async () => {
                try {
                    // Validate pixel art input
                    const validation = validatePixelArt(pixels);
                    if (!validation.valid) {
                        return createErrorResponse(validation.error || "Invalid pixel art format");
                    }
                    // Calculate block requirements
                    const blockCounts = countBlocksNeeded(pixels);
                    const blockSummary = formatBlockRequirements(blockCounts);
                    // Rest of the tool implementation
                    // (Identical to the implementation in the build-pixel-art tool)
                    // Prepare build environment
                    if (bot.game.gameMode === 1 && bot.creative) {
                        // Clear inventory before starting build
                        for (let slot = 0; slot < 9; slot++) {
                            if (bot.inventory.slots[slot]) {
                                await bot.creative.setInventorySlot(slot, -1, 0);
                            }
                        }
                        // Pre-populate hotbar with needed blocks
                        let slotIndex = 0;
                        for (const blockType of Object.keys(blockCounts)) {
                            if (slotIndex < 9 && blockType !== "") {
                                await ensureBlockInInventory(bot, blockType);
                                slotIndex++;
                            }
                        }
                    }
                    // Print out the block requirements for the user
                    bot.chat(`Blocks needed for pixel art: ${blockSummary}`);
                    bot.chat(`Building ${pixels.length}x${pixels[0].length} pixel art facing ${direction}${verticalBuild ? ' vertically' : ''}`);
                    // Move to the origin position
                    await bot.pathfinder.goto(new goals.GoalNear(origin.x, origin.y, origin.z, 2));
                    // Calculate all pixel positions
                    const pixelPositions = calculatePixelPositions({
                        pixels,
                        origin: origin,
                        direction,
                        verticalBuild,
                        mirrorX: false,
                        mirrorY: false,
                        scale: 1
                    });
                    // Optimize build order
                    const optimizedOrder = calculateOptimalBuildOrder(pixelPositions);
                    // Start building
                    bot.chat("Starting pixel art build!");
                    let placedCount = 0;
                    const totalCount = optimizedOrder.length;
                    for (const pixel of optimizedOrder) {
                        const success = await placeBlockAt(bot, pixel.blockType, { x: pixel.x, y: pixel.y, z: pixel.z });
                        if (success)
                            placedCount++;
                        // Report progress at 25%, 50%, 75%, and 100%
                        if (placedCount % Math.ceil(totalCount / 4) === 0 || placedCount === totalCount) {
                            const percentage = Math.floor((placedCount / totalCount) * 100);
                            bot.chat(`Building progress: ${percentage}% complete (${placedCount}/${totalCount} blocks)`);
                        }
                    }
                    bot.chat("Pixel art build complete!");
                    return createResponse(`Successfully built pixel art with ${placedCount} blocks!`);
                }
                catch (error) {
                    return createErrorResponse(error);
                }
            };
            return await buildToolHandler();
        }
        catch (error) {
            return createErrorResponse(`Failed to process image URL: ${error.message}`);
        }
    });
    // Template listing tool
    server.tool("list-pixel-art-templates", "List available pixel art templates", {
        tag: z.string().optional().describe("Filter templates by tag (optional)")
    }, async ({ tag }) => {
        try {
            const templateIds = getAllTemplateIds();
            if (templateIds.length === 0) {
                return createResponse("No pixel art templates available.");
            }
            let response = "Available pixel art templates:\n\n";
            for (const id of templateIds) {
                const template = getTemplateById(id);
                if (template && (!tag || template.tags.includes(tag))) {
                    response += `- ${template.name} (${template.pixels.length}x${template.pixels[0].length}): ${template.description}\n  Tags: ${template.tags.join(", ")}\n  Use with template_id: "${id}"\n\n`;
                }
            }
            return createResponse(response);
        }
        catch (error) {
            return createErrorResponse(error);
        }
    });
    // Build from template tool
    server.tool("build-pixel-art-from-template", "Build a pixel art from a predefined template", {
        template_id: z.string().describe("Template ID from list-pixel-art-templates"),
        origin: z.object({
            x: z.number(),
            y: z.number(),
            z: z.number()
        }).describe("Origin position"),
        direction: z.enum(["north", "south", "east", "west"]).default("north").describe("Direction to build (default: north)"),
        verticalBuild: z.boolean().optional().describe("Build vertically on a wall instead of horizontally on the ground (default: false)"),
        scale: z.number().optional().describe("Scale factor for the pixel art (default: 1)"),
        blockMapping: z.record(z.string(), z.string()).optional().describe("Optional mapping to replace template blocks with different blocks")
    }, async ({ template_id, origin, direction, verticalBuild = false, scale = 1, blockMapping = {} }) => {
        try {
            const template = getTemplateById(template_id);
            if (!template) {
                return createErrorResponse(`Template with ID "${template_id}" not found. Use list-pixel-art-templates to see available templates.`);
            }
            // Apply block mapping to template pixels
            const pixels = template.pixels.map(row => row.map(block => blockMapping[block] || block));
            // Use the standard pixel art builder with the template pixels
            // Call the build-pixel-art tool directly with template pixels
            // Similar approach as above, but with the template pixels
            const buildToolHandler = async () => {
                try {
                    // Validate pixel art input
                    const validation = validatePixelArt(pixels);
                    if (!validation.valid) {
                        return createErrorResponse(validation.error || "Invalid pixel art format");
                    }
                    // Calculate block requirements
                    const blockCounts = countBlocksNeeded(pixels);
                    const blockSummary = formatBlockRequirements(blockCounts);
                    // Rest of the tool implementation
                    // (Identical to the implementation in the build-pixel-art tool)
                    // Prepare build environment
                    if (bot.game.gameMode === 1 && bot.creative) {
                        // Clear inventory before starting build
                        for (let slot = 0; slot < 9; slot++) {
                            if (bot.inventory.slots[slot]) {
                                await bot.creative.setInventorySlot(slot, -1, 0);
                            }
                        }
                        // Pre-populate hotbar with needed blocks
                        let slotIndex = 0;
                        for (const blockType of Object.keys(blockCounts)) {
                            if (slotIndex < 9 && blockType !== "") {
                                await ensureBlockInInventory(bot, blockType);
                                slotIndex++;
                            }
                        }
                    }
                    // Print out the block requirements for the user
                    bot.chat(`Blocks needed for pixel art: ${blockSummary}`);
                    bot.chat(`Building ${pixels.length}x${pixels[0].length} pixel art facing ${direction}${verticalBuild ? ' vertically' : ''}`);
                    // Move to the origin position
                    await bot.pathfinder.goto(new goals.GoalNear(origin.x, origin.y, origin.z, 2));
                    // Calculate all pixel positions
                    const pixelPositions = calculatePixelPositions({
                        pixels,
                        origin: origin,
                        direction,
                        verticalBuild,
                        mirrorX: false,
                        mirrorY: false,
                        scale
                    });
                    // Optimize build order
                    const optimizedOrder = calculateOptimalBuildOrder(pixelPositions);
                    // Start building
                    bot.chat("Starting pixel art build!");
                    let placedCount = 0;
                    const totalCount = optimizedOrder.length;
                    for (const pixel of optimizedOrder) {
                        const success = await placeBlockAt(bot, pixel.blockType, { x: pixel.x, y: pixel.y, z: pixel.z });
                        if (success)
                            placedCount++;
                        // Report progress at 25%, 50%, 75%, and 100%
                        if (placedCount % Math.ceil(totalCount / 4) === 0 || placedCount === totalCount) {
                            const percentage = Math.floor((placedCount / totalCount) * 100);
                            bot.chat(`Building progress: ${percentage}% complete (${placedCount}/${totalCount} blocks)`);
                        }
                    }
                    bot.chat("Pixel art build complete!");
                    return createResponse(`Successfully built pixel art with ${placedCount} blocks!`);
                }
                catch (error) {
                    return createErrorResponse(error);
                }
            };
            return await buildToolHandler();
        }
        catch (error) {
            return createErrorResponse(error);
        }
    });
}
// ========== Main Application ==========
async function main() {
    let bot;
    try {
        // Parse command line arguments
        const argv = parseCommandLineArgs();
        // Set up the Minecraft bot
        bot = setupBot(argv);
        // Create and configure MCP server
        const server = createMcpServer(bot);
        // Register the direct image URL tool at startup for easier access
        server.tool("build-pixel-art-from-image-url", "Build a pixel art from an image URL (direct access)", {
            imageUrl: z.string().describe("URL of the image to convert to pixel art"),
            origin: z.object({
                x: z.number(),
                y: z.number(),
                z: z.number()
            }).describe("Origin position"),
            direction: z.enum(["north", "south", "east", "west"]).default("north").describe("Direction to build (default: north)"),
            verticalBuild: z.boolean().optional().describe("Build vertically on a wall instead of horizontally on the ground (default: true)"),
            maxHeight: z.number().optional().describe("Maximum height of the pixel art (default: 50 blocks)"),
            dithering: z.boolean().optional().describe("Whether to apply dithering for better color representation (default: true)")
        }, async ({ imageUrl, origin, direction, verticalBuild = true, maxHeight = 50, dithering = true }) => {
            try {
                // Make sure we're in creative mode and OP
                bot.chat('/gamemode creative');
                // Validate max height
                if (maxHeight > 256) {
                    return createErrorResponse("Maximum height cannot exceed 256 blocks due to Minecraft's height limit");
                }
                bot.chat(`Processing image from URL: ${imageUrl}`);
                bot.chat(`This may take a moment. Converting image to blocks with max height: ${maxHeight}...`);
                // Process the image URL to get a 2D array of blocks
                const pixels = await processImageUrl(imageUrl, maxHeight, { dithering });
                // Get block requirements
                const blockCounts = getBlockCount(pixels);
                const blockSummary = formatImageBlockRequirements(blockCounts);
                const totalBlocks = Object.values(blockCounts).reduce((sum, count) => sum + count, 0);
                bot.chat(`Image processed! Size: ${pixels[0].length}x${pixels.length} (${totalBlocks} blocks total)`);
                bot.chat(`Blocks needed: ${blockSummary}`);
                // Call the build-pixel-art tool directly
                const buildToolHandler = async () => {
                    try {
                        // Validate pixel art input
                        const validation = validatePixelArt(pixels);
                        if (!validation.valid) {
                            return createErrorResponse(validation.error || "Invalid pixel art format");
                        }
                        // Calculate block requirements
                        const blockCounts = countBlocksNeeded(pixels);
                        const blockSummary = formatBlockRequirements(blockCounts);
                        // Prepare build environment
                        const isCreative = bot.game && ((typeof bot.game.gameMode === 'number' && bot.game.gameMode === 1) || (typeof bot.game.gameMode === 'string' && bot.game.gameMode.toLowerCase().includes('creative')));
                        if (isCreative && bot.creative) {
                            // Clear inventory before starting build
                            for (let slot = 0; slot < 9; slot++) {
                                if (bot.inventory.slots[slot]) {
                                    await bot.creative.setInventorySlot(slot, null);
                                }
                            }
                            // Pre-populate hotbar with needed blocks
                            let slotIndex = 0;
                            for (const blockType of Object.keys(blockCounts)) {
                                if (slotIndex < 9 && blockType !== "") {
                                    await ensureBlockInInventory(bot, blockType);
                                    slotIndex++;
                                }
                            }
                        }
                        // Print out the block requirements for the user
                        bot.chat(`Blocks needed for pixel art: ${blockSummary}`);
                        bot.chat(`Building ${pixels.length}x${pixels[0].length} pixel art facing ${direction}${verticalBuild ? ' vertically' : ''}`);
                        // Teleport to origin position in creative mode
                        const isCreativeMode = bot.game && ((typeof bot.game.gameMode === 'number' && bot.game.gameMode === 1) || (typeof bot.game.gameMode === 'string' && bot.game.gameMode.toLowerCase().includes('creative')));
                        if (isCreativeMode && bot.creative) {
                            bot.entity.position.set(origin.x, origin.y, origin.z);
                            // Skip emitting the move event to avoid typing issues
                            // bot.emit('move');
                            bot._client.write('position', {
                                x: origin.x,
                                y: origin.y,
                                z: origin.z,
                                yaw: bot.entity.yaw,
                                pitch: bot.entity.pitch,
                                flags: 0x00
                            });
                            await new Promise(res => setTimeout(res, 500)); // Wait for teleport
                        }
                        else {
                            // Move to the origin position using pathfinder if not in creative
                            try {
                                await bot.pathfinder.goto(new goals.GoalNear(origin.x, origin.y, origin.z, 2));
                            }
                            catch (moveError) {
                                bot.chat(`Warning: Could not path to build location. Trying to teleport...`);
                                bot.chat(`/tp ${bot.username} ${origin.x} ${origin.y} ${origin.z}`);
                                await new Promise(res => setTimeout(res, 500)); // Wait for potential teleport
                            }
                        }
                        // Calculate all pixel positions
                        const pixelPositions = calculatePixelPositions({
                            pixels,
                            origin: origin,
                            direction,
                            verticalBuild,
                            mirrorX: false,
                            mirrorY: false,
                            scale: 1
                        });
                        // Optimize build order
                        const optimizedOrder = calculateOptimalBuildOrder(pixelPositions);
                        // Start building
                        bot.chat("Starting pixel art build!");
                        let placedCount = 0;
                        const totalCount = optimizedOrder.length;
                        let lastProgressReport = 0;
                        for (const pixel of optimizedOrder) {
                            const success = await placeBlockAt(bot, pixel.blockType, { x: pixel.x, y: pixel.y, z: pixel.z });
                            if (success)
                                placedCount++;
                            // Report progress at 10%, 25%, 50%, 75%, and 100%
                            const currentProgress = Math.floor((placedCount / totalCount) * 100);
                            if ((currentProgress >= 10 && lastProgressReport < 10) ||
                                (currentProgress >= 25 && lastProgressReport < 25) ||
                                (currentProgress >= 50 && lastProgressReport < 50) ||
                                (currentProgress >= 75 && lastProgressReport < 75) ||
                                (placedCount === totalCount)) {
                                lastProgressReport = currentProgress;
                                bot.chat(`Building progress: ${currentProgress}% complete (${placedCount}/${totalCount} blocks)`);
                            }
                            // Small delay to prevent overwhelming the server
                            if (placedCount % 50 === 0) {
                                await new Promise(res => setTimeout(res, 100));
                            }
                        }
                        bot.chat("Pixel art build complete!");
                        return createResponse(`Successfully built pixel art with ${placedCount} blocks!`);
                    }
                    catch (error) {
                        return createErrorResponse(error);
                    }
                };
                return await buildToolHandler();
            }
            catch (error) {
                return createErrorResponse(`Failed to process image URL: ${error.message}`);
            }
        });
        // Handle stdin end - this will detect when Claude Desktop is closed
        process.stdin.on('end', () => {
            console.error("Claude has disconnected. Shutting down...");
            if (bot && typeof bot.quit === 'function') {
                bot.quit();
            }
            process.exit(0);
        });
        // Connect to the transport
        const transport = new StdioServerTransport();
        await server.connect(transport);
        console.error("Minecraft MCP Server running on stdio with enhanced image processing");
    }
    catch (error) {
        console.error("Failed to start server:", error);
        if (bot)
            bot.quit();
        process.exit(1);
    }
}
// Start the application
main().catch((error) => {
    console.error("Fatal error in main():", error);
    process.exit(1);
});
//# sourceMappingURL=bot.js.map