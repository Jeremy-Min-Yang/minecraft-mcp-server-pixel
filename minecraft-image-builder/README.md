# Minecraft Image Builder

A Node.js application that converts uploaded images into Minecraft pixel art using a Mineflayer bot.

## Features

- Express web server with image upload interface
- Image pixelization using Sharp library
- Claude API integration for optimal block color selection
- Mineflayer bot that places blocks in the Minecraft world
- Real-time progress tracking

## Prerequisites

- Node.js (v14+ recommended)
- A running Minecraft server (Java Edition)
- (Optional) Claude API key for intelligent block selection

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

3. Set up environment variables (optional):

Create a `.env` file in the project root directory with the following variables:

```
PORT=3000
MC_HOST=localhost
MC_PORT=25565
MC_USERNAME=PixelArtBot
MC_VERSION=1.19.2
CLAUDE_API_KEY=your_claude_api_key
```

## Usage

1. Start your Minecraft server

2. Run the application:

```bash
node src/server.js
```

3. Open a web browser and navigate to `http://localhost:3000`

4. Upload an image through the web interface

5. The image will be processed and built in Minecraft!

## Configuration

### Minecraft Bot Settings

You can configure the Minecraft bot by modifying the environment variables:

- `MC_HOST`: The Minecraft server host (default: localhost)
- `MC_PORT`: The Minecraft server port (default: 25565)
- `MC_USERNAME`: The bot's username (default: PixelArtBot)
- `MC_VERSION`: The Minecraft version (default: 1.19.2)

### Image Processing

You can modify the image processing parameters in `src/imageProcessor.js`:

- Image size (default: 50x50 pixels)
- Processing options

### Claude API

If you have a Claude API key, the application will use Claude to determine the best Minecraft blocks for each pixel. Otherwise, it will use a fallback algorithm.

## How It Works

1. The user uploads an image to the web server
2. The image is resized to 50x50 pixels using Sharp
3. The pixel RGB values are extracted
4. Claude API (or the fallback algorithm) determines the best Minecraft blocks
5. The Mineflayer bot connects to the Minecraft server
6. The bot places blocks to recreate the image in-game

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request. 