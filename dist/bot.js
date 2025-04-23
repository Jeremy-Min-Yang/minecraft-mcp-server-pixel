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
        bot.chat('Claude-powered bot ready to receive instructions!');
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
    registerPixelArtTool(server, bot);
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
    server.tool("move-to-position", "Move the bot to a specific position", {
        x: z.number().describe("X coordinate"),
        y: z.number().describe("Y coordinate"),
        z: z.number().describe("Z coordinate"),
        range: z.number().optional().describe("How close to get to the target (default: 1)")
    }, async ({ x, y, z, range = 1 }) => {
        try {
            const goal = new goals.GoalNear(x, y, z, range);
            await bot.pathfinder.goto(goal);
            return createResponse(`Successfully moved to position near (${x}, ${y}, ${z})`);
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
            const items = bot.inventory.items();
            const item = items.find((item) => item.name.includes(itemName.toLowerCase()));
            if (!item) {
                return createResponse(`Couldn't find any item matching '${itemName}' in inventory`);
            }
            await bot.equip(item, destination);
            return createResponse(`Equipped ${item.name} to ${destination}`);
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
    }, async ({ x, y, z, faceDirection = 'down' }) => {
        try {
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
                if (referenceBlock && referenceBlock.name !== 'air') {
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
// ========== Pixel Art Builder Tool ==========
async function placeBlockAt(bot, blockType, pos) {
    // Find the block in inventory
    const item = bot.inventory.items().find((i) => i.name === blockType);
    if (!item) {
        bot.chat(`Missing block: ${blockType} at (${pos.x}, ${pos.y}, ${pos.z})`);
        return false;
    }
    // Equip the block
    await bot.equip(item, 'hand');
    // Find a block to place against (try below)
    const referencePos = new Vec3(pos.x, pos.y - 1, pos.z);
    const referenceBlock = bot.blockAt(referencePos);
    if (!referenceBlock) {
        bot.chat(`No reference block to place ${blockType} at (${pos.x}, ${pos.y}, ${pos.z})`);
        return false;
    }
    // Place the block
    try {
        await bot.placeBlock(referenceBlock, new Vec3(0, 1, 0));
        return true;
    }
    catch (err) {
        bot.chat(`Failed to place ${blockType} at (${pos.x}, ${pos.y}, ${pos.z})`);
        return false;
    }
}
function registerPixelArtTool(server, bot) {
    server.tool("build-pixel-art", "Build a pixel art image from a 2D array of block types", {
        pixels: z.array(z.array(z.string())).describe("2D array of block types"),
        origin: z.object({
            x: z.number(),
            y: z.number(),
            z: z.number()
        }).describe("Origin position"),
        direction: z.enum(["north", "south", "east", "west"]).default("north")
    }, async ({ pixels, origin, direction }) => {
        try {
            await bot.pathfinder.goto(new goals.GoalNear(origin.x, origin.y, origin.z, 1));
            bot.chat("Starting pixel art build!");
            for (let row = 0; row < pixels.length; row++) {
                for (let col = 0; col < pixels[row].length; col++) {
                    const blockType = pixels[row][col];
                    // Calculate world position based on direction
                    let x = origin.x, z = origin.z;
                    if (direction === "north") {
                        x += col;
                        z -= row;
                    }
                    else if (direction === "south") {
                        x += col;
                        z += row;
                    }
                    else if (direction === "east") {
                        x += row;
                        z += col;
                    }
                    else if (direction === "west") {
                        x -= row;
                        z += col;
                    }
                    const y = origin.y;
                    await placeBlockAt(bot, blockType, { x, y, z });
                }
                bot.chat(`Finished row ${row + 1} of ${pixels.length}`);
            }
            bot.chat("Pixel art build complete!");
            return createResponse("Pixel art build complete!");
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
        // Handle stdin end - this will detect when Claude Desktop is closed
        process.stdin.on('end', () => {
            console.error("Claude has disconnected. Shutting down...");
            if (bot) {
                bot.quit();
            }
            process.exit(0);
        });
        // Connect to the transport
        const transport = new StdioServerTransport();
        await server.connect(transport);
        console.error("Minecraft MCP Server running on stdio");
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
