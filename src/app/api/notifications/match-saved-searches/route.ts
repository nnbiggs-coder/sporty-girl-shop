import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { sendNotificationEmail } from "@/lib/email/sendEmail";
import { appConfig } from "@/lib/config";
import type { SavedSearchFilters } from "@/types";

export async function POST(request: Request) {
  const { listingId } = await request.json();
  if (!listingId) {
    return NextResponse.json({ error: "listingId required" }, { status: 400 });
  }

  const supabase = await createServiceClient();

  const { data: listing } = await supabase
    .from("listings")
    .select("*")
    .eq("id", listingId)
    .eq("status", "live")
    .single();

  if (!listing) {
    return NextResponse.json({ ok: true, matched: 0 });
  }

  const { data: savedSearches } = await supabase.from("saved_searches").select("*");

  let matched = 0;

  for (const search of savedSearches ?? []) {
    const filters = search.filters as SavedSearchFilters;
    if (!matchesFilters(listing, filters)) continue;

    const { data: profile } = await supabase
      .from("profiles")
      .select("email")
      .eq("id", search.user_id)
      .single();

    if (profile?.email) {
      await sendNotificationEmail("new_match", profile.email, {
        search_name: search.name ?? "Saved Search",
        title: listing.title,
        price: listing.price,
        listing_url: `${appConfig.url}/listings/${listing.id}`,
      });

      await supabase.from("notifications").insert({
        user_id: search.user_id,
        type: "new_match",
        payload: { listing_id: listing.id, search_id: search.id },
        sent_at: new Date().toISOString(),
      });

      await supabase
        .from("saved_searches")
        .update({ last_notified_at: new Date().toISOString() })
        .eq("id", search.id);

      matched++;
    }
  }

  return NextResponse.json({ ok: true, matched });
}

function matchesFilters(
  listing: Record<string, unknown>,
  filters: SavedSearchFilters
): boolean {
  if (filters.sport && listing.sport !== filters.sport) return false;
  if (filters.category_id && listing.category_id !== filters.category_id) return false;
  if (filters.size && listing.size !== filters.size) return false;
  if (filters.condition_tier && listing.condition_tier !== filters.condition_tier) return false;
  if (filters.brand && listing.brand !== filters.brand) return false;
  if (filters.min_price && Number(listing.price) < filters.min_price) return false;
  if (filters.max_price && Number(listing.price) > filters.max_price) return false;
  return true;
}
