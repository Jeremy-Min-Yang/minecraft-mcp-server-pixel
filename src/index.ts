// If you see a module not found error, run: npm install mineflayer
import mineflayer from 'mineflayer';

console.log('Starting Minecraft MCP server...');

// Initialize Mineflayer bot
const bot = mineflayer.createBot({
  host: 'localhost', // Minecraft server address
  port: 25565,       // Default LAN port
  username: 'ClaudeBot', // Bot username
  version: '1.20.2', // Minecraft version
});

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

function handleMcpCommand(command: any) {
  if (command.type === 'build-pixel-art') {
    // TODO: Implement build-pixel-art logic
    sendMcpResponse({ status: 'received', type: 'build-pixel-art' });
  } else {
    sendMcpResponse({ error: 'Unknown command type', type: command.type });
  }
}

// TODO: Set up MCP server interface to receive commands from Claude 