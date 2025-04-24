export declare function processLocalImage(filePath: string, maxHeight?: number, options?: {
    dithering?: boolean;
}): Promise<string[][]>;
export declare function processImageUrl(imageUrl: string, maxHeight?: number, options?: {
    dithering?: boolean;
}): Promise<string[][]>;
export declare function processBase64Image(base64String: string, maxHeight?: number, options?: {
    dithering?: boolean;
}): Promise<string[][]>;
export declare function processImageBuffer(buffer: Buffer, maxHeight?: number, options?: {
    dithering?: boolean;
}): Promise<string[][]>;
export declare function savePixelArtBlueprintToFile(blockArray: string[][], filePath: string): void;
export declare function getBlockCount(blockArray: string[][]): Record<string, number>;
export declare function formatBlockRequirements(blockCounts: Record<string, number>): string;
