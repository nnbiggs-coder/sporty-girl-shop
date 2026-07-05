import type { ConditionTier } from "@/lib/config";

export type UserRole = "buyer" | "seller" | "both";
export type ListingStatus = "draft" | "live" | "sold" | "removed";
export type FeeTier = "commodity" | "niche";
export type TransactionStatus = "pending" | "completed" | "refunded" | "cancelled";
export type DisputeStatus = "none" | "flagged" | "resolved";
export type NotificationType = "price_drop" | "new_match" | "sold" | "restock";

export interface Profile {
  id: string;
  name: string | null;
  email: string;
  role: UserRole;
  stripe_connect_account_id: string | null;
  stripe_connect_onboarded: boolean;
  tos_accepted_at: string | null;
  tos_version: string | null;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  slug: string;
  name: string;
  sport: string;
  fee_tier: FeeTier;
  requires_safety_disclosure: boolean;
  created_at: string;
}

export interface ListingPhoto {
  key: string;
  url: string;
  uploaded_at: string;
}

export interface PriceHistoryEntry {
  price: number;
  changed_at: string;
  reason?: string;
}

export interface Listing {
  id: string;
  seller_id: string;
  category_id: string;
  title: string;
  brand: string | null;
  sport: string;
  size: string | null;
  price: number | null;
  suggested_price_min: number | null;
  suggested_price_max: number | null;
  condition_tier: ConditionTier | null;
  ai_notes: string | null;
  flagged_concerns: string[];
  photos: ListingPhoto[];
  video_url: string | null;
  status: ListingStatus;
  fee_tier: FeeTier;
  price_history: PriceHistoryEntry[];
  safety_disclosure: SafetyDisclosureData | null;
  ai_scorecard_generated_at: string | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
  category?: Category;
  seller?: Profile;
}

export interface SafetyDisclosureData {
  has_been_in_impact: boolean;
  impact_description?: string;
  has_structural_damage: boolean;
  structural_damage_description?: string;
  seller_attests_accuracy: boolean;
}

export interface SavedSearchFilters {
  sport?: string;
  category_id?: string;
  min_price?: number;
  max_price?: number;
  size?: string;
  condition_tier?: ConditionTier;
  brand?: string;
}

export interface SavedSearch {
  id: string;
  user_id: string;
  name: string | null;
  filters: SavedSearchFilters;
  last_notified_at: string | null;
  created_at: string;
}

export interface Transaction {
  id: string;
  listing_id: string;
  buyer_id: string;
  seller_id: string;
  sale_price: number;
  platform_fee: number;
  processing_fee: number;
  tax_amount: number;
  payout_amount: number;
  stripe_payment_intent_id: string | null;
  stripe_transfer_id: string | null;
  status: TransactionStatus;
  dispute_status: DisputeStatus;
  created_at: string;
  updated_at: string;
  listing?: Listing;
}

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  payload: Record<string, unknown>;
  sent_at: string | null;
  read_at: string | null;
  created_at: string;
}

export interface ConditionScorecard {
  condition_tier: ConditionTier;
  visible_wear_notes: string;
  flagged_concerns: string[];
}

export interface AnalyticsEventType {
  listing_created: "listing_created";
  listing_published: "listing_published";
  listing_sold: "listing_sold";
  purchase_completed: "purchase_completed";
  watchlist_add: "watchlist_add";
  saved_search_created: "saved_search_created";
  user_signup: "user_signup";
  tos_accepted: "tos_accepted";
  dispute_flagged: "dispute_flagged";
  organic_signup: "organic_signup";
  paid_signup: "paid_signup";
}

export type AnalyticsEventName = keyof AnalyticsEventType;
