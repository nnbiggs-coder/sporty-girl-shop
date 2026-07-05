-- Seed data for Sporty Girl Shop prototype
-- Run after 001_initial_schema.sql

-- Fee configuration lookup table
INSERT INTO fee_config (fee_tier, fee_percent, description) VALUES
  ('commodity', 12.00, 'Commodity categories — flat rate for prototype (TODO: sales-count tier discount)'),
  ('niche', 20.00, 'Niche/high-ticket categories')
ON CONFLICT (fee_tier) DO UPDATE SET fee_percent = EXCLUDED.fee_percent;

-- Categories with fee tiers and safety disclosure flags
INSERT INTO categories (slug, name, sport, fee_tier, requires_safety_disclosure) VALUES
  -- Commodity
  ('soccer_cleats', 'Soccer Cleats', 'Soccer', 'commodity', false),
  ('track_spikes', 'Track Spikes', 'Track & Field', 'commodity', false),
  ('volleyball_kneepads', 'Volleyball Knee Pads', 'Volleyball', 'commodity', false),
  ('softball_gloves', 'Softball Gloves', 'Softball', 'commodity', false),
  ('basketball_shoes', 'Basketball Shoes', 'Basketball', 'commodity', false),
  ('gymnastics_leotards', 'Gymnastics Leotards', 'Gymnastics', 'commodity', false),
  ('tennis_rackets', 'Tennis Rackets', 'Tennis', 'commodity', false),
  ('swim_goggles', 'Swim Goggles & Caps', 'Swimming', 'commodity', false),
  ('lacrosse_sticks', 'Lacrosse Sticks', 'Lacrosse', 'commodity', false),
  ('field_hockey_sticks', 'Field Hockey Sticks', 'Field Hockey', 'commodity', false),
  -- Safety disclosure required
  ('helmets', 'Helmets', 'Multi-Sport', 'commodity', true),
  ('harnesses', 'Climbing Harnesses', 'Climbing', 'commodity', true),
  ('fencing_mask', 'Fencing Masks', 'Fencing', 'commodity', true),
  ('fencing_weapon', 'Fencing Weapons (Foil/Epee/Sabre)', 'Fencing', 'commodity', true),
  ('ski_bindings', 'Ski Bindings', 'Skiing', 'commodity', true),
  ('snowboard_bindings', 'Snowboard Bindings', 'Snowboarding', 'commodity', true),
  -- Niche / high-ticket
  ('fencing_kit', 'Fencing Starter Kits', 'Fencing', 'niche', false),
  ('equestrian_saddle_tack', 'Equestrian Saddles & Tack', 'Equestrian', 'niche', true),
  ('golf_clubs', 'Golf Clubs & Tech', 'Golf', 'niche', false),
  ('golf_tech', 'Golf Launch Monitors & Tech', 'Golf', 'niche', false),
  ('ski_equipment', 'Skis & Boots', 'Skiing', 'niche', false),
  ('snowboard_equipment', 'Snowboards & Boots', 'Snowboarding', 'niche', false)
ON CONFLICT (slug) DO NOTHING;

-- Comparable listings mock data (5-10 per key category)
-- Soccer Cleats
INSERT INTO comparable_listings (category_id, brand, title, condition_tier, sold_price, source, sold_at)
SELECT c.id, 'Nike', 'Nike Mercurial Vapor 15 FG', 'Excellent', 85.00, 'seed', now() - interval '14 days'
FROM categories c WHERE c.slug = 'soccer_cleats';
INSERT INTO comparable_listings (category_id, brand, title, condition_tier, sold_price, source, sold_at)
SELECT c.id, 'Adidas', 'Adidas Predator Edge FG', 'Very Good', 62.00, 'seed', now() - interval '21 days'
FROM categories c WHERE c.slug = 'soccer_cleats';
INSERT INTO comparable_listings (category_id, brand, title, condition_tier, sold_price, source, sold_at)
SELECT c.id, 'Nike', 'Nike Phantom GX Elite', 'Pristine', 110.00, 'seed', now() - interval '7 days'
FROM categories c WHERE c.slug = 'soccer_cleats';
INSERT INTO comparable_listings (category_id, brand, title, condition_tier, sold_price, source, sold_at)
SELECT c.id, 'Puma', 'Puma Ultra Ultimate FG', 'Good', 45.00, 'seed', now() - interval '30 days'
FROM categories c WHERE c.slug = 'soccer_cleats';
INSERT INTO comparable_listings (category_id, brand, title, condition_tier, sold_price, source, sold_at)
SELECT c.id, 'Nike', 'Nike Tiempo Legend 9', 'Excellent', 72.00, 'seed', now() - interval '10 days'
FROM categories c WHERE c.slug = 'soccer_cleats';
INSERT INTO comparable_listings (category_id, brand, title, condition_tier, sold_price, source, sold_at)
SELECT c.id, 'Adidas', 'Adidas Copa Pure 2', 'Very Good', 58.00, 'seed', now() - interval '18 days'
FROM categories c WHERE c.slug = 'soccer_cleats';

