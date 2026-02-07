import { describe, it, expect } from "vitest";
import { validateWorkspaceData, WorkspaceDataSchema } from "./workspace";

/**
 * Integration tests simulating real-world workspace data scenarios
 */
describe("Workspace Data Validation - Integration Tests", () => {
  it("should handle loading a workspace with valid data", () => {
    // Simulate loading data from database
    const dbData = {
      structures: [
        {
          id: "farm-1",
          structure: {
            id: "improved_farm",
            name: "Improved Farm",
            category: "farming",
            description: "A better farm",
            icon: "🌾",
          },
          gridX: 5,
          gridY: 10,
          built: true,
        },
      ],
      groundTiles: [
        {
          id: "tile-grass-5-9",
          tile: {
            id: "grass",
            name: "Grass",
            image: "/images/grass.png",
          },
          gridX: 5,
          gridY: 9,
        },
      ],
    };

    const result = validateWorkspaceData(dbData);
    
    expect(result.success).toBe(true);
    expect(result.data.structures).toHaveLength(1);
    expect(result.data.groundTiles).toHaveLength(1);
    expect(result.data.structures![0].built).toBe(true);
  });

  it("should handle loading a corrupted workspace with graceful fallback", () => {
    // Simulate corrupted data from database (e.g., someone manually edited JSON)
    const corruptedData = {
      structures: "this should be an array",
      groundTiles: null,
      unexpectedField: "unexpected value",
    };

    const result = validateWorkspaceData(corruptedData);
    
    expect(result.success).toBe(false);
    expect(result.data).toEqual({ structures: [], groundTiles: [] });
    expect(result.error).toBeDefined();
  });

  it("should handle saving new structures with validation", () => {
    // Simulate saving new structures
    const dataToSave = {
      structures: [
        {
          id: "science-1",
          structure: {
            id: "science_machine",
            name: "Science Machine",
            category: "science",
            description: "Research structure",
            icon: "🔬",
          },
          gridX: 0,
          gridY: 0,
          built: false,
        },
      ],
    };

    const result = WorkspaceDataSchema.safeParse(dataToSave);
    
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.structures).toHaveLength(1);
      // Default should be applied
      expect(result.data.groundTiles).toEqual([]);
    }
  });

  it("should prevent saving invalid structures", () => {
    // Simulate attempting to save invalid data
    const invalidData = {
      structures: [
        {
          id: "invalid-structure",
          // missing required 'structure' field
          gridX: 10,
          gridY: 20,
          built: false,
        },
      ],
    };

    const result = WorkspaceDataSchema.safeParse(invalidData);
    
    expect(result.success).toBe(false);
  });

  it("should handle merging structures and groundTiles when saving tiles", () => {
    // Simulate the scenario in useGroundTiles where we merge existing structures with new tiles
    const existingData = {
      structures: [
        {
          id: "existing-1",
          structure: {
            id: "science_machine",
            name: "Science Machine",
            category: "science",
            description: "Research",
            icon: "🔬",
          },
          gridX: 0,
          gridY: 0,
          built: true,
        },
      ],
      groundTiles: [],
    };

    const newTiles = [
      {
        id: "new-tile-1",
        tile: {
          id: "grass",
          name: "Grass",
          image: "/images/grass.png",
        },
        gridX: 1,
        gridY: 1,
      },
    ];

    const mergedData = { ...existingData, groundTiles: newTiles };
    const result = WorkspaceDataSchema.safeParse(mergedData);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.structures).toHaveLength(1);
      expect(result.data.groundTiles).toHaveLength(1);
    }
  });

  it("should handle empty workspace data (new workspace)", () => {
    // Simulate a brand new workspace with no data
    const emptyData = null;

    const result = validateWorkspaceData(emptyData);
    
    // Should fail validation but provide empty workspace as fallback
    expect(result.success).toBe(false);
    expect(result.data).toEqual({ structures: [], groundTiles: [] });
  });

  it("should handle workspace with structures that have optional isNew flag", () => {
    const dataWithNewFlag = {
      structures: [
        {
          id: "new-structure-1",
          structure: {
            id: "campfire",
            name: "Campfire",
            category: "light",
            description: "Provides light",
            icon: "🔥",
          },
          gridX: 5,
          gridY: 5,
          built: false,
          isNew: true,
        },
      ],
      groundTiles: [],
    };

    const result = WorkspaceDataSchema.safeParse(dataWithNewFlag);
    
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.structures![0].isNew).toBe(true);
    }
  });

  it("should reject structures with invalid category", () => {
    const invalidCategory = {
      structures: [
        {
          id: "invalid-1",
          structure: {
            id: "unknown",
            name: "Unknown Structure",
            category: "invalid_category",
            description: "Invalid",
            icon: "❓",
          },
          gridX: 0,
          gridY: 0,
          built: false,
        },
      ],
    };

    const result = WorkspaceDataSchema.safeParse(invalidCategory);
    
    expect(result.success).toBe(false);
  });

  it("should handle workspace with only groundTiles and no structures", () => {
    const tilesOnly = {
      groundTiles: [
        {
          id: "tile-1",
          tile: {
            id: "wood",
            name: "Wood Floor",
            image: "/images/wood.png",
          },
          gridX: 0,
          gridY: 0,
        },
        {
          id: "tile-2",
          tile: {
            id: "wood",
            name: "Wood Floor",
            image: "/images/wood.png",
          },
          gridX: 1,
          gridY: 0,
        },
      ],
    };

    const result = WorkspaceDataSchema.safeParse(tilesOnly);
    
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.structures).toEqual([]);
      expect(result.data.groundTiles).toHaveLength(2);
    }
  });

  it("should handle large workspace with many structures and tiles", () => {
    // Simulate a large, complex workspace
    const largeWorkspace = {
      structures: Array.from({ length: 50 }, (_, i) => ({
        id: `structure-${i}`,
        structure: {
          id: "science_machine",
          name: "Science Machine",
          category: "science" as const,
          description: "Research",
          icon: "🔬",
        },
        gridX: i % 10,
        gridY: Math.floor(i / 10),
        built: i % 2 === 0,
      })),
      groundTiles: Array.from({ length: 100 }, (_, i) => ({
        id: `tile-${i}`,
        tile: {
          id: "grass",
          name: "Grass",
          image: "/images/grass.png",
        },
        gridX: i % 10,
        gridY: Math.floor(i / 10),
      })),
    };

    const result = WorkspaceDataSchema.safeParse(largeWorkspace);
    
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.structures).toHaveLength(50);
      expect(result.data.groundTiles).toHaveLength(100);
    }
  });
});
