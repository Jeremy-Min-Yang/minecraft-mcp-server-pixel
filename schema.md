# MinecraftBuildMCP Schema Documentation

This document outlines the schema and API structure for the MinecraftBuildMCP Model Context Protocol (MCP) server.

## Overview

MinecraftBuildMCP implements a Model Context Protocol server that allows Claude (or other compatible LLMs) to control a Minecraft bot using the Mineflayer API. The server exposes a set of tools that Claude can use to interact with the Minecraft world.

## Tool Schema

### Movement Tools

#### `get-position`
Returns the bot's current position in the Minecraft world.

**Parameters:** None

**Returns:**
- Current X, Y, Z coordinates as integers

#### `move-to-position`
Moves the bot to a specific position. In creative mode, it teleports directly to the coordinates.

**Parameters:**
- `x` (number, required): X coordinate
- `y` (number, required): Y coordinate
- `z` (number, required): Z coordinate
- `range` (number, optional): How close to get to the target (default: 1)

**Returns:**
- Success or failure message

### Inventory Tools

#### `equip-item`
Equips a specific item to the bot's hand or other equipment slot.

**Parameters:**
- `itemName` (string, required): Name of the item to equip
- `destination` (string, optional): Where to equip the item (default: 'hand')

**Returns:**
- Success or failure message

#### `get-bot-status`
Returns the current game mode and OP status of the bot.

**Parameters:** None

**Returns:**
- Game mode (0=survival, 1=creative, 2=adventure, 3=spectator)
- OP status (yes/no)

#### `list-block-names`
Lists all valid block names for the current Minecraft version.

**Parameters:** None

**Returns:**
- A list of the first 100 block names and total count

### Block Interaction Tools

#### `place-block`
Places a block at the specified position.

**Parameters:**
- `x` (number, required): X coordinate
- `y` (number, required): Y coordinate
- `z` (number, required): Z coordinate
- `faceDirection` (enum, optional): Direction to place against (default: 'down')
  - Valid values: 'up', 'down', 'north', 'south', 'east', 'west'

**Returns:**
- Success or failure message

### Entity Interaction Tools

#### `find-entity`
Finds the nearest entity of a specific type.

**Parameters:**
- `type` (string, optional): Type of entity to find (empty for any entity)
- `maxDistance` (number, optional): Maximum search distance (default: 16)

**Returns:**
- Entity information and position if found

### Chat Tools

#### `send-chat`
Sends a chat message in-game.

**Parameters:**
- `message` (string, required): Message to send in chat

**Returns:**
- Confirmation of message sent

### Pixel Art Tools

#### `build-pixel-art`
Builds a pixel art image from a 2D array of block types.

**Parameters:**
- `pixels` (array of string arrays, required): 2D array of block types
- `origin` (object, required): Origin position object with x, y, z coordinates
- `direction` (enum, optional): Direction to build in (default: 'north')
  - Valid values: 'north', 'south', 'east', 'west'

**Returns:**
- Success or failure message

## Data Types

### Position
Represents a 3D coordinate in the Minecraft world.
```typescript
{
  x: number,
  y: number,
  z: number
}
```

### Direction
Represents a cardinal direction.
```typescript
type Direction = 'forward' | 'back' | 'left' | 'right';
```

### FaceDirection
Represents a block face direction.
```typescript
type FaceDirection = 'up' | 'down' | 'north' | 'south' | 'east' | 'west';
```

## Error Handling

All tools return a standardized response format:
```typescript
{
  content: [{ type: "text", text: string }],
  isError?: boolean
}
```

- For successful operations, `isError` is undefined or false
- For failed operations, `isError` is true and the text contains the error message