-- Track Spikes
INSERT INTO comparable_listings (category_id, brand, title, condition_tier, sold_price, source, sold_at)
SELECT c.id, 'Nike', 'Nike Zoom Rival Sprint', 'Excellent', 55.00, 'seed', now() - interval '12 days'
FROM categories c WHERE c.slug = 'track_spikes';
INSERT INTO comparable_listings (category_id, brand, title, condition_tier, sold_price, source, sold_at)
SELECT c.id, 'New Balance', 'NB FuelCell MD-X', 'Very Good', 48.00, 'seed', now() - interval '25 days'
FROM categories c WHERE c.slug = 'track_spikes';
INSERT INTO comparable_listings (category_id, brand, title, condition_tier, sold_price, source, sold_at)
SELECT c.id, 'Nike', 'Nike Zoom Superfly Elite 2', 'Pristine', 95.00, 'seed', now() - interval '5 days'
FROM categories c WHERE c.slug = 'track_spikes';
INSERT INTO comparable_listings (category_id, brand, title, condition_tier, sold_price, source, sold_at)
SELECT c.id, 'Adidas', 'Adidas Adizero Prime SP', 'Good', 35.00, 'seed', now() - interval '40 days'
FROM categories c WHERE c.slug = 'track_spikes';
INSERT INTO comparable_listings (category_id, brand, title, condition_tier, sold_price, source, sold_at)
SELECT c.id, 'Nike', 'Nike Zoom Rival Multi', 'Excellent', 42.00, 'seed', now() - interval '15 days'
FROM categories c WHERE c.slug = 'track_spikes';

-- Helmets
INSERT INTO comparable_listings (category_id, brand, title, condition_tier, sold_price, source, sold_at)
SELECT c.id, 'Cascade', 'Cascade LX Women's Lacrosse Helmet', 'Excellent', 180.00, 'seed', now() - interval '20 days'
FROM categories c WHERE c.slug = 'helmets';
INSERT INTO comparable_listings (category_id, brand, title, condition_tier, sold_price, source, sold_at)
SELECT c.id, 'Giro', 'Giro Ella MIPS Helmet', 'Very Good', 65.00, 'seed', now() - interval '28 days'
FROM categories c WHERE c.slug = 'helmets';
INSERT INTO comparable_listings (category_id, brand, title, condition_tier, sold_price, source, sold_at)
SELECT c.id, 'POC', 'POC Tectal Race SPIN', 'Pristine', 120.00, 'seed', now() - interval '8 days'
FROM categories c WHERE c.slug = 'helmets';
INSERT INTO comparable_listings (category_id, brand, title, condition_tier, sold_price, source, sold_at)
SELECT c.id, 'Bell', 'Bell Super Air R MIPS', 'Good', 55.00, 'seed', now() - interval '35 days'
FROM categories c WHERE c.slug = 'helmets';
INSERT INTO comparable_listings (category_id, brand, title, condition_tier, sold_price, source, sold_at)
SELECT c.id, 'Smith', 'Smith Forefront 2 MIPS', 'Excellent', 95.00, 'seed', now() - interval '16 days'
FROM categories c WHERE c.slug = 'helmets';

