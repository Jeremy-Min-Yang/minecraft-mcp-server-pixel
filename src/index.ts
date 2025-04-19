// If you see a module not found error, run: npm install mineflayer
import mineflayer from 'mineflayer';
import type { Vec3 as Vec3Type } from 'vec3';
const Vec3 = require('vec3');

console.log('Starting Minecraft MCP server...');

// Initialize Mineflayer bot
const bot = mineflayer.createBot({
  host: 'localhost', // Minecraft server address
  port: 25565,       // Default LAN port
  username: 'ClaudeBot', // Bot username
  version: '1.20.2', // Minecraft version
});

// Optionally load pathfinder if available
let pathfinderLoaded = false;
try {
  // @ts-ignore
  const { pathfinder, Movements, goals } = require('mineflayer-pathfinder');
  bot.loadPlugin(pathfinder);
  pathfinderLoaded = true;
} catch (e) {
  console.log('mineflayer-pathfinder not installed, will use teleport for movement.');
}

bot.on('login', () => {
  console.log('Bot has logged in to the Minecraft server.');
});

bot.on('error', (err: Error) => {
  console.error('Bot encountered an error:', err);
});

bot.on('end', () => {
  console.log('Bot has disconnected from the server.');
});

// --- MCP server interface ---

// Listen for JSON commands on stdin
process.stdin.setEncoding('utf8');
let buffer = '';

process.stdin.on('data', (chunk) => {
  buffer += chunk;
  let boundary;
  while ((boundary = buffer.indexOf('\n')) >= 0) {
    const line = buffer.slice(0, boundary);
    buffer = buffer.slice(boundary + 1);
    if (line.trim() === '') continue;
    try {
      const command = JSON.parse(line);
      handleMcpCommand(command);
    } catch (err) {
      sendMcpResponse({ error: 'Invalid JSON received', details: err instanceof Error ? err.message : String(err) });
    }
  }
});

function sendMcpResponse(response: any) {
  process.stdout.write(JSON.stringify(response) + '\n');
}

/**
 * Expected 'build-pixel-art' command structure:
 * {
 *   type: 'build-pixel-art',
 *   pixelArt: string[][], // 2D array of block names (e.g. 'minecraft:wool')
 *   width: number,        // width in blocks
 *   height: number        // height in blocks
 * }
 */
async function handleMcpCommand(command: any) {
  if (command.type === 'build-pixel-art') {
    const { pixelArt, width, height } = command;
    if (!Array.isArray(pixelArt) || typeof width !== 'number' || typeof height !== 'number') {
      sendMcpResponse({ error: 'Invalid build-pixel-art command structure' });
      return;
    }
    sendMcpResponse({ status: 'searching', message: 'Searching for a clear area to build pixel art...' });
    try {
      const area = await findClearArea(width, height);
      if (!area) {
        sendMcpResponse({ error: 'No clear area found for pixel art of size ' + width + 'x' + height });
        return;
      }
      sendMcpResponse({ status: 'ready', message: `Found clear area at (${area.x}, ${area.y}, ${area.z}). Moving to build location...` });
      await moveToArea(area.x, area.y, area.z);
      sendMcpResponse({ status: 'start', message: 'Starting pixel art build...' });
      await buildPixelArt(area.x, area.y, area.z, pixelArt, width, height);
      sendMcpResponse({ status: 'done', message: 'Pixel art build complete!' });
    } catch (err) {
      sendMcpResponse({ error: 'Error during build process', details: err instanceof Error ? err.message : String(err) });
    }
  } else {
    sendMcpResponse({ error: 'Unknown command type', type: command.type });
  }
}

/**
 * Finds a clear area of the given width and height on the ground (y = bot.entity.position.y - 1).
 * Returns {x, y, z} of the bottom-left corner facing north, or null if not found.
 */
