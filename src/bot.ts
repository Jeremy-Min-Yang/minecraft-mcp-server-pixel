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

// ========== Type Definitions ==========

type TextContent = {
  type: "text";
  text: string;
};

type ContentItem = TextContent;

type McpResponse = {
  content: ContentItem[];
  _meta?: Record<string, unknown>;
  isError?: boolean;
  [key: string]: unknown;
};

interface InventoryItem {
  name: string;
  count: number;
  slot: number;
}

interface FaceOption {
  direction: string;
  vector: Vec3;
}

type Direction = 'forward' | 'back' | 'left' | 'right';
type FaceDirection = 'up' | 'down' | 'north' | 'south' | 'east' | 'west';

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

function createResponse(text: string): McpResponse {
  return {
    content: [{ type: "text", text }]
  };
}

function createErrorResponse(error: Error | string): McpResponse {
  const errorMessage = typeof error === 'string' ? error : error.message;
  console.error(`Error: ${errorMessage}`);
  return {
    content: [{ type: "text", text: `Failed: ${errorMessage}` }],
    isError: true
  };
}

// ========== Creative Equip Helper ==========

async function ensureBlockInInventory(bot: any, blockName: string) {
  const mcData = minecraftData(bot.version);
  const item = mcData.itemsByName[blockName];
  if (!item) throw new Error(`Unknown block: ${blockName}. Use 'list-block-names' to see valid names.`);

  // Check if already in inventory
  const existing = bot.inventory.items().find((i: any) => i.name === blockName);
  if (existing) return existing;

  // Find an empty slot
  const emptySlot = bot.inventory.firstEmptyInventorySlot();
  if (emptySlot === null) throw new Error("No empty inventory slot available");

  // Use creative API to set the slot
  if (bot.creative && bot.game.gameMode === 1) {
    await bot.creative.setInventorySlot(emptySlot, item.id, 64);
    // Wait for inventory update
    await new Promise(res => setTimeout(res, 100));
    return bot.inventory.slots[emptySlot];
  } else {
    throw new Error("Not in creative mode or not OP. Make sure the bot is OP and in creative mode. Use 'get-bot-status' to check.");
  }
}

// ========== Block Placeability Helper ==========

