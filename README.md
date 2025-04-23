# MinecraftBuildMCP - Pixel Art Builder

MinecraftBuildMCP is a Model Context Protocol (MCP) server that lets Claude (or other LLMs) control a Minecraft bot using the Mineflayer API. This project specializes in constructing pixel art in Minecraft, allowing for creative expression through block placement.

![Pixel Art Example](https://i.imgur.com/JrhYDOY.png)

## Features

- **Pixel Art Building**: Easily create pixel art designs in Minecraft with a simple 2D grid array
- **Multiple Orientations**: Build your pixel art facing north, south, east, or west
- **Block Management**: Automatic block selection and placement in creative mode
- **Path Finding**: Intelligent movement to build complex structures
- **Basic Controls**: Simple movement, block placement, and inventory management

## Installation

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

## Usage

1. **Start Minecraft and open a world to LAN:**
   - Run Minecraft 1.21.4 or compatible version
   - Create a new world or open an existing one
   - Enable cheats and set game mode to Creative
   - Open to LAN with cheats enabled

2. **Run the bot locally:**
   ```sh
   node dist/bot.js --host localhost --port 25565 --username PixelArtist
   ```

   Or, run directly from GitHub using npx:
   ```sh
   npx -y github:Jeremy-Min-Yang/minecraft-mcp-server-pixel --host localhost --port 25565 --username PixelArtist
   ```

## Claude Desktop Integration

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
        "PixelArtist"
      ]
    }
  }
}
```

## Available Commands

### Basic Controls
- `get-position` — Get the bot's current position
- `move-to-position` — Move to specific coordinates
- `get-bot-status` — Show the bot's game mode and OP status

### Inventory
- `equip-item` — Equip a specific item
- `list-block-names` — List all valid block names for the current Minecraft version

### Block Interaction
- `place-block` — Place a block at coordinates

### Entity Interaction
- `find-entity` — Find the nearest entity of a specific type
- `send-chat` — Send a chat message in-game

### Pixel Art
- `build-pixel-art` — Build a pixel art image from a 2D array of block types

## Pixel Art Tool Usage

The `build-pixel-art` tool creates pixel art structures in Minecraft from a 2D array of block types. Each element in the array represents a single block to be placed.

### Parameters:

- `pixels`: 2D array of block type strings (e.g., "stone", "oak_planks")
- `origin`: The starting position for the pixel art (bottom-left corner)
- `direction`: Which way the pixel art should face ("north", "south", "east", "west")

### Example:

```javascript
// Create a simple heart pixel art
{
  "pixels": [
    ["red_wool", "red_wool", "", "red_wool", "red_wool"],
    ["red_wool", "red_wool", "red_wool", "red_wool", "red_wool"],
    ["red_wool", "red_wool", "red_wool", "red_wool", "red_wool"],
    ["", "red_wool", "red_wool", "red_wool", ""],
    ["", "", "red_wool", "", ""]
  ],
  "origin": {"x": 100, "y": 65, "z": 100},
  "direction": "north"
}
```

### Tips for Creating Pixel Art:

1. **Plan your design**: Create a grid on paper or in a drawing program first
2. **Use appropriate blocks**: Different blocks provide different colors and textures
3. **Build on flat ground**: Start with a flat area for easier construction
4. **Creative mode recommended**: Ensures all blocks are available
5. **Empty strings**: Use empty strings (`""`) for transparent/empty spaces

## Predefined Pixel Art Templates

Below are some simple templates you can use with the `build-pixel-art` tool:

### Simple Smiley Face (8x8)
```javascript
{
  "pixels": [
    ["", "", "yellow_concrete", "yellow_concrete", "yellow_concrete", "yellow_concrete", "", ""],
    ["", "yellow_concrete", "yellow_concrete", "yellow_concrete", "yellow_concrete", "yellow_concrete", "yellow_concrete", ""],
    ["yellow_concrete", "yellow_concrete", "black_concrete", "yellow_concrete", "yellow_concrete", "black_concrete", "yellow_concrete", "yellow_concrete"],
    ["yellow_concrete", "yellow_concrete", "yellow_concrete", "yellow_concrete", "yellow_concrete", "yellow_concrete", "yellow_concrete", "yellow_concrete"],
    ["yellow_concrete", "yellow_concrete", "yellow_concrete", "yellow_concrete", "yellow_concrete", "yellow_concrete", "yellow_concrete", "yellow_concrete"],
    ["yellow_concrete", "black_concrete", "yellow_concrete", "yellow_concrete", "yellow_concrete", "yellow_concrete", "black_concrete", "yellow_concrete"],
    ["", "yellow_concrete", "black_concrete", "black_concrete", "black_concrete", "black_concrete", "yellow_concrete", ""],
    ["", "", "yellow_concrete", "yellow_concrete", "yellow_concrete", "yellow_concrete", "", ""]
  ],
  "origin": {"x": 100, "y": 65, "z": 100},
  "direction": "north"
}
```

### Minecraft Creeper Face (8x8)
```javascript
{
  "pixels": [
    ["green_concrete", "green_concrete", "green_concrete", "green_concrete", "green_concrete", "green_concrete", "green_concrete", "green_concrete"],
    ["green_concrete", "green_concrete", "green_concrete", "green_concrete", "green_concrete", "green_concrete", "green_concrete", "green_concrete"],
    ["green_concrete", "green_concrete", "black_concrete", "black_concrete", "black_concrete", "black_concrete", "green_concrete", "green_concrete"],
    ["green_concrete", "black_concrete", "black_concrete", "black_concrete", "black_concrete", "black_concrete", "black_concrete", "green_concrete"],
    ["green_concrete", "black_concrete", "black_concrete", "black_concrete", "black_concrete", "black_concrete", "black_concrete", "green_concrete"],
    ["green_concrete", "green_concrete", "black_concrete", "green_concrete", "green_concrete", "black_concrete", "green_concrete", "green_concrete"],
    ["green_concrete", "green_concrete", "green_concrete", "green_concrete", "green_concrete", "green_concrete", "green_concrete", "green_concrete"],
    ["green_concrete", "green_concrete", "green_concrete", "green_concrete", "green_concrete", "green_concrete", "green_concrete", "green_concrete"]
  ],
  "origin": {"x": 100, "y": 65, "z": 100},
  "direction": "north"
}
```

## Example Prompts for Claude

When working with Claude and the MinecraftBuildMCP tool, here are some effective prompts you can use:

1. **Build a simple pixel art:**
   ```
   Can you help me build a simple pixel art heart in Minecraft? I'm at coordinates (100, 65, 100).
   ```

2. **Create a custom design:**
   ```
   I'd like to create a pixel art of a tree. Can you design a 10x10 grid using different colored wool blocks and build it at my current position?
   ```

3. **Build from an image description:**
   ```
   I want to build an 8-bit style Mario character facing east at coordinates (150, 70, 150). Can you create the pixel art design and build it?
   ```

## Pixel Art Design Tips

1. **Color Mapping**: Map different colors to appropriate Minecraft blocks:
   - Red: red_wool, red_concrete, red_terracotta
   - Orange: orange_wool, orange_concrete, orange_terracotta
   - Yellow: yellow_wool, yellow_concrete, yellow_terracotta
   - Green: green_wool, green_concrete, green_terracotta
   - Blue: blue_wool, blue_concrete, blue_terracotta
   - Purple: purple_wool, purple_concrete, purple_terracotta
   - Pink: pink_wool, pink_concrete, pink_terracotta
   - White: white_wool, white_concrete, quartz_block
   - Gray: gray_wool, gray_concrete, gray_terracotta
   - Black: black_wool, black_concrete, coal_block
   - Brown: brown_wool, brown_concrete, brown_terracotta

2. **Scale**: Start with smaller pixel art (8x8 or 16x16) before attempting larger projects

3. **Viewing Distance**: Consider building pixel art vertically (on walls) for better visibility at a distance

## Troubleshooting

- **Bot can't connect**: Make sure your Minecraft world is open to LAN with the correct port
- **Missing blocks**: Ensure you're in Creative mode with OP privileges
- **Placement issues**: Try building on flat ground or preparing a flat wall surface
- **Path finding failures**: Ensure there's a clear path to the building area

## Contributing

Contributions to MinecraftBuildMCP are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.
