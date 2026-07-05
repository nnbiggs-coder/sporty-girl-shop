import { AppLayout } from "@/components/layout/AppLayout";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Image from "next/image";
import { ConditionBadge } from "@/components/ui/ConditionBadge";
import { formatPrice } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import type { ConditionTier } from "@/lib/config";
import { WatchlistButton } from "@/components/listings/WatchlistButton";
import { BuyButton } from "@/components/checkout/BuyButton";

interface ListingPageProps {
  params: Promise<{ id: string }>;
}

export default async function ListingPage({ params }: ListingPageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: listing } = await supabase
    .from("listings")
    .select("*, category:categories(*), seller:profiles(id, name, email)")
    .eq("id", id)
    .single();

  if (!listing || (listing.status !== "live" && listing.status !== "sold")) {
    redirect("/browse");
  }

  const { data: { user } } = await supabase.auth.getUser();
  let isWatchlisted = false;
  if (user) {
    const { data: wl } = await supabase
      .from("watchlist")
      .select("*")
      .eq("user_id", user.id)
      .eq("listing_id", id)
      .single();
    isWatchlisted = !!wl;
  }

  const isOwner = user?.id === listing.seller_id;
  const isSold = listing.status === "sold";

  return (
    <AppLayout>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <div className="grid gap-8 lg:grid-cols-2">
          <div className="space-y-4">
            {listing.photos?.length > 0 ? (
              listing.photos.map((photo: { key: string; url: string }, i: number) => (
                <div key={i} className="relative aspect-square overflow-hidden rounded-xl bg-surface-muted">
                  <Image src={photo.url} alt={`${listing.title} - ${photo.key}`} fill className="object-cover" />
                </div>
              ))
            ) : (
              <div className="aspect-square rounded-xl bg-surface-muted flex items-center justify-center text-text-muted">
                No photos
              </div>
            )}
          </div>

          <div>
            {listing.brand && (
              <p className="text-sm font-medium uppercase tracking-wider text-text-muted">{listing.brand}</p>
            )}
            <h1 className="mt-1 text-2xl font-semibold text-text">{listing.title}</h1>

            <div className="mt-4 flex items-center gap-3">
              {listing.condition_tier && (
                <ConditionBadge tier={listing.condition_tier as ConditionTier} />
              )}
              {listing.size && (
                <span className="text-sm text-text-muted">Size {listing.size}</span>
              )}
              {isSold && (
                <span className="rounded-full bg-gray-100 px-3 py-0.5 text-xs font-medium text-gray-600">Sold</span>
              )}
            </div>

            <p className="mt-4 text-3xl font-bold text-text">{formatPrice(listing.price)}</p>

            {listing.ai_notes && (
              <div className="mt-6 rounded-xl border border-border p-4">
                <p className="text-xs font-medium uppercase tracking-wider text-text-muted">Condition Notes</p>
                <p className="mt-2 text-sm text-text">{listing.ai_notes}</p>
                <p className="mt-2 text-xs text-text-muted">
                  Cosmetic assessment only — not a safety inspection or authenticity certification.
                </p>
              </div>
            )}

            <div className="mt-6 flex gap-3">
              {!isOwner && !isSold && user && (
                <>
                  <BuyButton listingId={listing.id} price={listing.price!} />
                  <WatchlistButton listingId={listing.id} initialWatchlisted={isWatchlisted} />
                </>
              )}
              {!isOwner && !isSold && !user && (
                <Link href="/login">
                  <Button>Sign in to Buy</Button>
                </Link>
              )}
            </div>

            <dl className="mt-8 space-y-2 text-sm border-t border-border pt-6">
              <div className="flex justify-between">
                <dt className="text-text-muted">Sport</dt>
                <dd className="text-text">{listing.sport}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-text-muted">Category</dt>
                <dd className="text-text">{listing.category?.name}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-text-muted">Listed</dt>
                <dd className="text-text">{new Date(listing.published_at ?? listing.created_at).toLocaleDateString()}</dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
