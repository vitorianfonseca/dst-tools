const materialImages = import.meta.glob<string>(
  "@/assets/materials/*.png",
  { eager: true, query: "?url", import: "default" }
);

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

  // Farm & Food
  "Manure": { name: "Manure" },
  "Rot": { name: "Rot" },
  "Seeds": { name: "Seeds" },

  // Other
  "Silk": { name: "Silk" },
  "Spider Gland": { name: "Spider Gland" },
  "Pig Skin": { name: "Pig Skin" },
  "Beefalo Wool": { name: "Beefalo Wool" },
  "Stinger": { name: "Stinger" },
  "Honeycomb": { name: "Honeycomb" },
  "Beeswax": { name: "Beeswax" },

  // Lunar
  "Moon Rock": { name: "Moon Rock" },
  "Pure Horror": { name: "Pure Horror" },

  // Animals & Special
  "Rabbit": { name: "Rabbit" },
  "Top Hat": { name: "Top Hat" },
  "Meat": { name: "Meat" },
  "Beard Hair": { name: "Beard Hair" },
  "Nitre": { name: "Nitre" },
  "Lureplant Bulb": { name: "Lureplant Bulb" },
};

export function getMaterialImage(materialName: string): string | undefined {
  const id = materialName.toLowerCase().replace(/\s+/g, "-");
  const key = `/src/assets/materials/${id}.png`;
  return materialImages[key];
}
