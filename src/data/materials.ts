import { getTileMapping } from "./tileMappings";

export interface Material {
  name: string;
  image?: string;
}

export const materials: Record<string, Material> = {
  // Raw Resources
  "Log": { name: "Log" },
  "Twigs": { name: "Twigs" },
  "Cut Grass": { name: "Cut Grass" },
  "Rocks": { name: "Rocks" },
  "Flint": { name: "Flint" },
  "Gold Nugget": { name: "Gold Nugget" },
  
  // Refined Materials
  "Boards": { name: "Boards" },
  "Cut Stone": { name: "Cut Stone" },
  "Rope": { name: "Rope" },
  "Papyrus": { name: "Papyrus" },
  "Charcoal": { name: "Charcoal" },
  
  // Special Items
  "Electrical Doodad": { name: "Electrical Doodad" },
  "Gears": { name: "Gears" },
  "Living Log": { name: "Living Log" },
  "Nightmare Fuel": { name: "Nightmare Fuel" },
  "Purple Gem": { name: "Purple Gem" },
  "Red Gem": { name: "Red Gem" },
  "Blue Gem": { name: "Blue Gem" },
  "Marble": { name: "Marble" },
  
  // Farm & Food
  "Manure": { name: "Manure" },
  "Rot": { name: "Rot" },
  "Seeds": { name: "Seeds" },
  "Carrot": { name: "Carrot" },
  "Fertilizer": { name: "Fertilizer" },
  
  // Other
  "Silk": { name: "Silk" },
  "Spider Gland": { name: "Spider Gland" },
  "Pig Skin": { name: "Pig Skin" },
  "Beefalo Wool": { name: "Beefalo Wool" },
  "Stinger": { name: "Stinger" },
  "Honeycomb": { name: "Honeycomb" },
  "Beeswax": { name: "Beeswax" },
  "Hound Tooth": { name: "Hound Tooth" },
  "Dragonfly Scales": { name: "Dragonfly Scales" },
  "Shroom Skin": { name: "Shroom Skin" },
  "Seashell": { name: "Seashell" },
  "Ice": { name: "Ice" },
  "Salt": { name: "Salt" },
  
  // Lunar & Ancient
  "Moon Rock": { name: "Moon Rock" },
  "Pure Horror": { name: "Pure Horror" },
  "Thulecite": { name: "Thulecite" },
  
  // Animals & Special
  "Rabbit": { name: "Rabbit" },
  "Top Hat": { name: "Top Hat" },
  "Meat": { name: "Meat" },
  "Beard Hair": { name: "Beard Hair" },
  "Nitre": { name: "Nitre" },
  "Lureplant Bulb": { name: "Lureplant Bulb" },
};

export function getMaterialImage(materialName: string): string | undefined {
  const lowerName = materialName.toLowerCase().replace(/\s+/g, "-");
  const tileFile = getTileMapping(lowerName);
  
  if (tileFile) {
    return `/src/assets/dst-assets/items/splited/item_set2/${tileFile}`;
  }

  return undefined;
}
