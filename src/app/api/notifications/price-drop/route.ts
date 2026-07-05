import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { sendNotificationEmail } from "@/lib/email/sendEmail";
import { appConfig } from "@/lib/config";

export async function POST(request: Request) {
  const { listingId, oldPrice, newPrice } = await request.json();

  const supabase = await createServiceClient();

  const { data: listing } = await supabase
    .from("listings")
    .select("*")
    .eq("id", listingId)
    .single();

  if (!listing) {
    return NextResponse.json({ error: "Listing not found" }, { status: 404 });
  }

  const { data: watchlistEntries } = await supabase
    .from("watchlist")
    .select("user_id")
    .eq("listing_id", listingId);

  let notified = 0;

  for (const entry of watchlistEntries ?? []) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("email")
      .eq("id", entry.user_id)
      .single();

    if (profile?.email) {
      await sendNotificationEmail("price_drop", profile.email, {
        title: listing.title,
        old_price: oldPrice,
        new_price: newPrice ?? listing.price,
        listing_url: `${appConfig.url}/listings/${listing.id}`,
      });

      await supabase.from("notifications").insert({
        user_id: entry.user_id,
        type: "price_drop",
        payload: { listing_id: listingId, old_price: oldPrice, new_price: newPrice },
        sent_at: new Date().toISOString(),
      });

      notified++;
    }
  }

  return NextResponse.json({ ok: true, notified });
}
