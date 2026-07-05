import { createServiceClient } from "@/lib/supabase/server";

export async function getUserWatchlist(userId: string) {
  const supabase = await createServiceClient();

  const { data, error } = await supabase
    .from("watchlist")
    .select("created_at, listings(id, title, brand, price, condition_tier, status, sport, size)")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) return { error: error.message, items: [] };

  const items = (data ?? [])
    .map((w) => {
      const raw = w.listings as unknown;
      const listing = Array.isArray(raw) ? raw[0] : raw;
      if (!listing || typeof listing !== "object") return null;
      const l = listing as {
        id: string;
        title: string;
        brand: string | null;
        price: number | null;
        condition_tier: string | null;
        status: string;
        sport: string;
        size: string | null;
      };
      return l;
    })
    .filter((l): l is NonNullable<typeof l> => l != null)
    .map((l) => ({
      id: l.id,
      title: l.title,
      brand: l.brand,
      price: l.price,
      condition_tier: l.condition_tier,
      status: l.status,
      sport: l.sport,
      size: l.size,
      url: `/listings/${l.id}`,
    }));

  return { count: items.length, items };
}
