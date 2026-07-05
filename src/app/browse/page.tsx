import { AppLayout } from "@/components/layout/AppLayout";
import { BrowseClient } from "@/components/browse/BrowseClient";
import { createClient } from "@/lib/supabase/server";

interface BrowsePageProps {
  searchParams: Promise<{
    sport?: string;
    category?: string;
    min_price?: string;
    max_price?: string;
    size?: string;
    condition?: string;
    sort?: string;
  }>;
}

export default async function BrowsePage({ searchParams }: BrowsePageProps) {
  const params = await searchParams;
  const supabase = await createClient();

  const { data: categories } = await supabase
    .from("categories")
    .select("*")
    .order("sport")
    .order("name");

  let query = supabase
    .from("listings")
    .select("*, category:categories(*)")
    .eq("status", "live");

  if (params.sport) query = query.eq("sport", params.sport);
  if (params.category) query = query.eq("category_id", params.category);
  if (params.min_price) query = query.gte("price", parseFloat(params.min_price));
  if (params.max_price) query = query.lte("price", parseFloat(params.max_price));
  if (params.size) query = query.eq("size", params.size);
  if (params.condition) query = query.eq("condition_tier", params.condition);

  const sort = params.sort ?? "newest";
  if (sort === "price_asc") query = query.order("price", { ascending: true });
  else if (sort === "price_desc") query = query.order("price", { ascending: false });
  else query = query.order("published_at", { ascending: false });

  const { data: listings } = await query;

  const sports = [...new Set(categories?.map((c) => c.sport) ?? [])].sort();

  const { data: { user } } = await supabase.auth.getUser();
  let watchlistedIds: string[] = [];
  if (user) {
    const { data: watchlist } = await supabase
      .from("watchlist")
      .select("listing_id")
      .eq("user_id", user.id);
    watchlistedIds = watchlist?.map((w) => w.listing_id) ?? [];
  }

  return (
    <AppLayout>
      <BrowseClient
        listings={listings ?? []}
        categories={categories ?? []}
        sports={sports}
        watchlistedIds={watchlistedIds}
        filters={params}
      />
    </AppLayout>
  );
}
