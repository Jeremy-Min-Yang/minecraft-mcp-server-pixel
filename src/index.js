// Redirect all console logs to stderr to avoid breaking JSON-RPC on stdout
console.log = (...args) => process.stderr.write(args.join(' ') + '\n');
console.error = (...args) => process.stderr.write(args.join(' ') + '\n');

// Enhanced error logging
process.on('exit', (code) => {
  console.error(`Process exiting with code: ${code}`);
});

// If you see a module not found error, run: npm install mineflayer
const mineflayer = require('mineflayer');
const Vec3 = require('vec3');

// Parse command line arguments
const args = process.argv.slice(2);
const options = {};
for (let i = 0; i < args.length; i++) {
  if (args[i].startsWith('--')) {
    const key = args[i].slice(2);
    if (i + 1 < args.length && !args[i + 1].startsWith('--')) {
      options[key] = args[i + 1];
      i++;
    } else {
      options[key] = 'true';
    }
  }
}

console.log('Starting Minecraft MCP server...');
console.error('[MCP INFO] MCP Server starting up, ready to accept connections from Claude...');

// Get connection details from command line or use defaults
const host = process.env.HOST || options.host || 'localhost';
const port = parseInt(options.port || '56756', 10);
const username = options.username || 'Pixelator';
const version = options.version || '1.20.2';

console.error(`[MCP INFO] Attempting to connect to Minecraft server at ${host}:${port} as ${username} (version ${version})`);

// Critical for MCP protocol: We need to keep the process alive
// and ensure stdin/stdout stay open
process.stdin.resume();
process.stdin.setEncoding('utf8');
let stdinTimeout = null;
setupStdinHandler();

// Prevent process exit
const KEEP_ALIVE_INTERVAL = 5000; // 5 seconds
const neverEndingInterval = setInterval(() => {
  console.error('[MCP DEBUG] Process keep-alive ping');
  // Send a keep-alive notification to Claude to maintain connection
  sendMcpNotification('server/keepalive', { timestamp: Date.now() });
}, KEEP_ALIVE_INTERVAL);

// Make sure this interval is not preventing the process from exiting
// if all other event handlers have completed
neverEndingInterval.unref();

// Initialize Mineflayer bot with retries
let bot = null;
let connectionAttempts = 0;
const maxConnectionAttempts = 3;

function createBot() {
  if (connectionAttempts >= maxConnectionAttempts) {
    console.error(`[MCP CRITICAL] Failed to connect after ${maxConnectionAttempts} attempts. Giving up.`);
    // Note: Not exiting process as MCP might need to stay connected
    return;
  }
  
  connectionAttempts++;
  console.error(`[MCP INFO] Connection attempt ${connectionAttempts}/${maxConnectionAttempts}`);
  console.error(`[MCP DEBUG] Attempting to connect to ${host}:${port} with username ${username} and version ${version}`);
  
  try {
    bot = mineflayer.createBot({
      host,
      port,
      username,
      version,
      keepAlive: true,
      checkTimeoutInterval: 60 * 1000, // Check connection every minute
      // Add detailed logs for connection issues
      logErrors: true,
      hideErrors: false,
      // Try to avoid 'Server is still logging in' issue
      closeTimeout: 240 * 1000, // Wait 4 minutes before timing out connecting
    });
    
    console.error('[MCP DEBUG] Bot creation successful, setting up event handlers');
    // Set up initial event handlers
    setupBotEvents();
  } catch (err) {
    console.error(`[MCP CRITICAL] Error creating bot:`, err);
    setTimeout(createBot, 5000); // Try again in 5 seconds
  }
}

function setupBotEvents() {
  if (!bot) return;
  
  bot.on('login', () => {
    console.log('Bot has logged in to the Minecraft server.');
    connectionAttempts = 0; // Reset on successful login
  });
  
  bot.on('error', (err) => {
    console.error('Bot encountered an error:', err);
    // If the bot isn't spawned yet and we get an error, try to reconnect
    if (!bot.player) {
      console.error('[MCP ERROR] Connection error before spawn, will retry...');
      setTimeout(createBot, 5000);
    }
  });
  
  bot.on('end', (reason) => {
    console.log(`Bot has disconnected from the server. Reason: ${reason}`);
    // Try to reconnect on unexpected disconnection
    if (reason !== 'disconnect.quitting') {
      console.error('[MCP INFO] Unexpected disconnection, will try to reconnect...');
      setTimeout(createBot, 5000);
    }
  });
  
  bot.once('spawn', () => {
    console.log('Bot has spawned. Ready to receive MCP commands.');
  });
}

