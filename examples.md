# MinecraftBuildMCP Examples

This document provides examples of how to use MinecraftBuildMCP with Claude to accomplish common tasks in Minecraft.

## Basic Interaction

### Setting Up and Connecting

In Claude Desktop, enable the MinecraftBuildMCP tool and start with these basic interactions:

```
Can you help me control a Minecraft bot? I've launched Minecraft and opened a world to LAN on port 25565.
```

Claude will connect to your Minecraft server and confirm when it's ready.

### Checking Bot Status

```
What's the current status of the bot? Can you tell me where you are in the game?
```

Claude will use the `get-bot-status` and `get-position` tools to report back.

## Building in Minecraft

### Simple Building

```
Can you place a line of oak logs from your current position going north for 5 blocks?
```

Claude will use `get-position`, then use `place-block` multiple times to create the line.

### Multiple Block Types

```
Can you build a small 3x3 house with oak planks for the walls and cobblestone for the floor? Put a door at the front.
```

Claude will coordinate placement of different block types to form a simple structure.

## Pixel Art Creation

### Simple Pixel Art

```
Can you create a 5x5 smiley face using yellow wool for the face, black wool for the eyes and mouth?
```

Claude will construct a 2D array for the `build-pixel-art` tool:

```javascript
{
  "pixels": [
    ["wool_yellow", "wool_yellow", "wool_yellow", "wool_yellow", "wool_yellow"],
    ["wool_yellow", "wool_black", "wool_yellow", "wool_black", "wool_yellow"],
    ["wool_yellow", "wool_yellow", "wool_yellow", "wool_yellow", "wool_yellow"],
    ["wool_yellow", "wool_black", "wool_black", "wool_black", "wool_yellow"],
    ["wool_yellow", "wool_yellow", "wool_yellow", "wool_yellow", "wool_yellow"]
  ],
  "origin": { "x": x, "y": y, "z": z }, // Current position
  "direction": "north"
}
```

### Complex Pixel Art

```
Can you create an 8x8 pixel art of a Minecraft creeper face?
```

Claude will design the creeper face and use the `build-pixel-art` tool to construct it.

## Navigation and Exploration

### Moving to Coordinates

```
Can you move to coordinates x=100, y=64, z=-200?
```

Claude will use `move-to-position` to navigate to those coordinates.

### Finding Entities

```
Are there any sheep nearby? If so, can you go to them?
```

Claude will use `find-entity` to locate sheep and then `move-to-position` to approach them.

## Troubleshooting

### Common Issues and Solutions

1. **Bot can't connect to the server**
   - Make sure your Minecraft world is open to LAN
   - Verify the port number matches what Minecraft displays
   - Check that you're running Minecraft version 1.21.4

2. **Bot can't place blocks**
   - Ensure the bot has OP privileges in the server
   - For creative mode features, make sure the bot is in creative mode
   - Use `get-bot-status` to verify the current game mode

3. **Bot moves but doesn't place blocks correctly**
   - The bot may need to be closer to the target location
   - There might be obstacles in the way
   - Some blocks require specific supporting blocks to be placed first

## Advanced Uses

### Creating Multiple Structures

```
Can you build three different colored wool towers in a triangle formation, each 5 blocks high?
```

Claude will plan multiple structures and execute them sequentially.

### Dynamic Construction Based on Environment

```
Can you analyze the terrain around you and build a bridge across any water or gaps you find?
```

Claude will use positional data to understand the environment and adapt building accordingly.

---

These examples should help you get started with using Claude to control your Minecraft bot. The possibilities are extensive - from simple building to complex pixel art and environment interactions!
