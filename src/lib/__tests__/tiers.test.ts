import { describe, expect, it } from "vitest";
import { getDefaultTierPercent } from "@/lib/tiers";

describe("getDefaultTierPercent", () => {
  it("maps each referred type to its tier", () => {
    expect(getDefaultTierPercent("GENERATOR")).toBe(5);
    expect(getDefaultTierPercent("HOST")).toBe(7);
    expect(getDefaultTierPercent("BUILDER")).toBe(10);
  });

  it("returns null when referred type is unknown", () => {
    expect(getDefaultTierPercent(null)).toBeNull();
    expect(getDefaultTierPercent(undefined)).toBeNull();
  });
});
