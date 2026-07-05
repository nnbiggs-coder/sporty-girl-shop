"use client";

import { useState } from "react";
import { Heart } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";

interface WatchlistButtonProps {
  listingId: string;
  initialWatchlisted: boolean;
}

export function WatchlistButton({ listingId, initialWatchlisted }: WatchlistButtonProps) {
  const [watchlisted, setWatchlisted] = useState(initialWatchlisted);
  const supabase = createClient();
  const router = useRouter();

  async function toggle() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push("/login");
      return;
    }

    if (watchlisted) {
      await supabase.from("watchlist").delete().eq("user_id", user.id).eq("listing_id", listingId);
      setWatchlisted(false);
    } else {
      await supabase.from("watchlist").insert({ user_id: user.id, listing_id: listingId });
      setWatchlisted(true);
      await fetch("/api/analytics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventType: "watchlist_add", userId: user.id, listingId }),
      });
    }
  }

  return (
    <button
      onClick={toggle}
      className="flex items-center gap-2 rounded-full border border-border px-5 py-2.5 text-sm font-medium hover:bg-surface-muted transition-colors"
    >
      <Heart className={cn("h-4 w-4", watchlisted ? "fill-red-500 text-red-500" : "text-text-muted")} />
      {watchlisted ? "Saved" : "Save"}
    </button>
  );
}
