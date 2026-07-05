import { createServiceClient } from "@/lib/supabase/server";
import type { AnalyticsEventName } from "@/types";

interface TrackEventParams {
  eventType: AnalyticsEventName;
  userId?: string;
  listingId?: string;
  categoryId?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Basic event logging for Section 10 success metrics.
 * Metrics derived from these events:
 * 1. Repeat seller rate — listing_created/published by same user_id
 * 2. Sell-through rate — listing_sold / listing_published by category
 * 3. Dispute/return rate — dispute_flagged / purchase_completed
 * 4. Organic growth — organic_signup vs paid_signup
 * 5. Contribution margin — purchase_completed metadata (platform_fee, fee_tier)
 */
export async function trackEvent(params: TrackEventParams): Promise<void> {
  try {
    const supabase = await createServiceClient();
    await supabase.from("analytics_events").insert({
      event_type: params.eventType,
      user_id: params.userId ?? null,
      listing_id: params.listingId ?? null,
      category_id: params.categoryId ?? null,
      metadata: params.metadata ?? {},
    });
  } catch (err) {
    console.error("[analytics] Failed to track event:", params.eventType, err);
  }
}

export async function getMetricsSummary() {
  const supabase = await createServiceClient();

  const { data: events } = await supabase
    .from("analytics_events")
    .select("*")
    .order("created_at", { ascending: false });

  if (!events) return null;

  const published = events.filter((e) => e.event_type === "listing_published");
  const sold = events.filter((e) => e.event_type === "listing_sold");
  const purchases = events.filter((e) => e.event_type === "purchase_completed");
  const disputes = events.filter((e) => e.event_type === "dispute_flagged");
  const organic = events.filter((e) => e.event_type === "organic_signup");
  const paid = events.filter((e) => e.event_type === "paid_signup");

  const sellerCounts = new Map<string, number>();
  published.forEach((e) => {
    if (e.user_id) {
      sellerCounts.set(e.user_id, (sellerCounts.get(e.user_id) ?? 0) + 1);
    }
  });
  const repeatSellers = [...sellerCounts.values()].filter((c) => c > 1).length;
  const totalSellers = sellerCounts.size;

  const marginByTier: Record<string, { revenue: number; count: number }> = {};
  purchases.forEach((e) => {
    const tier = (e.metadata as Record<string, unknown>)?.fee_tier as string ?? "unknown";
    const fee = Number((e.metadata as Record<string, unknown>)?.platform_fee ?? 0);
    if (!marginByTier[tier]) marginByTier[tier] = { revenue: 0, count: 0 };
    marginByTier[tier].revenue += fee;
    marginByTier[tier].count += 1;
  });

  return {
    repeatSellerRate: totalSellers > 0 ? repeatSellers / totalSellers : 0,
    sellThroughRate: published.length > 0 ? sold.length / published.length : 0,
    disputeRate: purchases.length > 0 ? disputes.length / purchases.length : 0,
    organicGrowthRatio:
      organic.length + paid.length > 0
        ? organic.length / (organic.length + paid.length)
        : 0,
    contributionMarginByTier: marginByTier,
    rawCounts: {
      published: published.length,
      sold: sold.length,
      purchases: purchases.length,
      disputes: disputes.length,
      organicSignups: organic.length,
      paidSignups: paid.length,
    },
  };
}
