# MinecraftBuildMCP

MinecraftBuildMCP is a Model Context Protocol (MCP) server that lets Claude (or other LLMs) control a Minecraft bot using the Mineflayer API. This project allows you to automate and interact with Minecraft through Claude Desktop.

---

## How to Run

1. **Clone the repository and install dependencies:**
   ```sh
   git clone https://github.com/Jeremy-Min-Yang/minecraft-mcp-server-pixel.git
   cd minecraft-mcp-server-pixel
   npm install
   ```

2. **Build the project:**
   ```sh
   npm run build
   ```

3. **Start Minecraft and open a world to LAN.**

4. **Run the bot locally:**
   ```sh
   node dist/bot.js --host localhost --port 25565 --username Bob_the_Builder
   ```

   Or, run directly from GitHub using npx:
   ```sh
   npx -y github:Jeremy-Min-Yang/minecraft-mcp-server-pixel --host localhost --port 25565 --username Bob_the_Builder
   ```

---

## Claude Desktop Config Example

Add this to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "minecraft": {
      "command": "npx",
      "args": [
        "-y",
        "github:Jeremy-Min-Yang/minecraft-mcp-server-pixel",
        "--host",
        "localhost",
        "--port",
        "25565",
        "--username",
        "Bob_the_Builder"
      ]
    }
  }
}
```

---

## Available Commands

Once connected, Claude can use these commands:

### Movement
- `get-position` — Get the bot's current position
- `move-to-position` — Move to specific coordinates

### Inventory
- `equip-item` — Equip an item

### Block Interaction
- `place-block` — Place a block at coordinates

### Pixel Art
- `build-pixel-art` — Build a pixel art image from a 2D array of block types

---

You can now control your Minecraft bot with Claude using MinecraftBuildMCP. 