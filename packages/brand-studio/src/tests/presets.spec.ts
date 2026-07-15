import { compileBrandProject } from "@lemn-ltd/brand-contract";
import { describe, expect, it } from "vitest";
import { brandPresets, createBrandFromPreset } from "../presets.js";

describe("original Brand Studio presets", () => {
  it("ships fifteen original, uniquely named presets", () => {
    expect(brandPresets).toHaveLength(15);
    expect(new Set(brandPresets.map((preset) => preset.id)).size).toBe(15);
    expect(brandPresets.every((preset) => !/apple|cloudflare|github|codex/i.test(preset.name))).toBe(true);
  });

  it.each(brandPresets.map((preset) => [preset.id]))("compiles %s for light and dark without blocking diagnostics", async (presetId) => {
    const result = await compileBrandProject(createBrandFromPreset(presetId));
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(Object.keys(result.artifact.scopes)).toEqual(["core/light", "core/dark"]);
    expect(result.diagnostics.filter((diagnostic) => diagnostic.severity === "error")).toEqual([]);
  });
});
