const structureImages = import.meta.glob<string>(
  "@/assets/structures/*.png",
  { eager: true, query: "?url", import: "default" }
);

export function getStructureImage(structureId: string): string | undefined {
  const key = `/src/assets/structures/${structureId}.png`;
  return structureImages[key];
}
