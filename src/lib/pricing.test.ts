import { describe, expect, it } from "vitest";
import { friendly, quote } from "./pricing";

describe("pricing", () => {
  it("rounds to .99 prices", () => {
    expect(friendly(1499)).toBe(1499);
    expect(friendly(600)).toBe(599);
    expect(friendly(10)).toBe(99);
  });

  it("charges full price in the US with a year included", () => {
    const q = quote({ usdCents: 3999, kind: "world", keepsake: "year", country: "US" });
    expect(q).toMatchObject({ baseCents: 3999, keepsakeCents: 0, totalCents: 3999 });
  });

  it("adjusts for country and adds the forever keepsake", () => {
    const q = quote({ usdCents: 3999, kind: "world", keepsake: "forever", country: "in" });
    expect(q.baseCents).toBe(1599);
    expect(q.keepsakeCents).toBe(499);
    expect(q.totalCents).toBe(2098);
    expect(q.country).toBe("IN");
  });

  it("applies the make-one-back code and ignores unknown codes", () => {
    expect(quote({ usdCents: 1499, kind: "page", keepsake: "year", discountCode: "back15" }).totalCents).toBe(1274);
    expect(quote({ usdCents: 1499, kind: "page", keepsake: "year", discountCode: "FAKE" }).totalCents).toBe(1499);
  });
});
