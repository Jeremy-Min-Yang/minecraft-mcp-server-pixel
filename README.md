# Minecraft MCP Server (Replica: minecraftbuildmcp)

> ⚠️ **IMPORTANT COMPATIBILITY WARNING**: As of March 25, 2025, Minecraft 1.21.5 was just released. This bot is currently **NOT compatible** with Minecraft 1.21.5. Please use Minecraft 1.21.4 until we release an update with 1.21.5 support.

A Minecraft bot powered by large language models and [Mineflayer API](https://github.com/PrismarineJS/mineflayer). This bot uses the [Model Context Protocol](https://github.com/modelcontextprotocol) (MCP) to enable Claude and other supported models to control a Minecraft character.

## Prerequisites

- Node.js
- A running Minecraft game (tested with Minecraft 1.21.4 Java Edition)
- Claude Desktop

## Getting started

This bot is designed to be used with Claude Desktop through the Model Context Protocol (MCP).

### Run Minecraft

Create a singleplayer world and open it to LAN (`ESC -> Open to LAN`). Bot will try to connect using port `25565` and hostname `localhost`. These parameters could be configured in `claude_desktop_config.json` on a next step.

### MCP Configuration

Make sure that [Claude Desktop](https://claude.ai/download) is installed. Open `File -> Settings -> Developer -> Edit Config`. It should open installation directory. Find file with a name `claude_desktop_config.json` and insert the following code:

```json
{
  "mcpServers": {
    "minecraft": {
      "command": "npx",
      "args": [
        "-y",
        "github:yuniko-software/minecraft-mcp-server",
        "--host",
        "localhost",
        "--port",
        "25565",
        "--username",
        "ClaudeBot"
      ]
    }
  }
}
```

Double-check that right `--port` and `--host` parameters were used. Make sure to completely reboot the Claude Desktop application (should be closed in OS tray).

## Running

Make sure Minecraft game is running and the world is opened to LAN. Then start Claude Desktop application and the bot should join the game.

It could take some time for Claude Desktop to boot the MCP server. The marker that the server has booted successfully is a hammer icon that appears next to the chat.

You can give bot any commands through any active Claude Desktop chat. You can also upload images of buildings and ask bot to build them 😁

Don't forget to mention that bot should do something in Minecraft in your prompt. Because saying this is a trigger to run MCP server. It will ask for your permissions.

Using Claude 3.7 Sonnet could give you some interesting results. The bot-agent would be really smart 🫡

## Available Commands

Once connected to a Minecraft server, Claude can use these commands:

### Movement
- `get-position` - Get the current position of the bot
- `move-to-position` - Move to specific coordinates
- `look-at` - Make the bot look at specific coordinates
- `jump` - Make the bot jump
- `move-in-direction` - Move in a specific direction for a duration

### Inventory
- `list-inventory` - List all items in the bot's inventory
- `find-item` - Find a specific item in inventory
- `equip-item` - Equip a specific item

### Block Interaction
- `place-block` - Place a block at specified coordinates
- `dig-block` - Dig a block at specified coordinates
- `get-block-info` - Get information about a block
- `find-block` - Find the nearest block of a specific type

### Entity Interaction
- `find-entity` - Find the nearest entity of a specific type

### Communication
- `send-chat` - Send a chat message in-game

## Contributing

This application is a replica of yukinomcp. All refactoring commits, functional and test contributions, issues and discussion are greatly appreciated!

Feel free to submit pull requests or open issues for improvements. 