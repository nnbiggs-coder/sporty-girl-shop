-- Initial schema for Sporty Girl Shop MVP prototype
-- See /docs/PRD.md Section 7 for entity overview

-- Enums
CREATE TYPE user_role AS ENUM ('buyer', 'seller', 'both');
CREATE TYPE listing_status AS ENUM ('draft', 'live', 'sold', 'removed');
CREATE TYPE condition_tier AS ENUM ('Pristine', 'Excellent', 'Very Good', 'Good');
CREATE TYPE fee_tier AS ENUM ('commodity', 'niche');
CREATE TYPE transaction_status AS ENUM ('pending', 'completed', 'refunded', 'cancelled');
CREATE TYPE dispute_status AS ENUM ('none', 'flagged', 'resolved');
CREATE TYPE notification_type AS ENUM ('price_drop', 'new_match', 'sold', 'restock');
CREATE TYPE analytics_event_type AS ENUM (
  'listing_created',
  'listing_published',
  'listing_sold',
  'purchase_completed',
  'watchlist_add',
  'saved_search_created',
  'user_signup',
  'tos_accepted',
  'dispute_flagged',
  'organic_signup',
  'paid_signup'
);

-- Fee configuration lookup table (Section 6 — not hardcoded in app logic)
CREATE TABLE fee_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fee_tier fee_tier NOT NULL UNIQUE,
  fee_percent NUMERIC(5,2) NOT NULL,
  description TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Categories
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  sport TEXT NOT NULL,
  fee_tier fee_tier NOT NULL DEFAULT 'commodity',
  requires_safety_disclosure BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- User profiles (extends Supabase auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT,
  email TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'both',
  stripe_connect_account_id TEXT,
  stripe_connect_onboarded BOOLEAN NOT NULL DEFAULT false,
  tos_accepted_at TIMESTAMPTZ,
  tos_version TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ToS acceptance audit log
CREATE TABLE tos_acceptances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  tos_version TEXT NOT NULL,
  accepted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ip_address TEXT,
  user_agent TEXT
);

-- Listings
CREATE TABLE listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES categories(id),
  title TEXT NOT NULL,
  brand TEXT,
  sport TEXT NOT NULL,
  size TEXT,
  price NUMERIC(10,2),
  suggested_price_min NUMERIC(10,2),
  suggested_price_max NUMERIC(10,2),
  condition_tier condition_tier,
  ai_notes TEXT,
  flagged_concerns JSONB DEFAULT '[]'::jsonb,
  photos JSONB NOT NULL DEFAULT '[]'::jsonb,
  video_url TEXT,
  status listing_status NOT NULL DEFAULT 'draft',
  fee_tier fee_tier NOT NULL DEFAULT 'commodity',
  price_history JSONB NOT NULL DEFAULT '[]'::jsonb,
  safety_disclosure JSONB,
  ai_scorecard_generated_at TIMESTAMPTZ,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Safety disclosure records (separate from AI output per Section 5.1)
CREATE TABLE safety_disclosures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  has_been_in_impact BOOLEAN NOT NULL,
  impact_description TEXT,
  has_structural_damage BOOLEAN NOT NULL DEFAULT false,
  structural_damage_description TEXT,
  seller_attests_accuracy BOOLEAN NOT NULL DEFAULT false,
  disclosed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Comparable listings for price suggestion v1 (Section 5.2)
CREATE TABLE comparable_listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID NOT NULL REFERENCES categories(id),
  brand TEXT,
  title TEXT NOT NULL,
  condition_tier condition_tier NOT NULL,
  sold_price NUMERIC(10,2) NOT NULL,
  source TEXT NOT NULL DEFAULT 'seed',
  source_url TEXT,
  sold_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Watchlist
CREATE TABLE watchlist (
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, listing_id)
);

