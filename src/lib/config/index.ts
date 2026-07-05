/**
 * Application configuration — all values sourced from environment variables.
 * Never hardcode brand strings, fee rates, or processing fees in UI or business logic.
 */

export const appConfig = {
  name: process.env.NEXT_PUBLIC_APP_NAME ?? process.env.APP_NAME ?? "Sporty Girl Shop",
  url: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  tosVersion: process.env.NEXT_PUBLIC_TOS_VERSION ?? process.env.TOS_VERSION ?? "1.0.0",
} as const;

export const feeConfig = {
  // Known simplification: flat commodity rate for all sellers.
  // TODO: implement sales-count tier discount (lower rate after 6+ sales) in a later pass.
  commodityFeePercent: parseFloat(process.env.COMMODITY_FEE_PERCENT ?? "12"),
  nicheFeePercent: parseFloat(process.env.NICHE_FEE_PERCENT ?? "20"),
  processingFeePercent: parseFloat(process.env.PROCESSING_FEE_PERCENT ?? "2.9"),
  processingFeeFlat: parseFloat(process.env.PROCESSING_FEE_FLAT ?? "0.30"),
} as const;

export const aiConfig = {
  provider: (process.env.AI_PROVIDER ?? "openai") as "openai" | "anthropic",
  openaiApiKey: process.env.OPENAI_API_KEY,
  anthropicApiKey: process.env.ANTHROPIC_API_KEY,
} as const;

export const emailConfig = {
  apiKey: process.env.RESEND_API_KEY,
  from: process.env.EMAIL_FROM ?? "notifications@example.com",
} as const;

export const stripeConfig = {
  secretKey: process.env.STRIPE_SECRET_KEY,
  publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
  webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
  connectWebhookSecret: process.env.STRIPE_CONNECT_WEBHOOK_SECRET,
} as const;

/** Fixed photo template — 4 required shot types (Section 5.1 / user spec #5) */
export const PHOTO_REQUIREMENTS = [
  {
    key: "front" as const,
    label: "Front View",
    description: "Full front view of the item, well-lit and in focus",
  },
  {
    key: "back" as const,
    label: "Back View",
    description: "Full back view showing any wear or markings",
  },
  {
    key: "label_closeup" as const,
    label: "Label / Tag Close-up",
    description: "Close-up of brand label, size tag, or model number",
  },
  {
    key: "damage_closeup" as const,
    label: "Damage / Wear Close-up",
    description: "Close-up of any visible wear, scuffs, or damage (or overall condition if pristine)",
  },
] as const;

export type PhotoRequirementKey = (typeof PHOTO_REQUIREMENTS)[number]["key"];

export const CONDITION_TIERS = [
  "Pristine",
  "Excellent",
  "Very Good",
  "Good",
] as const;

export type ConditionTier = (typeof CONDITION_TIERS)[number];

export const SAFETY_DISCLOSURE_CATEGORIES = [
  "helmets",
  "equestrian_saddle_tack",
  "harnesses",
  "fencing_mask",
  "fencing_weapon",
  "ski_bindings",
  "snowboard_bindings",
] as const;