// Optionally load pathfinder if available
let pathfinderLoaded = false;
try {
  const { pathfinder, Movements, goals } = require('mineflayer-pathfinder');
  if (bot) {
    bot.loadPlugin(pathfinder);
    pathfinderLoaded = true;
  }
} catch (e) {
  console.log('mineflayer-pathfinder not installed, will use teleport for movement.');
}

// --- MCP server interface ---

// Functions must be defined before being used in the spawn handler
function sendMcpResponse(id, result) {
  try {
    // For initialize responses, strictly follow JSON-RPC format
    if (result && result.protocolVersion !== undefined && result.capabilities !== undefined) {
      const responseObj = {
        jsonrpc: '2.0',
        id,
        result: {
          protocolVersion: result.protocolVersion,
          capabilities: { ...result.capabilities },
          clientInfo: result.clientInfo
        }
      };
      const response = JSON.stringify(responseObj) + '\n';
      console.error('[MCP OUT] Sending response:', response.trim());
      process.stdout.write(response);
      if (typeof process.stdout.flush === 'function') {
        process.stdout.flush();
      }
      return;
    }
    // Default response
    const response = JSON.stringify({
      jsonrpc: '2.0',
      id,
      result
    }) + '\n';
    console.error('[MCP OUT] Sending response:', response.trim());
    process.stdout.write(response);
    if (typeof process.stdout.flush === 'function') {
      process.stdout.flush();
    }
  } catch (err) {
    console.error('[MCP ERROR] Failed to send response:', err);
  }
}

function sendMcpError(id, message, code = -32000) {
  try {
    const errorResponse = JSON.stringify({
      jsonrpc: '2.0',
      id: id !== undefined ? id : null, // Always include id (using null if undefined)
      error: { code, message }
    }) + '\n';
    console.error('[MCP OUT] Sending error:', errorResponse.trim());
    process.stdout.write(errorResponse);
  } catch (err) {
    console.error('[MCP ERROR] Failed to send error response:', err);
  }
}

function sendMcpNotification(method, params = {}) {
  const notification = JSON.stringify({
    jsonrpc: '2.0',
    method,
    params
  }) + '\n';
  console.error('[MCP OUT] Sending notification:', notification.trim());
  process.stdout.write(notification);
  if (typeof process.stdout.flush === 'function') {
    process.stdout.flush();
  }
}

/**
 * Expected 'build-pixel-art' command structure:
 * {
 *   type: 'build-pixel-art',
 *   pixelArt: string[][], // 2D array of block names (e.g. 'minecraft:wool')
 *   width: number,        // width in blocks
 *   height: number        // height in blocks
 *   id: any               // JSON-RPC id
 * }
 */
