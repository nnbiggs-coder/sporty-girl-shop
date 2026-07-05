"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import type { SavedSearch, SavedSearchFilters } from "@/types";

export default function SavedSearchesPage() {
  const supabase = createClient();
  const [searches, setSearches] = useState<SavedSearch[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        window.location.href = "/login?redirect=/saved-searches";
        return;
      }
      const { data } = await supabase
        .from("saved_searches")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      setSearches(data ?? []);
      setLoading(false);
    }
    load();
  }, [supabase]);

  async function deleteSearch(id: string) {
    await supabase.from("saved_searches").delete().eq("id", id);
    setSearches((s) => s.filter((search) => search.id !== id));
  }

  function buildBrowseUrl(filters: SavedSearchFilters) {
    const params = new URLSearchParams();
    if (filters.sport) params.set("sport", filters.sport);
    if (filters.category_id) params.set("category", filters.category_id);
    if (filters.min_price) params.set("min_price", String(filters.min_price));
    if (filters.max_price) params.set("max_price", String(filters.max_price));
    if (filters.size) params.set("size", filters.size);
    if (filters.condition_tier) params.set("condition", filters.condition_tier);
    return `/browse?${params.toString()}`;
  }

  return (
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        <h1 className="text-2xl font-semibold text-text">Saved Searches</h1>
        <p className="mt-1 text-sm text-text-muted">
          Get notified when new listings match your criteria
        </p>

        {loading ? (
          <p className="mt-8 text-text-muted">Loading...</p>
        ) : searches.length > 0 ? (
          <ul className="mt-8 space-y-4">
            {searches.map((search) => (
              <li key={search.id} className="rounded-xl border border-border bg-surface p-4 flex items-center justify-between">
                <div>
                  <p className="font-medium text-text">{search.name ?? "Saved Search"}</p>
                  <p className="text-xs text-text-muted mt-1">
                    {formatFilters(search.filters)}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Link href={buildBrowseUrl(search.filters)}>
                    <Button variant="outline" size="sm">View</Button>
                  </Link>
                  <Button variant="ghost" size="sm" onClick={() => deleteSearch(search.id)}>Delete</Button>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="mt-12 text-center py-16">
            <p className="text-text-muted">No saved searches yet.</p>
            <Link href="/browse" className="mt-4 inline-block">
              <Button variant="outline">Browse & Save a Search</Button>
            </Link>
          </div>
        )}
      </div>
  );
}

function formatFilters(filters: SavedSearchFilters): string {
  const parts: string[] = [];
  if (filters.sport) parts.push(filters.sport);
  if (filters.condition_tier) parts.push(filters.condition_tier);
  if (filters.size) parts.push(`Size ${filters.size}`);
  if (filters.min_price || filters.max_price) {
    parts.push(`$${filters.min_price ?? 0}–$${filters.max_price ?? "∞"}`);
  }
  return parts.join(" · ") || "All listings";
}
