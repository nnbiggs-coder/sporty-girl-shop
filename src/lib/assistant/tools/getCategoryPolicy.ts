import { createServiceClient } from "@/lib/supabase/server";
import { CONDITION_TIERS, feeConfig } from "@/lib/config";
import { getPlatformFeePercent } from "@/lib/fees/calculateFees";

export interface GetCategoryPolicyParams {
  category_slug?: string;
  category_name?: string;
}

export async function getCategoryPolicy(params: GetCategoryPolicyParams) {
  const supabase = await createServiceClient();

  let query = supabase.from("categories").select("*");

  if (params.category_slug) {
    query = query.eq("slug", params.category_slug);
  } else if (params.category_name) {
    query = query.ilike("name", `%${params.category_name}%`);
  } else {
    return { error: "Provide category_slug or category_name" };
  }

  const { data: categories, error } = await query.limit(3);

  if (error) return { error: error.message };
  if (!categories?.length) {
    return { error: "Category not found", categories: [] };
  }

  const { data: feeRows } = await supabase.from("fee_config").select("*");

  const policies = categories.map((cat) => {
    const feeRow = feeRows?.find((f) => f.fee_tier === cat.fee_tier);
    const platformFeePercent = getPlatformFeePercent(cat.fee_tier);

    return {
      slug: cat.slug,
      name: cat.name,
      sport: cat.sport,
      fee_tier: cat.fee_tier,
      platform_fee_percent: platformFeePercent,
      fee_config_description: feeRow?.description ?? null,
      requires_safety_disclosure: cat.requires_safety_disclosure,
      safety_disclosure_note: cat.requires_safety_disclosure
        ? "Sellers must complete a separate safety disclosure checklist (impact/crash history, structural damage) before listing. This is independent of the AI cosmetic condition scorecard."
        : "No additional safety disclosure checklist required for this category.",
      condition_tiers: CONDITION_TIERS.map((tier) => ({
        tier,
        definition:
          tier === "Pristine"
            ? "Like new, no visible wear"
            : tier === "Excellent"
              ? "Minimal visible wear"
              : tier === "Very Good"
                ? "Light visible wear, presents well"
                : "Noticeable wear but usable",
      })),
      buyer_processing_fee_note: `Payment processing (${feeConfig.processingFeePercent}% + $${feeConfig.processingFeeFlat}) is passed through to buyers at checkout.`,
      scorecard_disclaimer:
        "AI condition scorecards assess visible/cosmetic wear only — not safety inspection or authenticity certification.",
    };
  });

  return { categories: policies };
}