async function handleMcpCommand(command) {
  try {
    console.error('[MCP DEBUG] handleMcpCommand called with:', JSON.stringify(command));
    console.error(`[MCP DEBUG] Handling command: ${command.method || command.type}`);
    const id = command.id;

    // Handle notifications (methods that start with "notifications/")
    if (command.method && command.method.startsWith('notifications/')) {
      console.error(`[MCP DEBUG] Received notification: ${command.method}`);
      // Notifications don't require responses
      return;
    }

    // MCP Initialize Command
    if (command.method === 'initialize') {
      console.error('[MCP DEBUG] Initialize command received with protocol version:', command.params?.protocolVersion);
      console.error('[MCP DEBUG] Processing initialize command with id:', id);
      console.error('[MCP DEBUG] Received clientInfo:', JSON.stringify(command.params?.clientInfo));
      console.error('[MCP DEBUG] About to send initialize response');
      sendMcpResponse(id, { 
        protocolVersion: command.params?.protocolVersion || "2024-11-05", 
        capabilities: {
          supportsPixelArt: true  
        }, 
        clientInfo: command.params?.clientInfo
      });
      console.error('[MCP DEBUG] Sent initialize response');
      // Send ready and manifest notifications after handshake
      sendMcpNotification('server/ready', { message: 'Minecraft MCP server is ready.' });
      sendMcpNotification('server/manifest', {
        id: "minecraft",
        name: "Minecraft MCP Server",
        description: "Controls a Minecraft bot to build pixel art in the world",
        version: "1.0.0",
        commands: [
          {
            id: "get-position",
            name: "get-position",
            description: "Get the current position of the bot"
          },
          {
            id: "build-pixel-art",
            name: "build-pixel-art",
            description: "Build pixel art in the Minecraft world"
          }
        ]
      });
      return;
    }

    // MCP GetManifest Command
    if (command.method === 'getManifest') {
      console.error('[MCP DEBUG] GetManifest command received');
      sendMcpResponse(id, {
        name: "Minecraft MCP Server",
        description: "Controls a Minecraft bot to build pixel art in the world",
        version: "1.0.0"
      });
      return;
    }

    // MCP GetCommands Command
    if (command.method === 'getCommands') {
      console.error('[MCP DEBUG] GetCommands command received');
      sendMcpResponse(id, {
        commands: [
          {
            name: "build-pixel-art",
            description: "Build pixel art in the Minecraft world",
            params: {
              type: "object",
              properties: {
                pixelArt: {
                  type: "array",
                  description: "2D array of Minecraft block names"
                },
                width: {
                  type: "integer",
                  description: "Width of the pixel art in blocks"
                },
                height: {
                  type: "integer",
                  description: "Height of the pixel art in blocks"
                }
              },
              required: ["pixelArt", "width", "height"]
            }
          },
          {
            name: "get-position",
            description: "Get the current position of the bot",
            params: {
              type: "object",
              properties: {},
              required: []
            }
          }
        ]
      });
      return;
    }

    // Build Pixel Art Command
    if (command.method === 'build-pixel-art') {
      console.error('[MCP DEBUG] Build pixel art command received');
      const params = command.params || {};
      
      if (!params.pixelArt || !Array.isArray(params.pixelArt) || 
          typeof params.width !== 'number' || 
          typeof params.height !== 'number') {
        console.error('[MCP ERROR] Invalid build command structure:', JSON.stringify(params));
        sendMcpError(id, 'Invalid build-pixel-art command parameters');
        return;
      }
      
      sendMcpResponse(id, { status: 'searching', message: 'Searching for a clear area to build pixel art...' });
      
      try {
        const area = await findClearArea(params.width, params.height);
        if (!area) {
          sendMcpError(id, 'No clear area found for pixel art of size ' + params.width + 'x' + params.height);
          return;
        }
        
        sendMcpResponse(id, { 
          status: 'ready', 
          message: `Found clear area at (${area.x}, ${area.y}, ${area.z}). Moving to build location...` 
        });
        
        await moveToArea(area.x, area.y, area.z);
        
        sendMcpResponse(id, { 
          status: 'building', 
          message: 'Starting pixel art build...' 
        });
        
        await buildPixelArt(area.x, area.y, area.z, params.pixelArt, params.width, params.height);
        
        sendMcpResponse(id, { 
          status: 'complete', 
          message: 'Pixel art build complete!' 
        });
      } catch (err) {
        console.error('[MCP ERROR] Error during build process:', err);
        sendMcpError(id, 'Error during build process: ' + (err instanceof Error ? err.message : String(err)));
      }
      return;
    }

    // Get Position Command
    if (command.method === 'get-position') {
      console.error('[MCP DEBUG] Get position command received');
      if (!bot || !bot.entity || !bot.entity.position) {
        sendMcpError(id, 'Bot is not connected or spawned yet');
        return;
      }
      
      const position = bot.entity.position;
      sendMcpResponse(id, {
        x: Math.floor(position.x),
        y: Math.floor(position.y),
        z: Math.floor(position.z),
        block: bot.blockAt(position)?.name || 'unknown'
      });
      return;
    }

    // Unknown method/type
    console.error('[MCP WARNING] Unknown method or command type:', command.method || command.type);
    sendMcpError(id, 'Unknown method', -32601);
  } catch (err) {
    console.error('[MCP CRITICAL] Unhandled error in command handler:', err);
    try {
      sendMcpError(command?.id ?? null, 'Internal server error: ' + (err instanceof Error ? err.message : String(err)), -32603);
    } catch (sendErr) {
      console.error('[MCP CRITICAL] Failed to send error response:', sendErr);
    }
  }
}

