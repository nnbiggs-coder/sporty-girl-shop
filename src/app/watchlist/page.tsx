import { AppLayout } from "@/components/layout/AppLayout";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ListingCard } from "@/components/listings/ListingCard";
import type { Listing } from "@/types";

export default async function WatchlistPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?redirect=/watchlist");

  const { data: watchlist } = await supabase
    .from("watchlist")
    .select("listing_id, listings(*, category:categories(*))")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const listings = (watchlist ?? [])
    .map((w) => w.listings as unknown as Listing)
    .filter(Boolean);

  return (
    <AppLayout>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <h1 className="text-2xl font-semibold text-text">Watchlist</h1>
        <p className="mt-1 text-sm text-text-muted">Items you&apos;ve saved</p>

        {listings.length > 0 ? (
          <div className="mt-8 grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-3 lg:grid-cols-4">
            {listings.map((listing) => (
              <ListingCard
                key={listing.id}
                listing={listing}
                isWatchlisted={true}
              />
            ))}
          </div>
        ) : (
          <div className="mt-12 text-center py-16">
            <p className="text-text-muted">Your watchlist is empty.</p>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
