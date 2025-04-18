# Minecraft Image Builder CLI

A command-line tool that uses Claude AI to convert images into Minecraft pixel art and then builds them in-game using a Mineflayer bot.

## Features

- Interactive CLI interface for image processing
- Direct image processing with Claude AI
- Claude determines the best Minecraft blocks to match image colors
- Mineflayer bot that places blocks in the Minecraft world
- Support for both vertical (wall) and horizontal (floor) builds
- Outputs visualization and block map files

## Prerequisites

- Node.js (v14+ recommended)
- A running Minecraft server (Java Edition)
- Claude API key (required)

## Installation

1. Clone the repository or download the source code:

```bash
git clone https://github.com/yourusername/minecraft-image-builder.git
cd minecraft-image-builder
```

2. Install the dependencies:

```bash
npm install
```

3. Set up environment variables:

Create a `.env` file in the project root directory with the following variables:

```
MC_HOST=localhost
MC_PORT=25565
MC_USERNAME=PixelArtBot
MC_VERSION=1.19.2
CLAUDE_API_KEY=your_claude_api_key_here
```

The Claude API key is required. You can obtain a key by signing up at [anthropic.com](https://www.anthropic.com/).

4. (Optional) Install globally to use as a command-line tool:

```bash
npm install -g .
```

## Usage

### Running as a local application

Start your Minecraft server, then run:

```bash
npm start
```

### Running as a global CLI tool (if installed globally)

```bash
minecraft-image-builder
```

### Interactive Prompts

The CLI will guide you through the following steps:

1. Enter the path to an image file
2. Specify grid size (how many blocks wide/tall)
3. Set build position (x,y,z coordinates in Minecraft)
4. Choose build orientation (vertical wall or horizontal floor)
5. Confirm to start building in Minecraft

### Example Session

```
=== Minecraft Image Builder CLI ===
Enter the path to an image file to build it in Minecraft.

Image path: ./myimage.jpg
Grid size (10-100, default: 50): 30
Build position (x,y,z, default: 0,64,0): 10,70,10
Build orientation (vertical/horizontal, default: vertical): vertical

Processing image: ./myimage.jpg
Grid size: 30x30
Build position: 10,70,10
Orientation: vertical

Sending to Claude for analysis...
Blocks data saved to: ./outputs/myimage-blocks.json
Visualization saved to: ./outputs/myimage-visualization.txt

Start building in Minecraft? (y/n): y

Starting build process...
Build completed!

Process another image? (y/n): n
Goodbye!
```

## How It Works

1. You provide an image file path through the CLI
2. The image is sent directly to Claude AI with a prompt to:
   - Pixelize the image to the specified grid size
   - Determine the best matching Minecraft block for each pixel
   - Return a 2D array of block names
3. The Mineflayer bot connects to the Minecraft server
4. The bot places blocks in the specified location to recreate the image in-game

The system has a fallback mechanism using Sharp for image processing if Claude is unavailable.

## Configuration

You can configure the Minecraft bot by modifying the environment variables:

- `MC_HOST`: The Minecraft server host (default: localhost)
- `MC_PORT`: The Minecraft server port (default: 25565)
- `MC_USERNAME`: The bot's username (default: PixelArtBot)
- `MC_VERSION`: The Minecraft version (default: 1.19.2)

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request. 