-- Saved searches
CREATE TABLE saved_searches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT,
  filters JSONB NOT NULL DEFAULT '{}'::jsonb,
  last_notified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Transactions
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID NOT NULL REFERENCES listings(id),
  buyer_id UUID NOT NULL REFERENCES profiles(id),
  seller_id UUID NOT NULL REFERENCES profiles(id),
  sale_price NUMERIC(10,2) NOT NULL,
  platform_fee NUMERIC(10,2) NOT NULL,
  processing_fee NUMERIC(10,2) NOT NULL,
  tax_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  payout_amount NUMERIC(10,2) NOT NULL,
  stripe_payment_intent_id TEXT,
  stripe_transfer_id TEXT,
  status transaction_status NOT NULL DEFAULT 'pending',
  dispute_status dispute_status NOT NULL DEFAULT 'none',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Notifications
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type notification_type NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  sent_at TIMESTAMPTZ,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Analytics events (Section 10 metrics instrumentation)
CREATE TABLE analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type analytics_event_type NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  listing_id UUID REFERENCES listings(id) ON DELETE SET NULL,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_listings_status ON listings(status);
CREATE INDEX idx_listings_sport ON listings(sport);
CREATE INDEX idx_listings_category ON listings(category_id);
CREATE INDEX idx_listings_seller ON listings(seller_id);
CREATE INDEX idx_listings_condition ON listings(condition_tier);
CREATE INDEX idx_listings_published ON listings(published_at DESC);
CREATE INDEX idx_comparable_category ON comparable_listings(category_id);
CREATE INDEX idx_transactions_seller ON transactions(seller_id);
CREATE INDEX idx_transactions_buyer ON transactions(buyer_id);
CREATE INDEX idx_analytics_event_type ON analytics_events(event_type);
CREATE INDEX idx_analytics_category ON analytics_events(category_id);
CREATE INDEX idx_notifications_user ON notifications(user_id);

-- Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE watchlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_searches ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE safety_disclosures ENABLE ROW LEVEL SECURITY;
ALTER TABLE tos_acceptances ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Public profiles are viewable by everyone"
  ON profiles FOR SELECT USING (true);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Listings policies
CREATE POLICY "Live listings are viewable by everyone"
  ON listings FOR SELECT USING (status = 'live' OR seller_id = auth.uid());

CREATE POLICY "Sellers can insert own listings"
  ON listings FOR INSERT WITH CHECK (seller_id = auth.uid());

CREATE POLICY "Sellers can update own listings"
  ON listings FOR UPDATE USING (seller_id = auth.uid());

-- Watchlist policies
CREATE POLICY "Users can manage own watchlist"
  ON watchlist FOR ALL USING (user_id = auth.uid());

-- Saved searches policies
CREATE POLICY "Users can manage own saved searches"
  ON saved_searches FOR ALL USING (user_id = auth.uid());

-- Transactions policies
CREATE POLICY "Users can view own transactions"
  ON transactions FOR SELECT USING (buyer_id = auth.uid() OR seller_id = auth.uid());

-- Notifications policies
CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE USING (user_id = auth.uid());

-- Safety disclosures policies
CREATE POLICY "Users can insert own safety disclosures"
  ON safety_disclosures FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can view own safety disclosures"
  ON safety_disclosures FOR SELECT USING (user_id = auth.uid());

-- ToS acceptances policies
CREATE POLICY "Users can insert own tos acceptances"
  ON tos_acceptances FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can view own tos acceptances"
  ON tos_acceptances FOR SELECT USING (user_id = auth.uid());

-- Public read for categories, fee_config, comparable_listings
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE fee_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE comparable_listings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Categories are public" ON categories FOR SELECT USING (true);
CREATE POLICY "Fee config is public" ON fee_config FOR SELECT USING (true);
CREATE POLICY "Comparable listings are public" ON comparable_listings FOR SELECT USING (true);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Storage bucket for listing media
INSERT INTO storage.buckets (id, name, public) VALUES ('listing-media', 'listing-media', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Authenticated users can upload listing media"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'listing-media' AND auth.role() = 'authenticated');

CREATE POLICY "Public can view listing media"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'listing-media');

CREATE POLICY "Users can update own listing media"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'listing-media' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete own listing media"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'listing-media' AND auth.uid()::text = (storage.foldername(name))[1]);
