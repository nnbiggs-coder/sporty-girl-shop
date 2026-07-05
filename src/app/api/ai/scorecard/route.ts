import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateConditionScorecard } from "@/lib/ai/conditionScorecard";
import { suggestPriceFromComps, fetchLiveComps } from "@/lib/pricing/suggestPrice";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { listingId, photoUrls, itemDescription } = await request.json();

  const { data: listing } = await supabase
    .from("listings")
    .select("*, category:categories(*)")
    .eq("id", listingId)
    .eq("seller_id", user.id)
    .single();

  if (!listing) {
    return NextResponse.json({ error: "Listing not found" }, { status: 404 });
  }

  const scorecard = await generateConditionScorecard(photoUrls, itemDescription);

  const { data: comps } = await supabase
    .from("comparable_listings")
    .select("*")
    .eq("category_id", listing.category_id);

  // Attempt live comps (stub returns empty in v1)
  const liveComps = await fetchLiveComps();

  const allComps = [...(comps ?? []), ...liveComps];
  const priceSuggestion = suggestPriceFromComps(allComps, scorecard.condition_tier);

  await supabase.from("listings").update({
    condition_tier: scorecard.condition_tier,
    ai_notes: scorecard.visible_wear_notes,
    flagged_concerns: scorecard.flagged_concerns,
    suggested_price_min: priceSuggestion?.min ?? null,
    suggested_price_max: priceSuggestion?.max ?? null,
    ai_scorecard_generated_at: new Date().toISOString(),
  }).eq("id", listingId);

  return NextResponse.json({ scorecard, priceSuggestion });
}
