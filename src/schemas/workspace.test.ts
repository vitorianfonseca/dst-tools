import { describe, it, expect } from "vitest";
import {
  WorkspaceDataSchema,
  PlacedStructureSchema,
  PlacedGroundTileSchema,
  validateWorkspaceData,
} from "./workspace";

describe("WorkspaceDataSchema", () => {
  describe("PlacedStructureSchema", () => {
    it("should validate a valid placed structure", () => {
      const validStructure = {
        id: "structure-1",
        structure: {
          id: "science_machine",
          name: "Science Machine",
          category: "science",
          description: "A scientific structure",
          icon: "🔬",
        },
        gridX: 10,
        gridY: 20,
        built: false,
      };

      const result = PlacedStructureSchema.safeParse(validStructure);
      expect(result.success).toBe(true);
    });

    it("should reject structure with missing required fields", () => {
      const invalidStructure = {
        id: "structure-1",
        gridX: 10,
        gridY: 20,
        // missing structure and built fields
      };

      const result = PlacedStructureSchema.safeParse(invalidStructure);
      expect(result.success).toBe(false);
    });

    it("should reject structure with invalid category", () => {
      const invalidStructure = {
        id: "structure-1",
        structure: {
          id: "science_machine",
          name: "Science Machine",
          category: "invalid_category",
          description: "A scientific structure",
          icon: "🔬",
        },
        gridX: 10,
        gridY: 20,
        built: false,
      };

      const result = PlacedStructureSchema.safeParse(invalidStructure);
      expect(result.success).toBe(false);
    });

    it("should accept optional isNew field", () => {
      const validStructure = {
        id: "structure-1",
        structure: {
          id: "science_machine",
          name: "Science Machine",
          category: "science",
          description: "A scientific structure",
          icon: "🔬",
        },
        gridX: 10,
        gridY: 20,
        built: false,
        isNew: true,
      };

      const result = PlacedStructureSchema.safeParse(validStructure);
      expect(result.success).toBe(true);
    });
  });

  describe("PlacedGroundTileSchema", () => {
    it("should validate a valid placed ground tile", () => {
      const validTile = {
        id: "tile-1",
        tile: {
          id: "grass",
          name: "Grass",
          image: "/images/grass.png",
        },
        gridX: 5,
        gridY: 15,
      };

      const result = PlacedGroundTileSchema.safeParse(validTile);
      expect(result.success).toBe(true);
    });

    it("should reject tile with missing required fields", () => {
      const invalidTile = {
        id: "tile-1",
        gridX: 5,
        // missing tile and gridY fields
      };

      const result = PlacedGroundTileSchema.safeParse(invalidTile);
      expect(result.success).toBe(false);
    });

    it("should accept optional isNew field", () => {
      const validTile = {
        id: "tile-1",
        tile: {
          id: "grass",
          name: "Grass",
          image: "/images/grass.png",
        },
        gridX: 5,
        gridY: 15,
        isNew: true,
      };

      const result = PlacedGroundTileSchema.safeParse(validTile);
      expect(result.success).toBe(true);
    });
  });

  describe("WorkspaceDataSchema", () => {
    it("should validate valid workspace data with both structures and tiles", () => {
      const validData = {
        structures: [
          {
            id: "structure-1",
            structure: {
              id: "science_machine",
              name: "Science Machine",
              category: "science",
              description: "A scientific structure",
              icon: "🔬",
            },
            gridX: 10,
            gridY: 20,
            built: false,
          },
        ],
        groundTiles: [
          {
            id: "tile-1",
            tile: {
              id: "grass",
              name: "Grass",
              image: "/images/grass.png",
            },
            gridX: 5,
            gridY: 15,
          },
        ],
      };

      const result = WorkspaceDataSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it("should validate empty workspace data", () => {
      const emptyData = {};

      const result = WorkspaceDataSchema.safeParse(emptyData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.structures).toEqual([]);
        expect(result.data.groundTiles).toEqual([]);
      }
    });

    it("should validate workspace data with only structures", () => {
      const dataWithStructuresOnly = {
        structures: [
          {
            id: "structure-1",
            structure: {
              id: "science_machine",
              name: "Science Machine",
              category: "science",
              description: "A scientific structure",
              icon: "🔬",
            },
            gridX: 10,
            gridY: 20,
            built: false,
          },
        ],
      };

      const result = WorkspaceDataSchema.safeParse(dataWithStructuresOnly);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.groundTiles).toEqual([]);
      }
    });

    it("should validate workspace data with only ground tiles", () => {
      const dataWithTilesOnly = {
        groundTiles: [
          {
            id: "tile-1",
            tile: {
              id: "grass",
              name: "Grass",
              image: "/images/grass.png",
            },
            gridX: 5,
            gridY: 15,
          },
        ],
      };

      const result = WorkspaceDataSchema.safeParse(dataWithTilesOnly);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.structures).toEqual([]);
      }
    });

    it("should reject workspace data with invalid structures", () => {
      const invalidData = {
        structures: [
          {
            id: "structure-1",
            // missing structure field
            gridX: 10,
            gridY: 20,
            built: false,
          },
        ],
      };

      const result = WorkspaceDataSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it("should reject workspace data with invalid tiles", () => {
      const invalidData = {
        groundTiles: [
          {
            id: "tile-1",
            // missing tile field
            gridX: 5,
            gridY: 15,
          },
        ],
      };

      const result = WorkspaceDataSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe("validateWorkspaceData", () => {
    it("should return success for valid data", () => {
      const validData = {
        structures: [
          {
            id: "structure-1",
            structure: {
              id: "science_machine",
              name: "Science Machine",
              category: "science",
              description: "A scientific structure",
              icon: "🔬",
            },
            gridX: 10,
            gridY: 20,
            built: false,
          },
        ],
        groundTiles: [],
      };

      const result = validateWorkspaceData(validData);
      expect(result.success).toBe(true);
      expect(result.data).toEqual(validData);
      expect(result.error).toBeUndefined();
    });

    it("should return empty workspace as fallback for invalid data", () => {
      const invalidData = {
        structures: "not an array",
        groundTiles: 123,
      };

      const result = validateWorkspaceData(invalidData);
      expect(result.success).toBe(false);
      expect(result.data).toEqual({ structures: [], groundTiles: [] });
      expect(result.error).toBeDefined();
    });

    it("should return empty workspace as fallback for null data", () => {
      const result = validateWorkspaceData(null);
      expect(result.success).toBe(false);
      expect(result.data).toEqual({ structures: [], groundTiles: [] });
      expect(result.error).toBeDefined();
    });

    it("should return empty workspace as fallback for undefined data", () => {
      const result = validateWorkspaceData(undefined);
      expect(result.success).toBe(false);
      expect(result.data).toEqual({ structures: [], groundTiles: [] });
      expect(result.error).toBeDefined();
    });

    it("should handle partially corrupt data", () => {
      const partiallyCorruptData = {
        structures: [
          {
            id: "structure-1",
            structure: {
              id: "science_machine",
              name: "Science Machine",
              category: "science",
              description: "A scientific structure",
              icon: "🔬",
            },
            gridX: 10,
            gridY: 20,
            built: false,
          },
          {
            // this structure is invalid - missing required fields
            id: "structure-2",
            gridX: 30,
          },
        ],
        groundTiles: [],
      };

      const result = validateWorkspaceData(partiallyCorruptData);
      expect(result.success).toBe(false);
      expect(result.data).toEqual({ structures: [], groundTiles: [] });
      expect(result.error).toBeDefined();
    });

    it("should apply default values for missing optional fields", () => {
      const minimalData = {};

      const result = validateWorkspaceData(minimalData);
      expect(result.success).toBe(true);
      expect(result.data).toEqual({ structures: [], groundTiles: [] });
    });
  });
});