-- Fencing Kit (niche)
INSERT INTO comparable_listings (category_id, brand, title, condition_tier, sold_price, source, sold_at)
SELECT c.id, 'Absolute', 'Absolute Standard 3-Weapon Starter Set', 'Excellent', 320.00, 'seed', now() - interval '22 days'
FROM categories c WHERE c.slug = 'fencing_kit';
INSERT INTO comparable_listings (category_id, brand, title, condition_tier, sold_price, source, sold_at)
SELECT c.id, 'Leon Paul', 'Leon Paul Club Starter Kit', 'Very Good', 275.00, 'seed', now() - interval '30 days'
FROM categories c WHERE c.slug = 'fencing_kit';
INSERT INTO comparable_listings (category_id, brand, title, condition_tier, sold_price, source, sold_at)
SELECT c.id, 'Blue Gauntlet', 'Blue Gauntlet Competitive Set', 'Pristine', 450.00, 'seed', now() - interval '6 days'
FROM categories c WHERE c.slug = 'fencing_kit';
INSERT INTO comparable_listings (category_id, brand, title, condition_tier, sold_price, source, sold_at)
SELECT c.id, 'Absolute', 'Absolute Elite Foil Set', 'Good', 195.00, 'seed', now() - interval '45 days'
FROM categories c WHERE c.slug = 'fencing_kit';
INSERT INTO comparable_listings (category_id, brand, title, condition_tier, sold_price, source, sold_at)
SELECT c.id, 'Leon Paul', 'Leon Paul Apex Foil Kit', 'Excellent', 380.00, 'seed', now() - interval '11 days'
FROM categories c WHERE c.slug = 'fencing_kit';
INSERT INTO comparable_listings (category_id, brand, title, condition_tier, sold_price, source, sold_at)
SELECT c.id, 'Allstar', 'Allstar Visor Mask + Weapon Bundle', 'Very Good', 210.00, 'seed', now() - interval '19 days'
FROM categories c WHERE c.slug = 'fencing_kit';

-- Equestrian Saddle & Tack (niche + safety)
INSERT INTO comparable_listings (category_id, brand, title, condition_tier, sold_price, source, sold_at)
SELECT c.id, 'Wintec', 'Wintec 500 All Purpose Saddle 17"', 'Excellent', 425.00, 'seed', now() - interval '25 days'
FROM categories c WHERE c.slug = 'equestrian_saddle_tack';
INSERT INTO comparable_listings (category_id, brand, title, condition_tier, sold_price, source, sold_at)
SELECT c.id, 'Pessoa', 'Pessoa Gen-X Elita Saddle', 'Very Good', 650.00, 'seed', now() - interval '33 days'
FROM categories c WHERE c.slug = 'equestrian_saddle_tack';
INSERT INTO comparable_listings (category_id, brand, title, condition_tier, sold_price, source, sold_at)
SELECT c.id, 'Bates', 'Bates Victrix Jump Saddle', 'Pristine', 890.00, 'seed', now() - interval '9 days'
FROM categories c WHERE c.slug = 'equestrian_saddle_tack';
INSERT INTO comparable_listings (category_id, brand, title, condition_tier, sold_price, source, sold_at)
SELECT c.id, 'Stubben', 'Stubben Edelle Saddle 16.5"', 'Good', 380.00, 'seed', now() - interval '50 days'
FROM categories c WHERE c.slug = 'equestrian_saddle_tack';
INSERT INTO comparable_listings (category_id, brand, title, condition_tier, sold_price, source, sold_at)
SELECT c.id, 'Wintec', 'Wintec Pro Jump Saddle with CAIR', 'Excellent', 520.00, 'seed', now() - interval '14 days'
FROM categories c WHERE c.slug = 'equestrian_saddle_tack';

