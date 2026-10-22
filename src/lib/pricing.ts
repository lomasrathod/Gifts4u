// Honest pricing: one real price per design, adjusted for the buyer's country.
// No invented "regular" prices. Every gift includes a full year online;
// "Forever" is an optional keepsake upgrade.

export type Keepsake = "year" | "forever";

// Share of the US price charged in each country, roughly following
// purchasing power. Countries not listed pay the full price.
const COUNTRY_FACTOR: Record<string, number> = {
  IN: 0.4, PK: 0.4, BD: 0.4, NG: 0.4, EG: 0.45, ID: 0.45, PH: 0.45, VN: 0.45,
  BR: 0.55, MX: 0.55, CO: 0.55, AR: 0.55, TR: 0.55, ZA: 0.55, MY: 0.6, TH: 0.6,
  PL: 0.75, PT: 0.8, GR: 0.8, CZ: 0.8, HU: 0.75, RO: 0.7, CL: 0.65, PE: 0.6,
};

export const DISCOUNT_CODES: Record<string, { percent: number; label: string }> = {
  BACK15: { percent: 15, label: "15% off for making one back" },
};

export function countryFactor(country: string | null | undefined): number {
  if (!country) return 1;
  return COUNTRY_FACTOR[country.toUpperCase()] ?? 1;
}

/** Rounds a cent amount to a friendly price ending in .99 (minimum $1.99). */
export function friendly(cents: number): number {
  const dollars = Math.max(1, Math.round(cents / 100));
  return dollars * 100 - 1;
}

export function foreverUpgradeCents(designKind: "page" | "world"): number {
  return designKind === "world" ? 1200 : 600;
}

export type Quote = {
  baseCents: number;
  keepsakeCents: number;
  discountCents: number;
  totalCents: number;
  country: string;
  discountLabel?: string;
};

export function quote(opts: {
  usdCents: number;
  kind: "page" | "world";
  keepsake: Keepsake;
  country?: string | null;
  discountCode?: string | null;
}): Quote {
  const f = countryFactor(opts.country);
  const baseCents = friendly(opts.usdCents * f);
  const keepsakeCents = opts.keepsake === "forever" ? friendly(foreverUpgradeCents(opts.kind) * f) : 0;
  const code = opts.discountCode ? DISCOUNT_CODES[opts.discountCode.toUpperCase()] : undefined;
  const subtotal = baseCents + keepsakeCents;
  const discountCents = code ? Math.round((subtotal * code.percent) / 100) : 0;
  return {
    baseCents,
    keepsakeCents,
    discountCents,
    totalCents: subtotal - discountCents,
    country: (opts.country ?? "US").toUpperCase(),
    discountLabel: code?.label,
  };
}

export function formatUsd(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}
