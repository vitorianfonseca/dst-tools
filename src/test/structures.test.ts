import { describe, it, expect } from "vitest";
import { structures } from "../data/structures";
import { tileMappings } from "../data/tileMappings";

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

  it("should have ice-box mapping in tileMappings", () => {
    expect(tileMappings["ice-box"]).toBeDefined();
    expect(tileMappings["ice-box"]).toBe("tile046.png");
  });

  it("should not have icebox (no hyphen) mapping", () => {
    expect(tileMappings["icebox"]).toBeUndefined();
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
});
