import Stripe from "stripe";
import { stripeConfig } from "@/lib/config";

let stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!stripeConfig.secretKey) {
    throw new Error("STRIPE_SECRET_KEY is not configured");
  }
  if (!stripe) {
    stripe = new Stripe(stripeConfig.secretKey);
  }
  return stripe;
}

/**
 * Stripe Tax integration point (Section 11).
 * Calculates tax via Stripe Tax API when enabled in dashboard.
 */
export async function calculateStripeTax(params: {
  amount: number;
  currency?: string;
  customerAddress?: {
    line1: string;
    city: string;
    state: string;
    postal_code: string;
    country: string;
  };
}): Promise<number> {
  if (!params.customerAddress) return 0;

  try {
    const stripe = getStripe();
    const calculation = await stripe.tax.calculations.create({
      currency: params.currency ?? "usd",
      line_items: [
        {
          amount: Math.round(params.amount * 100),
          reference: "listing_purchase",
          tax_behavior: "exclusive",
        },
      ],
      customer_details: {
        address: params.customerAddress,
        address_source: "shipping",
      },
    });
    return calculation.tax_amount_exclusive / 100;
  } catch (err) {
    console.warn("[stripe-tax] Tax calculation unavailable:", err);
    return 0;
  }
}

export async function createConnectAccount(email: string): Promise<string> {
  const stripe = getStripe();
  const account = await stripe.accounts.create({
    type: "express",
    email,
    capabilities: {
      transfers: { requested: true },
    },
  });
  return account.id;
}

export async function createConnectOnboardingLink(
  accountId: string,
  returnUrl: string,
  refreshUrl: string
): Promise<string> {
  const stripe = getStripe();
  const link = await stripe.accountLinks.create({
    account: accountId,
    return_url: returnUrl,
    refresh_url: refreshUrl,
    type: "account_onboarding",
  });
  return link.url;
}
