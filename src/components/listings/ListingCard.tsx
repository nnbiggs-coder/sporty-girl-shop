"use client";

import Image from "next/image";
import Link from "next/link";
import { Heart } from "lucide-react";
import { ConditionBadge } from "@/components/ui/ConditionBadge";
import { formatPrice } from "@/lib/utils";
import type { Listing } from "@/types";
import { cn } from "@/lib/utils";

interface ListingCardProps {
  listing: Listing;
  isWatchlisted?: boolean;
  onToggleWatchlist?: (listingId: string) => void;
}

export function ListingCard({ listing, isWatchlisted, onToggleWatchlist }: ListingCardProps) {
  const primaryPhoto = listing.photos?.[0]?.url;

  return (
    <div className="group relative">
      <Link href={`/listings/${listing.id}`} className="block">
        <div className="relative aspect-[3/4] overflow-hidden rounded-xl bg-surface-muted">
          {primaryPhoto ? (
            <Image
              src={primaryPhoto}
              alt={listing.title}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              sizes="(max-width: 768px) 50vw, 25vw"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-text-muted text-sm">
              No photo
            </div>
          )}
          {listing.condition_tier && (
            <div className="absolute left-3 top-3">
              <ConditionBadge tier={listing.condition_tier} />
            </div>
          )}
        </div>
        <div className="mt-3 space-y-1">
          {listing.brand && (
            <p className="text-xs font-medium uppercase tracking-wider text-text-muted">
              {listing.brand}
            </p>
          )}
          <h3 className="text-sm font-medium text-text line-clamp-2">{listing.title}</h3>
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-text">{formatPrice(listing.price)}</p>
            {listing.size && (
              <p className="text-xs text-text-muted">Size {listing.size}</p>
            )}
          </div>
        </div>
      </Link>
      {onToggleWatchlist && (
        <button
          onClick={(e) => {
            e.preventDefault();
            onToggleWatchlist(listing.id);
          }}
          className="absolute right-3 top-3 rounded-full bg-white/90 p-2 shadow-sm backdrop-blur-sm transition-colors hover:bg-white"
          aria-label={isWatchlisted ? "Remove from watchlist" : "Add to watchlist"}
        >
          <Heart
            className={cn(
              "h-4 w-4 transition-colors",
              isWatchlisted ? "fill-red-500 text-red-500" : "text-text-muted"
            )}
          />
        </button>
      )}
    </div>
  );
}
