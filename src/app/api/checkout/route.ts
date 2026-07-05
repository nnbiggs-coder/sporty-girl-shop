import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { getStripe, calculateStripeTax } from "@/lib/stripe";
import { calculateFees } from "@/lib/fees/calculateFees";
import { appConfig } from "@/lib/config";
import { trackEvent } from "@/lib/analytics/trackEvent";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { listingId } = await request.json();

  const { data: listing } = await supabase
    .from("listings")
    .select("*, category:categories(*), seller:profiles(*)")
    .eq("id", listingId)
    .eq("status", "live")
    .single();

  if (!listing) {
    return NextResponse.json({ error: "Listing not available" }, { status: 404 });
  }

  if (listing.seller_id === user.id) {
    return NextResponse.json({ error: "Cannot buy your own listing" }, { status: 400 });
  }

  const salePrice = Number(listing.price);
  const feeTier = listing.fee_tier ?? listing.category?.fee_tier ?? "commodity";

  // Stripe Tax integration point (Section 11)
  const taxAmount = await calculateStripeTax({ amount: salePrice });
  const fees = calculateFees(salePrice, feeTier, taxAmount);

  const serviceClient = await createServiceClient();

  const { data: transaction, error: txError } = await serviceClient
    .from("transactions")
    .insert({
      listing_id: listingId,
      buyer_id: user.id,
      seller_id: listing.seller_id,
      sale_price: salePrice,
      platform_fee: fees.platformFee,
      processing_fee: fees.processingFee,
      tax_amount: taxAmount,
      payout_amount: fees.sellerPayout,
      status: "pending",
      dispute_status: "none",
    })
    .select()
    .single();

  if (txError) {
    return NextResponse.json({ error: txError.message }, { status: 500 });
  }

  try {
    const stripe = getStripe();

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: user.email,
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: listing.title,
              description: `${listing.brand ?? ""} ${listing.category?.name ?? ""}`.trim(),
            },
            unit_amount: Math.round(salePrice * 100),
          },
          quantity: 1,
        },
        {
          price_data: {
            currency: "usd",
            product_data: { name: "Payment Processing Fee" },
            unit_amount: Math.round(fees.processingFee * 100),
          },
          quantity: 1,
        },
        ...(taxAmount > 0
          ? [{
              price_data: {
                currency: "usd",
                product_data: { name: "Sales Tax" },
                unit_amount: Math.round(taxAmount * 100),
              },
              quantity: 1,
            }]
          : []),
      ],
      payment_intent_data: {
        metadata: {
          transaction_id: transaction.id,
          listing_id: listingId,
          seller_id: listing.seller_id,
        },
        ...(listing.seller?.stripe_connect_account_id
          ? {
              application_fee_amount: Math.round(fees.platformFee * 100),
              transfer_data: {
                destination: listing.seller.stripe_connect_account_id,
              },
            }
          : {}),
      },
      metadata: {
        transaction_id: transaction.id,
        listing_id: listingId,
      },
      success_url: `${appConfig.url}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appConfig.url}/listings/${listingId}`,
      automatic_tax: { enabled: true },
    });

    await serviceClient
      .from("transactions")
      .update({ stripe_payment_intent_id: session.payment_intent as string })
      .eq("id", transaction.id);

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("[checkout]", err);
    return NextResponse.json(
      { error: "Stripe not configured. See SETUP.md to add test keys." },
      { status: 503 }
    );
  }
}
