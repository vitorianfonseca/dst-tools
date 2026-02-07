import { z } from "zod";

/**
 * Schema for Structure object from @/data/structures
 */
const StructureSchema = z.object({
  id: z.string(),
  name: z.string(),
  category: z.enum(["science", "food", "light", "survival", "refining", "structures", "farming", "magic"]),
  description: z.string(),
  icon: z.string(),
});

/**
 * Schema for GroundTile object from @/data/groundTiles
 */
const GroundTileSchema = z.object({
  id: z.string(),
  name: z.string(),
  image: z.string(),
});

/**
 * Schema for a placed structure in the workspace
 */
export const PlacedStructureSchema = z.object({
  id: z.string(),
  structure: StructureSchema,
  gridX: z.number(),
  gridY: z.number(),
  built: z.boolean(),
  isNew: z.boolean().optional(),
});

/**
 * Schema for a placed ground tile in the workspace
 */
export const PlacedGroundTileSchema = z.object({
  id: z.string(),
  tile: GroundTileSchema,
  gridX: z.number(),
  gridY: z.number(),
  isNew: z.boolean().optional(),
});

/**
 * Schema for the workspace data column
 * This represents the expected structure of the JSON stored in the database
 */
export const WorkspaceDataSchema = z.object({
  structures: z.array(PlacedStructureSchema).optional().default([]),
  groundTiles: z.array(PlacedGroundTileSchema).optional().default([]),
});

/**
 * Type inference for WorkspaceData
 */
export type WorkspaceData = z.infer<typeof WorkspaceDataSchema>;

/**
 * Type inference for PlacedStructure
 */
export type PlacedStructure = z.infer<typeof PlacedStructureSchema>;

/**
 * Type inference for PlacedGroundTile
 */
export type PlacedGroundTile = z.infer<typeof PlacedGroundTileSchema>;

/**
 * Validates and safely parses workspace data with a fallback to empty workspace
 * @param data - The raw JSON data from the database
 * @returns Validated workspace data or empty workspace on error
 */
export function validateWorkspaceData(data: unknown): {
  success: boolean;
  data: WorkspaceData;
  error?: z.ZodError;
} {
  const result = WorkspaceDataSchema.safeParse(data);
  
  if (result.success) {
    return { success: true, data: result.data };
  }
  
  // Return empty workspace as fallback
  return {
    success: false,
    data: { structures: [], groundTiles: [] },
    error: result.error,
  };
}
