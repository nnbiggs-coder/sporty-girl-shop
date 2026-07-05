import { createServiceClient } from "@/lib/supabase/server";

export interface SearchListingsParams {
  query?: string;
  sport?: string;
  category_slug?: string;
  min_price?: number;
  max_price?: number;
  size?: string;
  condition_tier?: string;
  limit?: number;
}

export async function searchListings(params: SearchListingsParams) {
  const supabase = await createServiceClient();
  const limit = Math.min(params.limit ?? 8, 20);

  let query = supabase
    .from("listings")
    .select("id, title, brand, sport, size, price, condition_tier, published_at, category:categories(name, slug)")
    .eq("status", "live")
    .order("published_at", { ascending: false })
    .limit(limit);

  if (params.sport) query = query.eq("sport", params.sport);
  if (params.size) query = query.eq("size", params.size);
  if (params.condition_tier) query = query.eq("condition_tier", params.condition_tier);
  if (params.min_price != null) query = query.gte("price", params.min_price);
  if (params.max_price != null) query = query.lte("price", params.max_price);

  if (params.category_slug) {
    const { data: cat } = await supabase
      .from("categories")
      .select("id")
      .eq("slug", params.category_slug)
      .single();
    if (cat) query = query.eq("category_id", cat.id);
    else return { listings: [], count: 0, message: `No category found for slug: ${params.category_slug}` };
  }

  const { data, error } = await query;

  if (error) return { error: error.message, listings: [], count: 0 };

  let listings = data ?? [];

  if (params.query?.trim()) {
    const q = params.query.toLowerCase();
    listings = listings.filter(
      (l) =>
        l.title?.toLowerCase().includes(q) ||
        (l.brand?.toLowerCase().includes(q) ?? false)
    );
  }

  return {
    count: listings.length,
    listings: listings.map((l) => {
      const rawCat = l.category as unknown;
      const cat = Array.isArray(rawCat) ? rawCat[0] : rawCat;
      const categoryName =
        cat && typeof cat === "object" && "name" in cat
          ? String((cat as { name: string }).name)
          : null;

      return {
        id: l.id,
        title: l.title,
        brand: l.brand,
        sport: l.sport,
        size: l.size,
        price: l.price,
        condition_tier: l.condition_tier,
        category: categoryName,
        url: `/listings/${l.id}`,
      };
    }),
  };
}
