import { describe, expect, it } from "vitest";
import { defaultResurface, effectiveResurface } from "./resurface.js";

describe("defaultResurface", () => {
  it("grades words, phrases and screenshots", () => {
    expect(defaultResurface("term")).toBe("review");
    expect(defaultResurface("screenshot")).toBe("review");
  });

  it("reminds for passages and links, with no grading", () => {
    expect(defaultResurface("note")).toBe("revisit");
    expect(defaultResurface("link")).toBe("revisit");
  });
});

describe("effectiveResurface", () => {
  it("falls back to the default for the type when nothing was chosen", () => {
    expect(effectiveResurface({ capture_type: "link" })).toBe("revisit");
    expect(effectiveResurface({ capture_type: "term", resurface: null })).toBe("review");
  });

  it("respects a per-item choice", () => {
    expect(effectiveResurface({ capture_type: "link", resurface: "review" })).toBe("review");
    expect(effectiveResurface({ capture_type: "term", resurface: "keep" })).toBe("keep");
  });
});