function isPlaceableFloor(block: any): boolean {
  if (!block) return false;
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

function setupBot(argv: any) {
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
    if (username === bot.username) return;
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

function createMcpServer(bot: any) {
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
  
  return server;
}

// ========== Position and Movement Tools ==========

function registerPositionTools(server: McpServer, bot: any) {
  server.tool(
    "get-position",
    "Get the current position of the bot",
    {},
    async (): Promise<McpResponse> => {
      try {
        const position = bot.entity.position;
        const pos = {
          x: Math.floor(position.x),
          y: Math.floor(position.y),
          z: Math.floor(position.z)
        };
        return createResponse(`Current position: (${pos.x}, ${pos.y}, ${pos.z})`);
      } catch (error) {
        return createErrorResponse(error as Error);
      }
    }
  );

  server.tool(
    "move-to-position",
    "Move or teleport the bot to a specific position (teleports in creative mode)",
    {
      x: z.number().describe("X coordinate"),
      y: z.number().describe("Y coordinate"),
      z: z.number().describe("Z coordinate"),
      range: z.number().optional().describe("How close to get to the target (default: 1)")
    },
    async ({ x, y, z, range = 1 }): Promise<McpResponse> => {
      try {
        if (bot.game.gameMode === 1 && bot.creative) {
          // Teleport in creative mode
          bot.entity.position.set(x, y, z);
          bot.emit('move');
          bot._client.write('position', {
            x, y, z,
            yaw: bot.entity.yaw,
            pitch: bot.entity.pitch,
            flags: 0x00
          });
          return createResponse(`Teleported to (${x}, ${y}, ${z})`);
        } else {
          // Use pathfinder in survival
          const goal = new goals.GoalNear(x, y, z, range);
          await bot.pathfinder.goto(goal);
          return createResponse(`Successfully moved to position near (${x}, ${y}, ${z})`);
        }
      } catch (error) {
        return createErrorResponse(error as Error);
      }
    }
  );
}

// ========== Inventory Management Tools ==========

function registerInventoryTools(server: McpServer, bot: any) {
  server.tool(
    "equip-item",
    "Equip a specific item",
    {
      itemName: z.string().describe("Name of the item to equip"),
      destination: z.string().optional().describe("Where to equip the item (default: 'hand')")
    },
    async ({ itemName, destination = 'hand' }): Promise<McpResponse> => {
      try {
        let item = bot.inventory.items().find((i: any) => i.name.includes(itemName.toLowerCase()));
        if (!item && bot.game.gameMode === 1 && bot.creative) {
          // In creative, give the item
          item = await ensureBlockInInventory(bot, itemName.toLowerCase());
        }
        if (!item) {
          return createResponse(`Couldn't find or give any item matching '${itemName}'. (Check block name, creative mode, and OP status)`);
        }
        await bot.equip(item, destination as mineflayer.EquipmentDestination);
        return createResponse(`Equipped ${item.name} to ${destination}`);
      } catch (error) {
        return createErrorResponse(error as Error);
      }
    }
  );

  // Tool: Print bot's current game mode and OP status
  server.tool(
    "get-bot-status",
    "Print the bot's current game mode and OP status",
    {},
    async (): Promise<McpResponse> => {
      try {
        const gm = bot.game && bot.game.gameMode;
        const isCreative = (gm === 1);
        // OP status is not directly available, but we can check if bot.creative exists
        const isOp = !!bot.creative;
        return createResponse(`Game mode: ${gm} (${isCreative ? 'creative' : 'not creative'}), OP: ${isOp ? 'yes' : 'no'}`);
      } catch (error) {
        return createErrorResponse(error as Error);
      }
    }
  );

  // Tool: List all valid block names for this Minecraft version
  server.tool(
    "list-block-names",
    "List all valid block names for the current Minecraft version",
    {},
    async (): Promise<McpResponse> => {
      try {
        const mcData = minecraftData(bot.version);
        const blockNames = Object.keys(mcData.itemsByName).filter(name => mcData.itemsByName[name].stackSize === 64);
        // Only show the first 100 for brevity
        const preview = blockNames.slice(0, 100).join(", ");
        return createResponse(`First 100 block names: ${preview} ... (total: ${blockNames.length})`);
      } catch (error) {
        return createErrorResponse(error as Error);
      }
    }
  );
}

// ========== Block Interaction Tools ==========

function registerBlockTools(server: McpServer, bot: any) {
  server.tool(
    "place-block",
    "Place a block at the specified position",
    {
      x: z.number().describe("X coordinate"),
      y: z.number().describe("Y coordinate"),
      z: z.number().describe("Z coordinate"),
      faceDirection: z.enum(['up', 'down', 'north', 'south', 'east', 'west']).optional().describe("Direction to place against (default: 'down')")
    },
    async ({ x, y, z, faceDirection = 'down' }: { x: number, y: number, z: number, faceDirection?: FaceDirection }): Promise<McpResponse> => {
      try {
        const placePos = new Vec3(x, y, z);
        const blockAtPos = bot.blockAt(placePos);
        if (blockAtPos && blockAtPos.name !== 'air') {
          return createResponse(`There's already a block (${blockAtPos.name}) at (${x}, ${y}, ${z})`);
        }
        const possibleFaces: FaceOption[] = [
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
            } catch (placeError) {
              console.error(`Failed to place using ${face.direction} face: ${(placeError as Error).message}`);
              continue;
            }
          }
        }
        return createResponse(`Failed to place block at (${x}, ${y}, ${z}): No suitable reference block found`);
      } catch (error) {
        return createErrorResponse(error as Error);
      }
    }
  );
}

// ========== Entity Interaction Tools ==========

function registerEntityTools(server: McpServer, bot: any) {
  server.tool(
    "find-entity",
    "Find the nearest entity of a specific type",
    {
      type: z.string().optional().describe("Type of entity to find (empty for any entity)"),
      maxDistance: z.number().optional().describe("Maximum search distance (default: 16)")
    },
    async ({ type = '', maxDistance = 16 }): Promise<McpResponse> => {
      try {
        const entityFilter = (entity: any) => {
          if (!type) return true;
          if (type === 'player') return entity.type === 'player';
          if (type === 'mob') return entity.type === 'mob';
          return entity.name && entity.name.includes(type.toLowerCase());
        };
        
        const entity = bot.nearestEntity(entityFilter);
        
        if (!entity || bot.entity.position.distanceTo(entity.position) > maxDistance) {
          return createResponse(`No ${type || 'entity'} found within ${maxDistance} blocks`);
        }
        
        return createResponse(`Found ${entity.name || (entity as any).username || entity.type} at position (${Math.floor(entity.position.x)}, ${Math.floor(entity.position.y)}, ${Math.floor(entity.position.z)})`);
      } catch (error) {
        return createErrorResponse(error as Error);
      }
    }
  );
}

