import { describe, expect, it } from "vitest";
import { shorten } from "./shorten.js";

describe("shorten", () => {
  it("leaves a short definition alone", () => {
    expect(shorten("An unplanned fortunate discovery.", 150)).toBe("An unplanned fortunate discovery.");
  });

  it("keeps only the first sentence", () => {
    const s = "A fruit that grows on trees and is often red. It is also used in pies and ciders.";
    expect(shorten(s, 150)).toBe("A fruit that grows on trees and is often red.");
  });

  it("stops at a clause break instead of mid-thought", () => {
    const long =
      "A market activity in which a security, commodity, currency or other tradable item is bought in one market and sold simultaneously in another, in order to profit from a difference in price.";
    const out = shorten(long, 150);
    expect(out).toBe(
      "A market activity in which a security, commodity, currency or other tradable item is bought in one market and sold simultaneously in another.",
    );
    expect(out.length).toBeLessThanOrEqual(150);
  });

  it("cuts at a dash in an encyclopedia lead", () => {
    const wiki =
      "Arbitrage is the practice of taking advantage of a difference in prices in two or more markets – striking a combination of matching deals to capitalize on the difference, the profit being the difference between the market prices.";
    expect(shorten(wiki, 180)).toBe("Arbitrage is the practice of taking advantage of a difference in prices in two or more markets.");
  });

  it("falls back to a word boundary with an ellipsis when there is no clause break", () => {
    const flat = "word ".repeat(60).trim() + ".";
    const out = shorten(flat, 60);
    expect(out.endsWith("…")).toBe(true);
    expect(out.length).toBeLessThanOrEqual(61);
  });

  it("does not turn an abbreviation stub into the whole answer", () => {
    expect(shorten("Mr. Smith goes to Washington to argue his case before the senate.", 150)).toContain("Smith");
  });
});
