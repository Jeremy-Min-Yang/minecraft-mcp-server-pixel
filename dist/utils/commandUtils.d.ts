import { Bot } from 'mineflayer';
/**
 * Execute a Minecraft command with rate limiting
 * @param bot Mineflayer bot instance
 * @param command Command to execute (without leading slash)
 * @param delay Delay in ms between commands (to avoid chat rate limiting)
 */
export declare function executeCommand(bot: Bot, command: string, delay?: number): Promise<void>;
/**
 * Execute a list of Minecraft commands with rate limiting
 * @param bot Mineflayer bot instance
 * @param commands Array of commands to execute
 * @param delay Delay in ms between commands
 * @param progressCallback Optional callback to report progress
 */
export declare function executeCommands(bot: Bot, commands: string[], delay?: number, progressCallback?: (current: number, total: number) => void): Promise<void>;
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
export declare function clearArea(bot: Bot, x1: number, y1: number, z1: number, x2: number, y2: number, z2: number): Promise<void>;
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
export declare function splitFillCommand(x1: number, y1: number, z1: number, x2: number, y2: number, z2: number, material: string, maxBlocks?: number): string[];
