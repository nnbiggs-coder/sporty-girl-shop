"use client";

import { useRouter } from "next/navigation";
import { ListingCard } from "@/components/listings/ListingCard";
import { Input, Select, Label } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { CONDITION_TIERS } from "@/lib/config";
import { createClient } from "@/lib/supabase/client";
import type { Category, Listing } from "@/types";
import { useState } from "react";

interface BrowseClientProps {
  listings: Listing[];
  categories: Category[];
  sports: string[];
  watchlistedIds: string[];
  filters: Record<string, string | undefined>;
}

export function BrowseClient({
  listings,
  categories,
  sports,
  watchlistedIds: initialWatchlisted,
  filters,
}: BrowseClientProps) {
  const router = useRouter();
  const supabase = createClient();
  const [watchlistedIds, setWatchlistedIds] = useState(initialWatchlisted);
  const [showSaveSearch, setShowSaveSearch] = useState(false);
  const [searchName, setSearchName] = useState("");

  function applyFilters(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const params = new URLSearchParams();
    for (const [key, value] of form.entries()) {
      if (value) params.set(key, String(value));
    }
    router.push(`/browse?${params.toString()}`);
  }

  async function toggleWatchlist(listingId: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push("/login");
      return;
    }

    if (watchlistedIds.includes(listingId)) {
      await supabase.from("watchlist").delete().eq("user_id", user.id).eq("listing_id", listingId);
      setWatchlistedIds((ids) => ids.filter((id) => id !== listingId));
    } else {
      await supabase.from("watchlist").insert({ user_id: user.id, listing_id: listingId });
      setWatchlistedIds((ids) => [...ids, listingId]);
      await fetch("/api/analytics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventType: "watchlist_add", userId: user.id, listingId }),
      });
    }
  }

  async function saveSearch() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push("/login");
      return;
    }

    const searchFilters = {
      sport: filters.sport,
      category_id: filters.category,
      min_price: filters.min_price ? parseFloat(filters.min_price) : undefined,
      max_price: filters.max_price ? parseFloat(filters.max_price) : undefined,
      size: filters.size,
      condition_tier: filters.condition,
    };

    await supabase.from("saved_searches").insert({
      user_id: user.id,
      name: searchName || "My Search",
      filters: searchFilters,
    });

    await fetch("/api/analytics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ eventType: "saved_search_created", userId: user.id }),
    });

    setShowSaveSearch(false);
    setSearchName("");
    router.push("/saved-searches");
  }

  const filteredCategories = filters.sport
    ? categories.filter((c) => c.sport === filters.sport)
    : categories;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="flex flex-col gap-8 lg:flex-row">
        <aside className="lg:w-64 shrink-0">
          <form onSubmit={applyFilters} className="space-y-4 rounded-xl border border-border bg-surface p-5">
            <h2 className="font-semibold text-text">Filters</h2>

            <div>
              <Label htmlFor="sport">Sport</Label>
              <Select id="sport" name="sport" defaultValue={filters.sport ?? ""} className="mt-1">
                <option value="">All Sports</option>
                {sports.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </Select>
            </div>

            <div>
              <Label htmlFor="category">Category</Label>
              <Select id="category" name="category" defaultValue={filters.category ?? ""} className="mt-1">
                <option value="">All Categories</option>
                {filteredCategories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </Select>
            </div>

            <div>
              <Label htmlFor="condition">Condition</Label>
              <Select id="condition" name="condition" defaultValue={filters.condition ?? ""} className="mt-1">
                <option value="">Any Condition</option>
                {CONDITION_TIERS.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </Select>
            </div>

            <div>
              <Label htmlFor="size">Size</Label>
              <Input id="size" name="size" defaultValue={filters.size ?? ""} placeholder="e.g. 7, M, 17&quot;" className="mt-1" />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label htmlFor="min_price">Min $</Label>
                <Input id="min_price" name="min_price" type="number" defaultValue={filters.min_price ?? ""} className="mt-1" />
              </div>
              <div>
                <Label htmlFor="max_price">Max $</Label>
                <Input id="max_price" name="max_price" type="number" defaultValue={filters.max_price ?? ""} className="mt-1" />
              </div>
            </div>

            <div>
              <Label htmlFor="sort">Sort</Label>
              <Select id="sort" name="sort" defaultValue={filters.sort ?? "newest"} className="mt-1">
                <option value="newest">Newest</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
              </Select>
            </div>

            <Button type="submit" className="w-full">Apply Filters</Button>
          </form>

          <Button
            variant="outline"
            className="w-full mt-3"
            onClick={() => setShowSaveSearch(true)}
          >
            Save This Search
          </Button>
        </aside>

        <div className="flex-1">
          <div className="flex items-center justify-between">
            <p className="text-sm text-text-muted">{listings.length} listings</p>
          </div>

          {listings.length > 0 ? (
            <div className="mt-6 grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-3">
              {listings.map((listing) => (
                <ListingCard
                  key={listing.id}
                  listing={listing}
                  isWatchlisted={watchlistedIds.includes(listing.id)}
                  onToggleWatchlist={toggleWatchlist}
                />
              ))}
            </div>
          ) : (
            <div className="mt-12 text-center py-16">
              <p className="text-text-muted">No listings match your filters.</p>
            </div>
          )}
        </div>
      </div>

      {showSaveSearch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-xl bg-surface p-6 border border-border">
            <h3 className="font-semibold text-text">Save Search</h3>
            <Input
              value={searchName}
              onChange={(e) => setSearchName(e.target.value)}
              placeholder="Search name (optional)"
              className="mt-3"
            />
            <div className="mt-4 flex gap-2">
              <Button onClick={saveSearch}>Save</Button>
              <Button variant="outline" onClick={() => setShowSaveSearch(false)}>Cancel</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