// ========== Chat Tool ==========

function registerChatTools(server: McpServer, bot: any) {
  server.tool(
    "send-chat",
    "Send a chat message in-game",
    {
      message: z.string().describe("Message to send in chat")
    },
    async ({ message }): Promise<McpResponse> => {
      try {
        bot.chat(message);
        return createResponse(`Sent message: "${message}"`);
      } catch (error) {
        return createErrorResponse(error as Error);
      }
    }
  );
}

// ========== Pixel Art Builder Tool ==========

// Import our custom utilities and templates
import { 
  calculatePixelPositions, 
  countBlocksNeeded, 
  formatBlockRequirements, 
  calculateOptimalBuildOrder,
  validatePixelArt
} from './utils/pixelArtUtils.js';
import { pixelArtTemplates, getAllTemplateIds, getTemplateById } from './templates/pixelArtTemplates.js';

/**
 * Place a block at the specified position
 */
async function placeBlockAt(bot: any, blockType: string, pos: { x: number, y: number, z: number }) {
  // Skip empty blocks
  if (blockType === "") return true;
  
  // Find or get the block in inventory
  let item = bot.inventory.items().find((i: any) => i.name === blockType);
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
        const faceVector = new Vec3(
          pos.x - side.x,
          pos.y - side.y,
          pos.z - side.z
        );
        
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
        } catch (error) {
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
      bot.emit('move');
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
  } catch (err) {
    bot.chat(`Failed to place ${blockType} at (${pos.x}, ${pos.y}, ${pos.z}): ${(err as Error).message}`);
    return false;
  }
}

function registerPixelArtTools(server: McpServer, bot: any) {
  // Main pixel art builder tool
  server.tool(
    "build-pixel-art",
    "Build a pixel art image from a 2D array of block types",
    {
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
    },
    async ({ pixels, origin, direction, verticalBuild = false, scale = 1, mirrorX = false, mirrorY = false }) => {
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
          origin,
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
          if (success) placedCount++;
          
          // Report progress at 25%, 50%, 75%, and 100%
          if (placedCount % Math.ceil(totalCount / 4) === 0 || placedCount === totalCount) {
            const percentage = Math.floor((placedCount / totalCount) * 100);
            bot.chat(`Building progress: ${percentage}% complete (${placedCount}/${totalCount} blocks)`);
          }
        }
        
        bot.chat("Pixel art build complete!");
        return createResponse(`Successfully built pixel art with ${placedCount} blocks!`);
      } catch (error) {
        return createErrorResponse(error as Error);
      }
    }
  );
  
  // Template listing tool
  server.tool(
    "list-pixel-art-templates",
    "List available pixel art templates",
    {
      tag: z.string().optional().describe("Filter templates by tag (optional)")
    },
    async ({ tag }) => {
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
      } catch (error) {
        return createErrorResponse(error as Error);
      }
    }
  );
  
  // Build from template tool
  server.tool(
    "build-pixel-art-from-template",
    "Build a pixel art from a predefined template",
    {
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
    },
    async ({ template_id, origin, direction, verticalBuild = false, scale = 1, blockMapping = {} }) => {
      try {
        const template = getTemplateById(template_id);
        
        if (!template) {
          return createErrorResponse(`Template with ID "${template_id}" not found. Use list-pixel-art-templates to see available templates.`);
        }
        
        // Apply block mapping to template pixels
        const pixels = template.pixels.map(row =>
          row.map(block => blockMapping[block] || block)
        );
        
        // Use the standard pixel art builder with the template pixels
        return server.executeToolWithSchema("build-pixel-art", {
          pixels,
          origin,
          direction,
          verticalBuild,
          scale
        });
      } catch (error) {
        return createErrorResponse(error as Error);
      }
    }
  );
}

// ========== Main Application ==========

async function main() {
  let bot: mineflayer.Bot | undefined;
  
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
      if (bot && typeof bot.quit === 'function') {
        bot.quit();
      }
      process.exit(0);
    });
    
    // Connect to the transport
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("Minecraft MCP Server running on stdio"); 
  } catch (error) {
    console.error("Failed to start server:", error);
    if (bot) bot.quit();
    process.exit(1);
  }
}

// Start the application
main().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
}); 