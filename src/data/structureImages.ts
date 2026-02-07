import { getTileMapping } from "./tileMappings";

export function getStructureImage(structureId: string): string | undefined {
  const tileFile = getTileMapping(structureId);
  if (!tileFile) return undefined;

  // Determine which item_set to use based on the item
  const itemSet = structureId.includes("log") ||
    structureId.includes("twigs") ||
    structureId.includes("grass") ||
    structureId.includes("rock") ||
    structureId.includes("flint")
    ? "item_set2"
    : "item_set3";

  return `/src/assets/dst-assets/items/splited/${itemSet}/${tileFile}`;
}
