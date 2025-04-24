export interface PixelArtTemplate {
    name: string;
    description: string;
    pixels: string[][];
    tags: string[];
    recommendedBlocks?: Record<string, string[]>;
}
export declare const pixelArtTemplates: Record<string, PixelArtTemplate>;
export declare const pixelArtByTag: Record<string, string[]>;
export declare function getTemplateById(id: string): PixelArtTemplate | undefined;
export declare function getTemplatesByTag(tag: string): PixelArtTemplate[];
export declare function getAllTemplateIds(): string[];
export declare function getAllTags(): string[];
