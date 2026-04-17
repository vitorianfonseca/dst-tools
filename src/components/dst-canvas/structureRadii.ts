export interface RadiusDef {
  label: string
  radius: number  // DST game units
  color: number   // Pixi.js hex (0xRRGGBB)
  fillAlpha: number
  strokeAlpha: number
}

// Key: structure id (matches Structure.id from data/structures.ts)
export const STRUCTURE_RADII: Record<string, RadiusDef[]> = {
  'campfire': [
    { label: 'Heat', radius: 3.5, color: 0xff6600, fillAlpha: 0.12, strokeAlpha: 0.4 },
    { label: 'Light', radius: 5, color: 0xffaa00, fillAlpha: 0.06, strokeAlpha: 0.2 },
  ],
  'fire-pit': [
    { label: 'Heat', radius: 3.5, color: 0xff6600, fillAlpha: 0.12, strokeAlpha: 0.4 },
    { label: 'Light', radius: 5, color: 0xffaa00, fillAlpha: 0.06, strokeAlpha: 0.2 },
  ],
  'endothermic-fire-pit': [
    { label: 'Coolness', radius: 3.5, color: 0x88eeff, fillAlpha: 0.12, strokeAlpha: 0.4 },
  ],
  'lightning-rod': [
    { label: 'Protection', radius: 16, color: 0x4466ff, fillAlpha: 0.04, strokeAlpha: 0.25 },
  ],
  'ice-flingomatic': [
    { label: 'Range', radius: 12, color: 0x88ccff, fillAlpha: 0.07, strokeAlpha: 0.3 },
  ],
  'bee-box': [
    { label: 'Flower range', radius: 20, color: 0xffee44, fillAlpha: 0.03, strokeAlpha: 0.15 },
  ],
  'scaled-furnace': [
    { label: 'Heat', radius: 6, color: 0xff4400, fillAlpha: 0.1, strokeAlpha: 0.35 },
  ],
  'mushroom-light': [
    { label: 'Light', radius: 4, color: 0xaa88ff, fillAlpha: 0.08, strokeAlpha: 0.25 },
  ],
  'mushroom-light-bloom': [
    { label: 'Light', radius: 5, color: 0xaa88ff, fillAlpha: 0.08, strokeAlpha: 0.25 },
  ],
  'night-light': [
    { label: 'Light', radius: 4, color: 0xcc88ff, fillAlpha: 0.08, strokeAlpha: 0.25 },
  ],
  'houndius-shootius': [
    { label: 'Attack range', radius: 15, color: 0xff4444, fillAlpha: 0.04, strokeAlpha: 0.2 },
  ],
  'tooth-trap': [
    { label: 'Trigger radius', radius: 1, color: 0xff4444, fillAlpha: 0.15, strokeAlpha: 0.5 },
  ],
}

export function getRadii(structureId: string): RadiusDef[] {
  return STRUCTURE_RADII[structureId] ?? []
}
