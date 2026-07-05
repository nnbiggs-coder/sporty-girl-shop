import { createServiceClient } from "@/lib/supabase/server";

export async function getListingDetails(listingId: string) {
  const supabase = await createServiceClient();

  const { data: listing, error } = await supabase
    .from("listings")
    .select("*, category:categories(name, slug, fee_tier, requires_safety_disclosure)")
    .eq("id", listingId)
    .single();

  if (error || !listing) {
    return { error: "Listing not found", listing_id: listingId };
  }

  const { data: disclosure } = await supabase
    .from("safety_disclosures")
    .select("*")
    .eq("listing_id", listingId)
    .order("disclosed_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const category = listing.category as {
    name: string;
    slug: string;
    fee_tier: string;
    requires_safety_disclosure: boolean;
  } | null;

  return {
    id: listing.id,
    title: listing.title,
    brand: listing.brand,
    sport: listing.sport,
    size: listing.size,
    price: listing.price,
    status: listing.status,
    url: `/listings/${listing.id}`,
    category,
    condition_scorecard: {
      condition_tier: listing.condition_tier,
      visible_wear_notes: listing.ai_notes,
      flagged_concerns: listing.flagged_concerns ?? [],
      disclaimer:
        "Cosmetic/visible-wear assessment only. NOT a safety inspection or authenticity certification.",
      generated_at: listing.ai_scorecard_generated_at,
    },
    suggested_price_range: {
      min: listing.suggested_price_min,
      max: listing.suggested_price_max,
    },
    safety_disclosure: category?.requires_safety_disclosure
      ? {
          required: true,
          seller_answers: listing.safety_disclosure ?? disclosure ?? null,
          relay_instruction:
            "Quote these seller disclosure answers when asked about safety. State clearly you cannot confirm structural safety beyond what the seller disclosed.",
        }
      : { required: false },
  };
}