// --- Bot Event Handlers ---

let keepAliveInterval = null;

function setupStdinHandler() {
  let buffer = '';

  // Set a timeout to detect if no input is received
  stdinTimeout = setTimeout(() => {
    console.error('[MCP WARNING] No stdin input received after 5 minutes. This may indicate a communication issue with Claude.');
  }, 300000);

  process.stdin.on('data', (chunk) => {
    // Clear timeout on first data received
    if (stdinTimeout) {
      clearTimeout(stdinTimeout);
      stdinTimeout = null;
    }
    
    console.error(`[MCP DEBUG] Received stdin chunk: ${chunk.length} bytes, content: ${chunk.toString().trim()}`);
    buffer += chunk;
    let boundary;
    while ((boundary = buffer.indexOf('\n')) >= 0) {
      const line = buffer.slice(0, boundary);
      buffer = buffer.slice(boundary + 1);
      if (line.trim() === '') continue;
      try {
        const command = JSON.parse(line);
        console.error('[MCP DEBUG] Parsed command:', JSON.stringify(command));
        // Use Promise.resolve() to handle async handleMcpCommand without awaiting it here
        Promise.resolve(handleMcpCommand(command)).catch(err => {
          // General error handler if handleMcpCommand itself throws synchronously
          // or its promise rejects unexpectedly (though it should handle its own errors)
          console.error("[MCP ERROR] Error handling MCP command:", err);
          sendMcpError(command.id ?? null, 'Internal server error processing command');
        });
      } catch (err) {
        // JSON parsing error or other sync error before command object exists
        console.error('[MCP ERROR] Failed to parse JSON:', err, 'Line:', line);
        sendMcpError(null, 'Invalid JSON received: ' + (err instanceof Error ? err.message : String(err)));
      }
    }
  });

  process.stdin.on('error', (err) => {
    console.error('[MCP ERROR] Error on stdin:', err);
  });

  process.stdout.on('error', (err) => {
    console.error('[MCP ERROR] Error on stdout:', err);
  });

  process.stdin.on('end', () => {
    console.error('[MCP WARNING] MCP client disconnected (stdin closed). Bot will remain active.');
    // The bot's connection should keep the process alive now.
  });
}

/**
 * Finds a clear area of the given width and height on the ground (y = bot.entity.position.y - 1).
 * Returns {x, y, z} of the bottom-left corner facing north, or null if not found.
 */
