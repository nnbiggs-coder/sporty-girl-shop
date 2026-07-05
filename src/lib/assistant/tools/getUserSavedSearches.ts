import { createServiceClient } from "@/lib/supabase/server";
import type { SavedSearchFilters } from "@/types";
import { matchesListingFilters } from "./matchesFilters";

export async function getUserSavedSearches(userId: string) {
  const supabase = await createServiceClient();

  const { data: searches, error } = await supabase
    .from("saved_searches")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) return { error: error.message, saved_searches: [] };

  const { data: liveListings } = await supabase
    .from("listings")
    .select("id, title, brand, sport, size, price, condition_tier, category_id, published_at")
    .eq("status", "live");

  const results = (searches ?? []).map((search) => {
    const filters = search.filters as SavedSearchFilters;
    const matches = (liveListings ?? []).filter((listing) =>
      matchesListingFilters(listing, filters)
    );

    const sinceLastNotify = search.last_notified_at
      ? matches.filter((l) => l.published_at && l.published_at > search.last_notified_at!)
      : matches;

    return {
      id: search.id,
      name: search.name ?? "Saved Search",
      filters,
      last_notified_at: search.last_notified_at,
      current_match_count: matches.length,
      new_since_last_notify_count: sinceLastNotify.length,
      sample_matches: matches.slice(0, 3).map((l) => ({
        id: l.id,
        title: l.title,
        price: l.price,
        condition_tier: l.condition_tier,
        url: `/listings/${l.id}`,
      })),
    };
  });

  return { count: results.length, saved_searches: results };
}
