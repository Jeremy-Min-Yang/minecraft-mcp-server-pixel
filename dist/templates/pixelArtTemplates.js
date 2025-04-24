// Collection of pre-defined pixel art templates for use with the build-pixel-art tool
export const pixelArtTemplates = {
    "heart": {
        name: "Heart",
        description: "A simple heart shape (5x5)",
        pixels: [
            ["", "red_wool", "", "red_wool", ""],
            ["red_wool", "red_wool", "red_wool", "red_wool", "red_wool"],
            ["red_wool", "red_wool", "red_wool", "red_wool", "red_wool"],
            ["", "red_wool", "red_wool", "red_wool", ""],
            ["", "", "red_wool", "", ""]
        ],
        tags: ["simple", "love", "small"],
        recommendedBlocks: {
            "red_wool": ["red_concrete", "red_terracotta", "crimson_planks"]
        }
    },
    "smiley": {
        name: "Smiley Face",
        description: "A classic smiley face (8x8)",
        pixels: [
            ["", "", "yellow_concrete", "yellow_concrete", "yellow_concrete", "yellow_concrete", "", ""],
            ["", "yellow_concrete", "yellow_concrete", "yellow_concrete", "yellow_concrete", "yellow_concrete", "yellow_concrete", ""],
            ["yellow_concrete", "yellow_concrete", "black_concrete", "yellow_concrete", "yellow_concrete", "black_concrete", "yellow_concrete", "yellow_concrete"],
            ["yellow_concrete", "yellow_concrete", "yellow_concrete", "yellow_concrete", "yellow_concrete", "yellow_concrete", "yellow_concrete", "yellow_concrete"],
            ["yellow_concrete", "yellow_concrete", "yellow_concrete", "yellow_concrete", "yellow_concrete", "yellow_concrete", "yellow_concrete", "yellow_concrete"],
            ["yellow_concrete", "black_concrete", "yellow_concrete", "yellow_concrete", "yellow_concrete", "yellow_concrete", "black_concrete", "yellow_concrete"],
            ["", "yellow_concrete", "black_concrete", "black_concrete", "black_concrete", "black_concrete", "yellow_concrete", ""],
            ["", "", "yellow_concrete", "yellow_concrete", "yellow_concrete", "yellow_concrete", "", ""]
        ],
        tags: ["face", "emoji", "medium"],
        recommendedBlocks: {
            "yellow_concrete": ["yellow_wool", "gold_block", "yellow_terracotta"],
            "black_concrete": ["black_wool", "coal_block", "gray_concrete"]
        }
    },
    "creeper": {
        name: "Creeper Face",
        description: "A Minecraft creeper face (8x8)",
        pixels: [
            ["green_concrete", "green_concrete", "green_concrete", "green_concrete", "green_concrete", "green_concrete", "green_concrete", "green_concrete"],
            ["green_concrete", "green_concrete", "green_concrete", "green_concrete", "green_concrete", "green_concrete", "green_concrete", "green_concrete"],
            ["green_concrete", "green_concrete", "black_concrete", "black_concrete", "black_concrete", "black_concrete", "green_concrete", "green_concrete"],
            ["green_concrete", "black_concrete", "black_concrete", "black_concrete", "black_concrete", "black_concrete", "black_concrete", "green_concrete"],
            ["green_concrete", "black_concrete", "black_concrete", "black_concrete", "black_concrete", "black_concrete", "black_concrete", "green_concrete"],
            ["green_concrete", "green_concrete", "black_concrete", "green_concrete", "green_concrete", "black_concrete", "green_concrete", "green_concrete"],
            ["green_concrete", "green_concrete", "green_concrete", "green_concrete", "green_concrete", "green_concrete", "green_concrete", "green_concrete"],
            ["green_concrete", "green_concrete", "green_concrete", "green_concrete", "green_concrete", "green_concrete", "green_concrete", "green_concrete"]
        ],
        tags: ["minecraft", "mob", "medium"],
        recommendedBlocks: {
            "green_concrete": ["green_wool", "lime_concrete", "green_terracotta"],
            "black_concrete": ["black_wool", "coal_block", "gray_concrete"]
        }
    },
    "tree": {
        name: "Simple Tree",
        description: "A simple pixel art tree (10x12)",
        pixels: [
            ["", "", "", "", "oak_planks", "oak_planks", "", "", "", ""],
            ["", "", "", "green_wool", "green_wool", "green_wool", "green_wool", "", "", ""],
            ["", "", "green_wool", "green_wool", "green_wool", "green_wool", "green_wool", "green_wool", "", ""],
            ["", "green_wool", "green_wool", "green_wool", "green_wool", "green_wool", "green_wool", "green_wool", "green_wool", ""],
            ["green_wool", "green_wool", "green_wool", "green_wool", "green_wool", "green_wool", "green_wool", "green_wool", "green_wool", "green_wool"],
            ["", "", "", "oak_planks", "oak_planks", "", "", "", "", ""],
            ["", "", "", "oak_planks", "oak_planks", "", "", "", "", ""],
            ["", "", "", "oak_planks", "oak_planks", "", "", "", "", ""],
            ["", "", "", "oak_planks", "oak_planks", "", "", "", "", ""],
            ["", "", "dirt", "dirt", "dirt", "dirt", "", "", "", ""],
            ["", "", "dirt", "dirt", "dirt", "dirt", "", "", "", ""],
            ["", "", "dirt", "dirt", "dirt", "dirt", "", "", "", ""]
        ],
        tags: ["nature", "plant", "medium"],
        recommendedBlocks: {
            "green_wool": ["green_concrete", "lime_wool", "leaves"],
            "oak_planks": ["spruce_planks", "dark_oak_planks", "brown_concrete"],
            "dirt": ["coarse_dirt", "brown_concrete", "brown_terracotta"]
        }
    },
    "mushroom": {
        name: "Mushroom",
        description: "A Super Mario style mushroom (8x8)",
        pixels: [
            ["", "", "red_wool", "red_wool", "red_wool", "red_wool", "", ""],
            ["", "red_wool", "red_wool", "red_wool", "red_wool", "red_wool", "red_wool", ""],
            ["red_wool", "red_wool", "white_wool", "white_wool", "red_wool", "red_wool", "red_wool", "red_wool"],
            ["red_wool", "white_wool", "white_wool", "white_wool", "white_wool", "white_wool", "white_wool", "red_wool"],
            ["red_wool", "white_wool", "white_wool", "white_wool", "white_wool", "white_wool", "white_wool", "red_wool"],
            ["", "brown_wool", "brown_wool", "brown_wool", "brown_wool", "", "", ""],
            ["", "brown_wool", "brown_wool", "brown_wool", "brown_wool", "", "", ""],
            ["", "brown_wool", "brown_wool", "brown_wool", "brown_wool", "", "", ""]
        ],
        tags: ["game", "mario", "medium"],
        recommendedBlocks: {
            "red_wool": ["red_concrete", "red_terracotta", "red_nether_bricks"],
            "white_wool": ["white_concrete", "quartz_block", "bone_block"],
            "brown_wool": ["brown_concrete", "brown_terracotta", "oak_planks"]
        }
    },
    "diamond": {
        name: "Diamond",
        description: "A Minecraft diamond (8x8)",
        pixels: [
            ["", "", "", "diamond_block", "diamond_block", "", "", ""],
            ["", "", "diamond_block", "diamond_block", "diamond_block", "diamond_block", "", ""],
            ["", "diamond_block", "diamond_block", "diamond_block", "diamond_block", "diamond_block", "diamond_block", ""],
            ["diamond_block", "diamond_block", "diamond_block", "diamond_block", "diamond_block", "diamond_block", "diamond_block", "diamond_block"],
            ["diamond_block", "diamond_block", "diamond_block", "diamond_block", "diamond_block", "diamond_block", "diamond_block", "diamond_block"],
            ["", "diamond_block", "diamond_block", "diamond_block", "diamond_block", "diamond_block", "diamond_block", ""],
            ["", "", "diamond_block", "diamond_block", "diamond_block", "diamond_block", "", ""],
            ["", "", "", "diamond_block", "diamond_block", "", "", ""]
        ],
        tags: ["minecraft", "item", "medium"],
        recommendedBlocks: {
            "diamond_block": ["light_blue_concrete", "blue_concrete", "blue_wool"]
        }
    },
    "pacman": {
        name: "Pac-Man",
        description: "A simple Pac-Man character (8x8)",
        pixels: [
            ["", "", "yellow_concrete", "yellow_concrete", "yellow_concrete", "yellow_concrete", "", ""],
            ["", "yellow_concrete", "yellow_concrete", "yellow_concrete", "yellow_concrete", "yellow_concrete", "yellow_concrete", ""],
            ["yellow_concrete", "yellow_concrete", "yellow_concrete", "yellow_concrete", "yellow_concrete", "yellow_concrete", "yellow_concrete", ""],
            ["yellow_concrete", "yellow_concrete", "yellow_concrete", "yellow_concrete", "yellow_concrete", "", "", ""],
            ["yellow_concrete", "yellow_concrete", "yellow_concrete", "yellow_concrete", "yellow_concrete", "", "", ""],
            ["yellow_concrete", "yellow_concrete", "yellow_concrete", "yellow_concrete", "yellow_concrete", "yellow_concrete", "yellow_concrete", ""],
            ["", "yellow_concrete", "yellow_concrete", "yellow_concrete", "yellow_concrete", "yellow_concrete", "yellow_concrete", ""],
            ["", "", "yellow_concrete", "yellow_concrete", "yellow_concrete", "yellow_concrete", "", ""]
        ],
        tags: ["game", "arcade", "medium"],
        recommendedBlocks: {
            "yellow_concrete": ["yellow_wool", "gold_block", "yellow_terracotta"]
        }
    },
    "ghost": {
        name: "Arcade Ghost",
        description: "A ghost enemy from arcade games (8x8)",
        pixels: [
            ["", "", "red_concrete", "red_concrete", "red_concrete", "red_concrete", "", ""],
            ["", "red_concrete", "red_concrete", "red_concrete", "red_concrete", "red_concrete", "red_concrete", ""],
            ["red_concrete", "red_concrete", "white_concrete", "white_concrete", "red_concrete", "white_concrete", "white_concrete", "red_concrete"],
            ["red_concrete", "red_concrete", "white_concrete", "blue_concrete", "red_concrete", "white_concrete", "blue_concrete", "red_concrete"],
            ["red_concrete", "red_concrete", "red_concrete", "red_concrete", "red_concrete", "red_concrete", "red_concrete", "red_concrete"],
            ["red_concrete", "red_concrete", "red_concrete", "red_concrete", "red_concrete", "red_concrete", "red_concrete", "red_concrete"],
            ["red_concrete", "red_concrete", "red_concrete", "red_concrete", "red_concrete", "red_concrete", "red_concrete", "red_concrete"],
            ["red_concrete", "", "red_concrete", "", "red_concrete", "", "red_concrete", ""]
        ],
        tags: ["game", "arcade", "medium"],
        recommendedBlocks: {
            "red_concrete": ["red_wool", "red_terracotta", "netherrack"],
            "white_concrete": ["white_wool", "quartz_block", "bone_block"],
            "blue_concrete": ["blue_wool", "lapis_block", "blue_terracotta"]
        }
    },
    "star": {
        name: "Star",
        description: "A simple star (7x7)",
        pixels: [
            ["", "", "", "gold_block", "", "", ""],
            ["", "", "gold_block", "gold_block", "gold_block", "", ""],
            ["", "gold_block", "gold_block", "gold_block", "gold_block", "gold_block", ""],
            ["gold_block", "gold_block", "gold_block", "gold_block", "gold_block", "gold_block", "gold_block"],
            ["", "", "gold_block", "gold_block", "gold_block", "", ""],
            ["", "gold_block", "", "gold_block", "", "gold_block", ""],
            ["gold_block", "", "", "", "", "", "gold_block"]
        ],
        tags: ["simple", "space", "small"],
        recommendedBlocks: {
            "gold_block": ["yellow_concrete", "yellow_wool", "yellow_terracotta"]
        }
    },
    "flower": {
        name: "Simple Flower",
        description: "A simple pixelated flower (7x7)",
        pixels: [
            ["", "", "red_concrete", "red_concrete", "red_concrete", "", ""],
            ["", "red_concrete", "red_concrete", "yellow_concrete", "red_concrete", "red_concrete", ""],
            ["red_concrete", "red_concrete", "yellow_concrete", "yellow_concrete", "yellow_concrete", "red_concrete", "red_concrete"],
            ["red_concrete", "yellow_concrete", "yellow_concrete", "yellow_concrete", "yellow_concrete", "yellow_concrete", "red_concrete"],
            ["red_concrete", "red_concrete", "yellow_concrete", "yellow_concrete", "yellow_concrete", "red_concrete", "red_concrete"],
            ["", "red_concrete", "red_concrete", "yellow_concrete", "red_concrete", "red_concrete", ""],
            ["", "", "red_concrete", "red_concrete", "red_concrete", "", ""]
        ],
        tags: ["nature", "plant", "small"],
        recommendedBlocks: {
            "red_concrete": ["red_wool", "red_terracotta", "poppy"],
            "yellow_concrete": ["yellow_wool", "gold_block", "honeycomb_block"]
        }
    },
    "thunder_logo": {
        name: "Thunder Logo",
        description: "Oklahoma City Thunder logo (15x15)",
        pixels: [
            ["", "", "", "", "", "blue_concrete", "blue_concrete", "blue_concrete", "blue_concrete", "blue_concrete", "", "", "", "", ""],
            ["", "", "", "blue_concrete", "blue_concrete", "blue_concrete", "blue_concrete", "blue_concrete", "blue_concrete", "blue_concrete", "blue_concrete", "blue_concrete", "", "", ""],
            ["", "", "blue_concrete", "blue_concrete", "blue_concrete", "blue_concrete", "blue_concrete", "blue_concrete", "blue_concrete", "blue_concrete", "blue_concrete", "blue_concrete", "blue_concrete", "", ""],
            ["", "blue_concrete", "blue_concrete", "blue_concrete", "blue_concrete", "orange_concrete", "orange_concrete", "orange_concrete", "blue_concrete", "blue_concrete", "blue_concrete", "blue_concrete", "blue_concrete", "blue_concrete", ""],
            ["", "blue_concrete", "blue_concrete", "blue_concrete", "orange_concrete", "orange_concrete", "orange_concrete", "orange_concrete", "orange_concrete", "blue_concrete", "blue_concrete", "blue_concrete", "blue_concrete", "blue_concrete", ""],
            ["blue_concrete", "blue_concrete", "blue_concrete", "orange_concrete", "orange_concrete", "orange_concrete", "orange_concrete", "orange_concrete", "orange_concrete", "orange_concrete", "blue_concrete", "blue_concrete", "blue_concrete", "blue_concrete", "blue_concrete"],
            ["blue_concrete", "blue_concrete", "blue_concrete", "orange_concrete", "orange_concrete", "white_concrete", "white_concrete", "white_concrete", "orange_concrete", "orange_concrete", "blue_concrete", "blue_concrete", "blue_concrete", "blue_concrete", "blue_concrete"],
            ["blue_concrete", "blue_concrete", "blue_concrete", "orange_concrete", "orange_concrete", "white_concrete", "white_concrete", "white_concrete", "orange_concrete", "orange_concrete", "blue_concrete", "blue_concrete", "blue_concrete", "blue_concrete", "blue_concrete"],
            ["blue_concrete", "blue_concrete", "blue_concrete", "orange_concrete", "orange_concrete", "white_concrete", "white_concrete", "white_concrete", "orange_concrete", "orange_concrete", "blue_concrete", "blue_concrete", "blue_concrete", "blue_concrete", "blue_concrete"],
            ["blue_concrete", "blue_concrete", "blue_concrete", "orange_concrete", "orange_concrete", "orange_concrete", "orange_concrete", "orange_concrete", "orange_concrete", "orange_concrete", "blue_concrete", "blue_concrete", "blue_concrete", "blue_concrete", "blue_concrete"],
            ["", "blue_concrete", "blue_concrete", "blue_concrete", "orange_concrete", "orange_concrete", "orange_concrete", "orange_concrete", "orange_concrete", "blue_concrete", "blue_concrete", "blue_concrete", "blue_concrete", "blue_concrete", ""],
            ["", "blue_concrete", "blue_concrete", "blue_concrete", "blue_concrete", "orange_concrete", "orange_concrete", "orange_concrete", "blue_concrete", "blue_concrete", "blue_concrete", "blue_concrete", "blue_concrete", "blue_concrete", ""],
            ["", "", "blue_concrete", "blue_concrete", "blue_concrete", "blue_concrete", "blue_concrete", "blue_concrete", "blue_concrete", "blue_concrete", "blue_concrete", "blue_concrete", "blue_concrete", "", ""],
            ["", "", "", "blue_concrete", "blue_concrete", "blue_concrete", "blue_concrete", "blue_concrete", "blue_concrete", "blue_concrete", "blue_concrete", "blue_concrete", "", "", ""],
            ["", "", "", "", "", "blue_concrete", "blue_concrete", "blue_concrete", "blue_concrete", "blue_concrete", "", "", "", "", ""]
        ],
        tags: ["sports", "basketball", "logo", "medium"],
        recommendedBlocks: {
            "blue_concrete": ["blue_wool", "light_blue_concrete", "blue_terracotta"],
            "orange_concrete": ["orange_wool", "orange_terracotta", "gold_block"],
            "white_concrete": ["white_wool", "quartz_block", "bone_block"]
        }
    }
};
export const pixelArtByTag = {};
// Build tag index
for (const [id, template] of Object.entries(pixelArtTemplates)) {
    for (const tag of template.tags) {
        if (!pixelArtByTag[tag]) {
            pixelArtByTag[tag] = [];
        }
        pixelArtByTag[tag].push(id);
    }
}
export function getTemplateById(id) {
    return pixelArtTemplates[id];
}
export function getTemplatesByTag(tag) {
    const templateIds = pixelArtByTag[tag] || [];
    return templateIds.map(id => pixelArtTemplates[id]);
}
export function getAllTemplateIds() {
    return Object.keys(pixelArtTemplates);
}
export function getAllTags() {
    return Object.keys(pixelArtByTag);
}
//# sourceMappingURL=pixelArtTemplates.js.map