async function findClearArea(width, height) {
  if (!bot) return null;
  
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
async function isAreaClear(x, y, z, width, height) {
  if (!bot) return false;
  
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
async function moveToArea(x, y, z) {
  if (!bot) throw new Error("Bot not initialized");
  
  if (pathfinderLoaded && bot.pathfinder) {
    const { Movements, goals } = require('mineflayer-pathfinder');
    const mcData = require('minecraft-data')(bot.version);
    const defaultMove = new Movements(bot, mcData);
    bot.pathfinder.setMovements(defaultMove);
    return new Promise((resolve, reject) => {
      bot.pathfinder.setGoal(new goals.GoalBlock(x, y, z), false);
      const onArrive = () => {
        bot.removeListener('goal_reached', onArrive);
        resolve();
      };
      bot.on('goal_reached', onArrive);
      setTimeout(() => {
        bot.removeListener('goal_reached', onArrive);
        reject(new Error('Timeout moving to build area'));
      }, 15000);
    });
  } else {
    // Teleport (creative mode only)
    bot.entity.position.set(x + 0.5, y, z + 0.5);
    bot.emit('forcedMove');
    await new Promise((res) => setTimeout(res, 50)); // Small delay
  }
}

/**
 * Builds the pixel art at the given location, facing north (z decreases as you go up rows).
 */
async function buildPixelArt(x, y, z, pixelArt, width, height) {
  if (!bot) throw new Error("Bot not initialized");
  
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
async function placeBlockAt(x, y, z, blockName) {
  if (!bot) throw new Error("Bot not initialized");
  
  const targetPos = new Vec3(x, y, z);
  const item = bot.registry.itemsByName[blockName.replace('minecraft:', '')]; // Need the item object
  if (!item) {
    console.error(`Cannot find item for block: ${blockName}`);
    // Optionally throw an error or skip placement
    return;
  }

  const existing = bot.blockAt(targetPos);
  // Remove any block at the target location (requires creative/op)
  if (existing && existing.name !== 'air') {
     try {
       await bot.dig(existing, true); // 'true' forces digging even if tool isn't optimal
     } catch (digErr) {
       console.error(`[MCP ERROR] Error placing block: ${blockName} at (${x}, ${y}, ${z}):`, digErr);
     }
  }

  try {
    await bot.creative.give(item, 1, targetPos);
  } catch (giveErr) {
    console.error(`[MCP ERROR] Error giving block: ${blockName} at (${x}, ${y}, ${z}):`, giveErr);
  }

  await new Promise((res) => setTimeout(res, 50)); // Small delay
}

process.on('uncaughtException', (err) => {
  console.error('[MCP CRITICAL] Uncaught Exception:', err);
  // Prevent process exit by not calling process.exit()
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('[MCP CRITICAL] Unhandled Rejection:', reason);
  // Prevent process exit by not calling process.exit()
});

// Catch SIGINT and SIGTERM to gracefully exit
process.on('SIGINT', () => {
  console.error('[MCP INFO] Received SIGINT, shutting down...');
  if (bot) bot.quit();
  // Do NOT exit process - it will exit naturally when stdin/stdout close
});

process.on('SIGTERM', () => {
  console.error('[MCP INFO] Received SIGTERM, shutting down...');
  if (bot) bot.quit();
  // Do NOT exit process - it will exit naturally when stdin/stdout close
});

// Add handler for beforeExit to log when process is about to exit
process.on('beforeExit', (code) => {
  console.error(`[MCP CRITICAL] Process is about to exit with code: ${code}`);
});

// Start the bot connection
createBot();

// --- HTTP server for Render/Cloud hosting ---
const express = require('express');
const bodyParser = require('body-parser');

const app = express();
const httpPort = process.env.PORT || 3000;
app.use(bodyParser.json());

// POST /mcp endpoint for JSON-RPC-like requests
app.post('/mcp', async (req, res) => {
  const command = req.body;
  if (!command || typeof command !== 'object') {
    return res.status(400).json({ error: 'Invalid request body' });
  }
  try {
    // Reuse the handleMcpCommand logic, but adapt to HTTP
    let resultSent = false;
    // Patch sendMcpResponse/sendMcpError to send HTTP response
    const originalSendMcpResponse = sendMcpResponse;
    const originalSendMcpError = sendMcpError;
    sendMcpResponse = (id, result) => {
      if (!resultSent) {
        resultSent = true;
        res.json({ jsonrpc: '2.0', id, result });
      }
    };
    sendMcpError = (id, message, code = -32000) => {
      if (!resultSent) {
        resultSent = true;
        res.status(400).json({ jsonrpc: '2.0', id, error: { code, message } });
      }
    };
    await handleMcpCommand(command);
    // Restore originals
    sendMcpResponse = originalSendMcpResponse;
    sendMcpError = originalSendMcpError;
    if (!resultSent) {
      res.status(204).end();
    }
  } catch (err) {
    res.status(500).json({ error: 'Internal server error', details: err.message });
  }
});

app.get('/', (req, res) => {
  res.send('Minecraft MCP HTTP server is running.');
});

app.listen(httpPort, () => {
  console.error(`[MCP HTTP] Listening on port ${httpPort}`);
});