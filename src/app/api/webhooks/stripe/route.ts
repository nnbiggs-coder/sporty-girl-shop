import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { getStripe } from "@/lib/stripe";
import { stripeConfig } from "@/lib/config";
import { trackEvent } from "@/lib/analytics/trackEvent";
import { sendNotificationEmail } from "@/lib/email/sendEmail";
import { appConfig } from "@/lib/config";

export async function POST(request: Request) {
  const body = await request.text();
  const sig = request.headers.get("stripe-signature");

  if (!sig || !stripeConfig.webhookSecret) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event;
  try {
    const stripe = getStripe();
    event = stripe.webhooks.constructEvent(body, sig, stripeConfig.webhookSecret);
  } catch (err) {
    console.error("[webhook] Signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const transactionId = session.metadata?.transaction_id;
    const listingId = session.metadata?.listing_id;

    if (!transactionId || !listingId) {
      return NextResponse.json({ received: true });
    }

    const supabase = await createServiceClient();

    const { data: transaction } = await supabase
      .from("transactions")
      .update({ status: "completed" })
      .eq("id", transactionId)
      .select("*, seller:profiles!transactions_seller_id_fkey(*)")
      .single();

    await supabase
      .from("listings")
      .update({ status: "sold" })
      .eq("id", listingId);

    const { data: listing } = await supabase
      .from("listings")
      .select("*, category:categories(*)")
      .eq("id", listingId)
      .single();

    if (transaction && listing) {
      await trackEvent({
        eventType: "listing_sold",
        listingId,
        categoryId: listing.category_id,
        userId: transaction.seller_id,
      });

      await trackEvent({
        eventType: "purchase_completed",
        userId: transaction.buyer_id,
        listingId,
        categoryId: listing.category_id,
        metadata: {
          platform_fee: transaction.platform_fee,
          fee_tier: listing.fee_tier,
          sale_price: transaction.sale_price,
        },
      });

      if (transaction.seller?.email) {
        await sendNotificationEmail("sold", transaction.seller.email, {
          title: listing.title,
          sale_price: transaction.sale_price,
          payout_amount: transaction.payout_amount,
          dashboard_url: `${appConfig.url}/dashboard`,
        });

        await supabase.from("notifications").insert({
          user_id: transaction.seller_id,
          type: "sold",
          payload: { listing_id: listingId, title: listing.title },
          sent_at: new Date().toISOString(),
        });
      }

      // Notify watchlist users of price drop isn't needed on sold, but check saved searches handled on publish
    }
  }

  return NextResponse.json({ received: true });
}