async function findClearArea(width: number, height: number): Promise<{x: number, y: number, z: number} | null> {
  const origin = bot.entity.position;
  const y = Math.floor(origin.y) - 1; // ground level
  const maxRadius = 32; // search up to 32 blocks away
  for (let r = 0; r < maxRadius; r++) {
    for (let dx = -r; dx <= r; dx++) {
      for (let dz = -r; dz <= r; dz++) {
        const x = Math.floor(origin.x) + dx;
        const z = Math.floor(origin.z) + dz;
        if (await isAreaClear(x, y, z, width, height)) {
          return { x, y: y + 1, z }; // build on top of ground
        }
      }
    }
  }
  return null;
}

/**
 * Checks if the area (x, y, z) to (x+width-1, y, z+height-1) is clear (air above, solid ground below).
 */
async function isAreaClear(x: number, y: number, z: number, width: number, height: number): Promise<boolean> {
  for (let dx = 0; dx < width; dx++) {
    for (let dz = 0; dz < height; dz++) {
      const ground = bot.blockAt(new Vec3(x + dx, y, z + dz));
      const above = bot.blockAt(new Vec3(x + dx, y + 1, z + dz));
      if (!ground || ground.boundingBox !== 'block' || (above && above.name !== 'air')) {
        return false;
      }
    }
  }
  return true;
}

/**
 * Moves the bot to the specified (x, y, z) location. Uses pathfinder if available, otherwise teleports.
 */
async function moveToArea(x: number, y: number, z: number): Promise<void> {
  if (pathfinderLoaded && (bot as any).pathfinder) {
    const { Movements, goals } = require('mineflayer-pathfinder');
    const mcData = require('minecraft-data')(bot.version);
    const defaultMove = new Movements(bot, mcData);
    (bot as any).pathfinder.setMovements(defaultMove);
    return new Promise((resolve, reject) => {
      (bot as any).pathfinder.setGoal(new goals.GoalBlock(x, y, z), false);
      const onArrive = () => {
        (bot as any).removeListener('goal_reached', onArrive);
        resolve();
      };
      (bot as any).on('goal_reached', onArrive);
      setTimeout(() => {
        (bot as any).removeListener('goal_reached', onArrive);
        reject(new Error('Timeout moving to build area'));
      }, 15000);
    });
  } else {
    // Teleport (creative mode only)
    bot.entity.position.set(x + 0.5, y, z + 0.5);
    bot.emit('forcedMove');
    await new Promise((res) => setTimeout(res, 500));
  }
}

/**
 * Builds the pixel art at the given location, facing north (z decreases as you go up rows).
 */
async function buildPixelArt(x: number, y: number, z: number, pixelArt: string[][], width: number, height: number): Promise<void> {
  for (let row = 0; row < height; row++) {
    for (let col = 0; col < width; col++) {
      const blockName = pixelArt[row][col];
      const placeX = x + col;
      const placeY = y;
      const placeZ = z + (height - 1 - row); // bottom row is at z + height - 1
      await placeBlockAt(placeX, placeY, placeZ, blockName);
    }
  }
}

/**
 * Places a block of the given type at (x, y, z). Assumes creative mode.
 * Uses bot.creative.give if available, otherwise setInventorySlot.
 */
async function placeBlockAt(x: number, y: number, z: number, blockName: string): Promise<void> {
  const targetPos = new Vec3(x, y, z);
  const existing = bot.blockAt(targetPos);
  // Remove any block at the target location
  if (existing && existing.name !== 'air') {
    if ((bot as any).creative?.give) {
      await (bot as any).creative.give(blockName, 1);
    }
    await bot.dig(existing, true);
  }
  // Place the block
  if ((bot as any).creative?.give) {
    await (bot as any).creative.give(blockName, 1);
  }
  const reference = bot.blockAt(new Vec3(x, y - 1, z));
  if (!reference) throw new Error('No block below to place against');
  await bot.placeBlock(reference, new Vec3(0, 1, 0));
  await new Promise((res) => setTimeout(res, 50)); // Small delay for realism
}

// TODO: Set up MCP server interface to receive commands from Claude 