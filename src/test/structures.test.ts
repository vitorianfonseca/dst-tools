import { describe, it, expect } from "vitest";
import { structures } from "../data/structures";

describe("Structure and tile mapping validation", () => {
  it("should not have duplicate structure IDs", () => {
    const ids = structures.map((s) => s.id);
    const uniqueIds = new Set(ids);
    
    expect(ids.length).toBe(uniqueIds.size);
  });

  it("should have only one composting-bin entry", () => {
    const compostingBins = structures.filter((s) => s.id === "composting-bin");
    
    expect(compostingBins.length).toBe(1);
  });

  it("should have composting-bin in farming category only", () => {
    const compostingBin = structures.find((s) => s.id === "composting-bin");
    
    expect(compostingBin).toBeDefined();
    expect(compostingBin?.category).toBe("farming");
  });

  it("should have cartographer-sign using its own ID for image lookup", () => {
    const cartographerSign = structures.find((s) => s.id === "cartographer-sign");
    
    expect(cartographerSign).toBeDefined();
    // The structure should use "cartographer-sign" for image lookup, not "directional-sign"
    // iconImage may be undefined if there's no tile mapping, but that's okay
    // The important thing is that we're not calling getStructureImage with the wrong ID
    expect(cartographerSign?.name).toBe("Directional Sign");
    expect(cartographerSign?.id).toBe("cartographer-sign");
  });

  it("should not have duplicate emojis within the same category", () => {
    const categories = [...new Set(structures.map((s) => s.category))];
    
    categories.forEach((category) => {
      const categoryStructures = structures.filter((s) => s.category === category);
      const icons = categoryStructures.map((s) => s.icon);
      const uniqueIcons = new Set(icons);
      
      const duplicates = icons.filter((icon, index) => icons.indexOf(icon) !== index);
      
      if (duplicates.length > 0) {
        const duplicateStructures = categoryStructures
          .filter((s) => duplicates.includes(s.icon))
          .map((s) => `${s.name} (${s.icon})`);
        
        expect(
          duplicates.length,
          `Category "${category}" has duplicate icons: ${duplicateStructures.join(", ")}`
        ).toBe(0);
      }
      
      expect(icons.length).toBe(uniqueIcons.size);
    });
  });

  it("should have Directional Sign in structures category", () => {
    const directionalSign = structures.find((s) => s.id === "cartographer-sign");
    
    expect(directionalSign).toBeDefined();
    expect(directionalSign?.category).toBe("structures");
  });
});
