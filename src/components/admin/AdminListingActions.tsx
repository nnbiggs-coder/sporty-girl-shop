"use client";

import { Button } from "@/components/ui/Button";
import { useRouter } from "next/navigation";
import type { ListingStatus } from "@/types";

interface AdminListingActionsProps {
  listingId: string;
  currentStatus: ListingStatus;
}

export function AdminListingActions({ listingId, currentStatus }: AdminListingActionsProps) {
  const router = useRouter();

  async function updateListing(updates: Record<string, unknown>) {
    const res = await fetch("/api/admin/listings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ listingId, ...updates }),
    });
    if (res.ok) router.refresh();
  }

  return (
    <div className="flex gap-1">
      {currentStatus === "live" && (
        <Button size="sm" variant="ghost" onClick={() => updateListing({ status: "removed" })}>
          Remove
        </Button>
      )}
      {currentStatus === "removed" && (
        <Button size="sm" variant="ghost" onClick={() => updateListing({ status: "live" })}>
          Restore
        </Button>
      )}
      {currentStatus === "draft" && (
        <Button size="sm" variant="ghost" onClick={() => updateListing({ status: "live", published_at: new Date().toISOString() })}>
          Force Live
        </Button>
      )}
    </div>
  );
}
