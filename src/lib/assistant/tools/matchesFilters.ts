import type { SavedSearchFilters } from "@/types";

export function matchesListingFilters(
  listing: Record<string, unknown>,
  filters: SavedSearchFilters
): boolean {
  if (filters.sport && listing.sport !== filters.sport) return false;
  if (filters.category_id && listing.category_id !== filters.category_id) return false;
  if (filters.size && listing.size !== filters.size) return false;
  if (filters.condition_tier && listing.condition_tier !== filters.condition_tier) return false;
  if (filters.brand && listing.brand !== filters.brand) return false;
  if (filters.min_price != null && Number(listing.price) < filters.min_price) return false;
  if (filters.max_price != null && Number(listing.price) > filters.max_price) return false;
  return true;
}
