/**
 * Execute a Minecraft command with rate limiting
 * @param bot Mineflayer bot instance
 * @param command Command to execute (without leading slash)
 * @param delay Delay in ms between commands (to avoid chat rate limiting)
 */
export async function executeCommand(bot, command, delay = 50) {
    return new Promise((resolve, reject) => {
        try {
            // Remove leading slash if present
            const formattedCommand = command.startsWith('/') ? command.substring(1) : command;
            // Execute the command
            bot.chat(`/${formattedCommand}`);
            // Wait for the specified delay
            setTimeout(() => {
                resolve();
            }, delay);
        }
        catch (error) {
            reject(error);
        }
    });
}
/**
 * Execute a list of Minecraft commands with rate limiting
 * @param bot Mineflayer bot instance
 * @param commands Array of commands to execute
 * @param delay Delay in ms between commands
 * @param progressCallback Optional callback to report progress
 */
export async function executeCommands(bot, commands, delay = 50, progressCallback) {
    for (let i = 0; i < commands.length; i++) {
        await executeCommand(bot, commands[i], delay);
        // Report progress
        if (progressCallback && i % Math.max(1, Math.floor(commands.length / 10)) === 0) {
            progressCallback(i + 1, commands.length);
        }
    }
    // Final progress report
    if (progressCallback) {
        progressCallback(commands.length, commands.length);
    }
}
/**
 * Clear an area in the world
 * @param bot Mineflayer bot instance
 * @param x1 First X coordinate
 * @param y1 First Y coordinate
 * @param z1 First Z coordinate
 * @param x2 Second X coordinate
 * @param y2 Second Y coordinate
 * @param z2 Second Z coordinate
 */
export async function clearArea(bot, x1, y1, z1, x2, y2, z2) {
    await executeCommand(bot, `/fill ${x1} ${y1} ${z1} ${x2} ${y2} ${z2} air`);
}
/**
 * Split large fill commands into chunks to avoid command limit
 * @param x1 First X coordinate
 * @param y1 First Y coordinate
 * @param z1 First Z coordinate
 * @param x2 Second X coordinate
 * @param y2 Second Y coordinate
 * @param z2 Second Z coordinate
 * @param material Material to use
 * @param maxBlocks Maximum number of blocks per command (default: 32768)
 */
export function splitFillCommand(x1, y1, z1, x2, y2, z2, material, maxBlocks = 32768) {
    // Calculate volume
    const width = Math.abs(x2 - x1) + 1;
    const height = Math.abs(y2 - y1) + 1;
    const depth = Math.abs(z2 - z1) + 1;
    const totalVolume = width * height * depth;
    // If below max limit, return a single command
    if (totalVolume <= maxBlocks) {
        return [`/fill ${x1} ${y1} ${z1} ${x2} ${y2} ${z2} ${material}`];
    }
    // Split into smaller chunks
    const commands = [];
    // Determine which dimension to split
    if (width >= height && width >= depth) {
        // Split along X
        const chunkSize = Math.floor(maxBlocks / (height * depth));
        for (let xStart = Math.min(x1, x2); xStart <= Math.max(x1, x2); xStart += chunkSize) {
            const xEnd = Math.min(xStart + chunkSize - 1, Math.max(x1, x2));
            commands.push(`/fill ${xStart} ${y1} ${z1} ${xEnd} ${y2} ${z2} ${material}`);
        }
    }
    else if (height >= width && height >= depth) {
        // Split along Y
        const chunkSize = Math.floor(maxBlocks / (width * depth));
        for (let yStart = Math.min(y1, y2); yStart <= Math.max(y1, y2); yStart += chunkSize) {
            const yEnd = Math.min(yStart + chunkSize - 1, Math.max(y1, y2));
            commands.push(`/fill ${x1} ${yStart} ${z1} ${x2} ${yEnd} ${z2} ${material}`);
        }
    }
    else {
        // Split along Z
        const chunkSize = Math.floor(maxBlocks / (width * height));
        for (let zStart = Math.min(z1, z2); zStart <= Math.max(z1, z2); zStart += chunkSize) {
            const zEnd = Math.min(zStart + chunkSize - 1, Math.max(z1, z2));
            commands.push(`/fill ${x1} ${y1} ${zStart} ${x2} ${y2} ${zEnd} ${material}`);
        }
    }
    return commands;
}
//# sourceMappingURL=commandUtils.js.map