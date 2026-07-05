import Link from "next/link";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/Button";
import { createClient } from "@/lib/supabase/server";
import { ListingCard } from "@/components/listings/ListingCard";
import type { Listing } from "@/types";
import { appConfig } from "@/lib/config";

export default async function HomePage() {
  const supabase = await createClient();
  const { data: listings } = await supabase
    .from("listings")
    .select("*, category:categories(*)")
    .eq("status", "live")
    .order("published_at", { ascending: false })
    .limit(8);

  return (
    <AppLayout>
      <section className="bg-surface">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 text-center">
          <h1 className="text-4xl font-bold tracking-tight text-text sm:text-5xl">
            Premium Sports Resale
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-text-muted">
            Buy and sell girls&apos; and women&apos;s sports equipment with AI-powered
            condition grading and fair pricing. No haggling — just great gear.
          </p>
          <div className="mt-8 flex items-center justify-center gap-4">
            <Link href="/browse">
              <Button size="lg">Shop Now</Button>
            </Link>
            <Link href="/sell">
              <Button variant="outline" size="lg">Sell Your Gear</Button>
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold text-text">Latest Listings</h2>
          <Link href="/browse" className="text-sm font-medium text-brand-600 hover:text-brand-700">
            View all →
          </Link>
        </div>

        {listings && listings.length > 0 ? (
          <div className="mt-8 grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-3 lg:grid-cols-4">
            {(listings as Listing[]).map((listing) => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
        ) : (
          <div className="mt-12 text-center py-16 bg-surface rounded-2xl border border-border">
            <p className="text-text-muted">No listings yet. Be the first to sell on {appConfig.name}!</p>
            <Link href="/sell" className="mt-4 inline-block">
              <Button>List an Item</Button>
            </Link>
          </div>
        )}
      </section>

      <section className="bg-surface border-t border-border">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
          <h2 className="text-2xl font-semibold text-text text-center">How It Works</h2>
          <div className="mt-12 grid gap-8 md:grid-cols-3">
            <div className="text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-brand-100 text-brand-600 font-bold">1</div>
              <h3 className="mt-4 font-medium text-text">Snap & Upload</h3>
              <p className="mt-2 text-sm text-text-muted">Take photos using our guided template — front, back, label, and wear close-up.</p>
            </div>
            <div className="text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-brand-100 text-brand-600 font-bold">2</div>
              <h3 className="mt-4 font-medium text-text">AI Condition Grade</h3>
              <p className="mt-2 text-sm text-text-muted">Our AI assesses visible wear and suggests a fair price based on comparable sales.</p>
            </div>
            <div className="text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-brand-100 text-brand-600 font-bold">3</div>
              <h3 className="mt-4 font-medium text-text">Approve & Go Live</h3>
              <p className="mt-2 text-sm text-text-muted">Review your scorecard, set your price, and your listing goes live instantly.</p>
            </div>
          </div>
        </div>
      </section>
    </AppLayout>
  );
}
