import type { ConditionTier } from "@/lib/config";

export interface ComparableListing {
  id: string;
  category_id: string;
  brand: string | null;
  title: string;
  condition_tier: ConditionTier;
  sold_price: number;
  source: string;
  source_url: string | null;
  sold_at: string | null;
}

export interface PriceSuggestion {
  min: number;
  max: number;
  suggested: number;
  comparables: ComparableListing[];
}

/**
 * Generate price suggestion from comparable_listings table (v1 — Section 5.2).
 * Does NOT call external APIs in this pass.
 */
export function suggestPriceFromComps(
  comparables: ComparableListing[],
  conditionTier?: ConditionTier | null
): PriceSuggestion | null {
  if (comparables.length === 0) return null;

  const filtered = conditionTier
    ? comparables.filter((c) => c.condition_tier === conditionTier)
    : comparables;

  const pool = filtered.length > 0 ? filtered : comparables;
  const prices = pool.map((c) => Number(c.sold_price)).sort((a, b) => a - b);

  const min = prices[0];
  const max = prices[prices.length - 1];
  const suggested = roundCurrency(prices.reduce((a, b) => a + b, 0) / prices.length);

  return { min, max, suggested, comparables: pool };
}

/**
 * Stub for future live comparable lookup (eBay, SidelineSwap, etc.).
 * Returns mock data now — swap in real API when credentials are available.
 *
 * TODO: Replace with live API integration (eBay sold listings, SidelineSwap)
 * once API credentials and rate-limit strategy are in place.
 */
export async function fetchLiveComps(
  _categorySlug: string,
  _brand?: string | null
): Promise<ComparableListing[]> {
  // Intentionally returns empty — all comps come from DB in v1.
  // When implementing: call external API, normalize results, optionally cache to comparable_listings.
  return [];
}

function roundCurrency(amount: number): number {
  return Math.round(amount * 100) / 100;
}
