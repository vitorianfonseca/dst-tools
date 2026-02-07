import { describe, it, expect } from "vitest";
import { structures, categories } from "../data/structures";

describe("Structures Data", () => {
  it("should not have duplicate emojis within the same category", () => {
    // Group structures by category
    const structuresByCategory = structures.reduce((acc, structure) => {
      if (!acc[structure.category]) {
        acc[structure.category] = [];
      }
      acc[structure.category].push(structure);
      return acc;
    }, {} as Record<string, typeof structures>);

    // Check for duplicates in each category
    const duplicates: { category: string; emoji: string; structures: string[] }[] = [];
    
    Object.entries(structuresByCategory).forEach(([category, categoryStructures]) => {
      const emojiMap = new Map<string, string[]>();
      
      categoryStructures.forEach((structure) => {
        const emoji = structure.icon;
        const existingStructures = emojiMap.get(emoji);
        if (existingStructures) {
          existingStructures.push(structure.name);
        } else {
          emojiMap.set(emoji, [structure.name]);
        }
      });
      
      // Find emojis used by multiple structures
      emojiMap.forEach((structureNames, emoji) => {
        if (structureNames.length > 1) {
          duplicates.push({
            category,
            emoji,
            structures: structureNames,
          });
        }
      });
    });

    // Fail if there are duplicates
    if (duplicates.length > 0) {
      const message = duplicates
        .map(
          (dup) =>
            `Category "${dup.category}" has duplicate emoji "${dup.emoji}" used by: ${dup.structures.join(", ")}`
        )
        .join("\n");
      expect.fail(`Found duplicate emojis within categories:\n${message}`);
    }

    expect(duplicates).toHaveLength(0);
  });

  it("should have all structures with valid categories", () => {
    const validCategories = categories.map((cat) => cat.id);
    
    structures.forEach((structure) => {
      expect(validCategories).toContain(structure.category);
    });
  });

  it("should have unique structure IDs", () => {
    const ids = structures.map((s) => s.id);
    const uniqueIds = new Set(ids);
    
    expect(ids.length).toBe(uniqueIds.size);
  });

  it("should have all structures with non-empty names and descriptions", () => {
    structures.forEach((structure) => {
      expect(structure.name).toBeTruthy();
      expect(structure.name.length).toBeGreaterThan(0);
      expect(structure.description).toBeTruthy();
      expect(structure.description.length).toBeGreaterThan(0);
    });
  });

  it("should have all structures with at least one material", () => {
    structures.forEach((structure) => {
      expect(structure.materials).toBeTruthy();
      expect(structure.materials.length).toBeGreaterThan(0);
    });
  });
});
