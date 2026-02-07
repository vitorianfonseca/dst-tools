/**
 * Manual tile mappings for Don't Starve Together items
 * Format: "item-id": "tile###.png" where ### is the tile number
 * 
 * To find correct tile numbers, use the TileMapper component to visually browse tiles
 * and match them to items in the game
 */

export const tileMappings: Record<string, string> = {
  // Structures - item_set3
  "science-machine": "tile014.png",
  "alchemy-engine": "tile015.png",
  "campfire": "tile001.png",
  "fire-pit": "tile002.png",
  "crock-pot": "tile031.png",
  "drying-rack": "tile032.png",
  "chest": "tile045.png",
  "icebox": "tile046.png",
  "sign": "tile068.png",
  "tent": "tile016.png",
  "siesta-lean-to": "tile017.png",
  "endothermic-fire-pit": "tile003.png",
  
  // Materials - item_set2
  "log": "tile001.png",
  "twigs": "tile002.png",
  "cut-grass": "tile003.png",
  "rocks": "tile004.png",
  "flint": "tile005.png",
  "gold-nugget": "tile006.png",
  "boards": "tile007.png",
  "cut-stone": "tile008.png",
  "rope": "tile009.png",
  "papyrus": "tile010.png",
  "charcoal": "tile011.png",
  "gears": "tile012.png",
  "nightmare-fuel": "tile013.png",
};

export function getTileMapping(itemId: string): string | undefined {
  return tileMappings[itemId.toLowerCase()];
}