-- Golf Clubs (niche)
INSERT INTO comparable_listings (category_id, brand, title, condition_tier, sold_price, source, sold_at)
SELECT c.id, 'Callaway', 'Callaway Rogue ST Max Driver', 'Excellent', 285.00, 'seed', now() - interval '17 days'
FROM categories c WHERE c.slug = 'golf_clubs';
INSERT INTO comparable_listings (category_id, brand, title, condition_tier, sold_price, source, sold_at)
SELECT c.id, 'TaylorMade', 'TaylorMade Stealth 2 Iron Set 5-PW', 'Very Good', 450.00, 'seed', now() - interval '24 days'
FROM categories c WHERE c.slug = 'golf_clubs';
INSERT INTO comparable_listings (category_id, brand, title, condition_tier, sold_price, source, sold_at)
SELECT c.id, 'Titleist', 'Titleist T200 Iron Set', 'Pristine', 720.00, 'seed', now() - interval '4 days'
FROM categories c WHERE c.slug = 'golf_clubs';
INSERT INTO comparable_listings (category_id, brand, title, condition_tier, sold_price, source, sold_at)
SELECT c.id, 'Ping', 'Ping G425 Max Driver', 'Good', 195.00, 'seed', now() - interval '38 days'
FROM categories c WHERE c.slug = 'golf_clubs';
INSERT INTO comparable_listings (category_id, brand, title, condition_tier, sold_price, source, sold_at)
SELECT c.id, 'Cobra', 'Cobra Aerojet Driver', 'Excellent', 310.00, 'seed', now() - interval '13 days'
FROM categories c WHERE c.slug = 'golf_clubs';

-- Basketball Shoes
INSERT INTO comparable_listings (category_id, brand, title, condition_tier, sold_price, source, sold_at)
SELECT c.id, 'Nike', 'Nike GT Cut 3', 'Excellent', 95.00, 'seed', now() - interval '11 days'
FROM categories c WHERE c.slug = 'basketball_shoes';
INSERT INTO comparable_listings (category_id, brand, title, condition_tier, sold_price, source, sold_at)
SELECT c.id, 'Under Armour', 'UA Curry 11', 'Very Good', 68.00, 'seed', now() - interval '20 days'
FROM categories c WHERE c.slug = 'basketball_shoes';
INSERT INTO comparable_listings (category_id, brand, title, condition_tier, sold_price, source, sold_at)
SELECT c.id, 'Nike', 'Nike LeBron XXI', 'Pristine', 130.00, 'seed', now() - interval '3 days'
FROM categories c WHERE c.slug = 'basketball_shoes';
INSERT INTO comparable_listings (category_id, brand, title, condition_tier, sold_price, source, sold_at)
SELECT c.id, 'Adidas', 'Adidas Harden Vol. 8', 'Good', 52.00, 'seed', now() - interval '32 days'
FROM categories c WHERE c.slug = 'basketball_shoes';
INSERT INTO comparable_listings (category_id, brand, title, condition_tier, sold_price, source, sold_at)
SELECT c.id, 'Nike', 'Nike Sabrina 1', 'Excellent', 88.00, 'seed', now() - interval '9 days'
FROM categories c WHERE c.slug = 'basketball_shoes';

-- Gymnastics Leotards
INSERT INTO comparable_listings (category_id, brand, title, condition_tier, sold_price, source, sold_at)
SELECT c.id, 'GK Elite', 'GK Elite Sequin Competition Leo', 'Excellent', 75.00, 'seed', now() - interval '15 days'
FROM categories c WHERE c.slug = 'gymnastics_leotards';
INSERT INTO comparable_listings (category_id, brand, title, condition_tier, sold_price, source, sold_at)
SELECT c.id, 'Destira', 'Destira Starlight Leo', 'Very Good', 45.00, 'seed', now() - interval '27 days'
FROM categories c WHERE c.slug = 'gymnastics_leotards';
INSERT INTO comparable_listings (category_id, brand, title, condition_tier, sold_price, source, sold_at)
SELECT c.id, 'Alpha Factor', 'Alpha Factor Prism Leo', 'Pristine', 90.00, 'seed', now() - interval '6 days'
FROM categories c WHERE c.slug = 'gymnastics_leotards';
INSERT INTO comparable_listings (category_id, brand, title, condition_tier, sold_price, source, sold_at)
SELECT c.id, 'Ozone', 'Ozone Classic Leo', 'Good', 28.00, 'seed', now() - interval '42 days'
FROM categories c WHERE c.slug = 'gymnastics_leotards';
INSERT INTO comparable_listings (category_id, brand, title, condition_tier, sold_price, source, sold_at)
SELECT c.id, 'GK Elite', 'GK Elite Dreamlight Leo', 'Excellent', 65.00, 'seed', now() - interval '12 days'
FROM categories c WHERE c.slug = 'gymnastics_leotards';
