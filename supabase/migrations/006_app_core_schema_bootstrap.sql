-- Bootstrap core app tables when the Supabase project was created with a minimal schema.
-- Idempotent: safe to re-run. Renames legacy listings if present.

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'approval_status') THEN
    CREATE TYPE approval_status AS ENUM ('pending', 'approved', 'rejected');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'listing_status') THEN
    CREATE TYPE listing_status AS ENUM ('draft', 'pending_review', 'published', 'rejected', 'archived');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS creatives (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID NOT NULL UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
  slug TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  bio TEXT,
  city TEXT,
  province TEXT,
  whatsapp_number TEXT,
  cover_image_url TEXT,
  avatar_url TEXT,
  status approval_status NOT NULL DEFAULT 'pending',
  is_featured BOOLEAN NOT NULL DEFAULT FALSE,
  rejection_note TEXT,
  approved_at TIMESTAMPTZ,
  search_vector TSVECTOR GENERATED ALWAYS AS (
    to_tsvector('english', coalesce(display_name, '') || ' ' || coalesce(bio, '') || ' ' || coalesce(city, '') || ' ' || coalesce(province, ''))
  ) STORED,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'listings' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE public.listings RENAME TO legacy_listings;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS listings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  creative_id UUID NOT NULL REFERENCES creatives(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT,
  status listing_status NOT NULL DEFAULT 'draft',
  is_trending BOOLEAN NOT NULL DEFAULT FALSE,
  price_from_cents INT,
  price_label TEXT,
  rejection_note TEXT,
  published_at TIMESTAMPTZ,
  search_vector TSVECTOR GENERATED ALWAYS AS (
    to_tsvector('english', coalesce(title, '') || ' ' || coalesce(description, '') || ' ' || coalesce(price_label, ''))
  ) STORED,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS listing_media (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  cloudinary_public_id TEXT,
  url TEXT NOT NULL,
  storage_path TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO categories (slug, name, description, icon, sort_order) VALUES
  ('music', 'Music', 'African sounds, production, and live performance', 'music', 1),
  ('fashion', 'Fashion', 'Contemporary African fashion and styling', 'shirt', 2),
  ('photography', 'Photography', 'Visual storytelling and portrait artistry', 'camera', 3),
  ('performance', 'Performance', 'Theatre, dance, and live creative expression', 'mic', 4),
  ('crafts', 'Crafts', 'Handmade artistry and cultural craft', 'palette', 5),
  ('design', 'Design', 'Graphic, product, and spatial design', 'pen-tool', 6)
ON CONFLICT (slug) DO NOTHING;

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE creatives ENABLE ROW LEVEL SECURITY;
ALTER TABLE listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE listing_media ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Categories are public" ON categories;
CREATE POLICY "Categories are public" ON categories FOR SELECT USING (true);

DROP POLICY IF EXISTS "Approved creatives are public" ON creatives;
DROP POLICY IF EXISTS "Owners can view own creative" ON creatives;
DROP POLICY IF EXISTS "Admins can view all creatives" ON creatives;
DROP POLICY IF EXISTS "Owners can insert own creative" ON creatives;
DROP POLICY IF EXISTS "Owners can update own creative" ON creatives;
DROP POLICY IF EXISTS "Admins can update creatives" ON creatives;

CREATE POLICY "Approved creatives are public" ON creatives FOR SELECT USING (status = 'approved');
CREATE POLICY "Owners can view own creative" ON creatives FOR SELECT USING (profile_id = auth.uid());
CREATE POLICY "Admins can view all creatives" ON creatives FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Owners can insert own creative" ON creatives FOR INSERT WITH CHECK (profile_id = auth.uid());
CREATE POLICY "Owners can update own creative" ON creatives FOR UPDATE USING (profile_id = auth.uid());
CREATE POLICY "Admins can update creatives" ON creatives FOR UPDATE USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Public profiles are viewable by everyone" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Listings + listing_media RLS (required for dashboard listing flows)
DROP POLICY IF EXISTS "Published listings from approved creatives are public" ON listings;
DROP POLICY IF EXISTS "Owners can view own listings" ON listings;
DROP POLICY IF EXISTS "Admins can view all listings" ON listings;
DROP POLICY IF EXISTS "Owners can insert listings" ON listings;
DROP POLICY IF EXISTS "Owners can update own listings" ON listings;
DROP POLICY IF EXISTS "Admins can update listings" ON listings;

CREATE POLICY "Published listings from approved creatives are public" ON listings FOR SELECT USING (
  status = 'published' AND EXISTS (
    SELECT 1 FROM creatives c WHERE c.id = listings.creative_id AND c.status = 'approved'
  )
);
CREATE POLICY "Owners can view own listings" ON listings FOR SELECT USING (
  EXISTS (SELECT 1 FROM creatives c WHERE c.id = listings.creative_id AND c.profile_id = auth.uid())
);
CREATE POLICY "Admins can view all listings" ON listings FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Owners can insert listings" ON listings FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM creatives c WHERE c.id = creative_id AND c.profile_id = auth.uid())
);
CREATE POLICY "Owners can update own listings" ON listings FOR UPDATE USING (
  EXISTS (SELECT 1 FROM creatives c WHERE c.id = listings.creative_id AND c.profile_id = auth.uid())
);
CREATE POLICY "Admins can update listings" ON listings FOR UPDATE USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

DROP POLICY IF EXISTS "Public media for published listings" ON listing_media;
DROP POLICY IF EXISTS "Owners can view own listing media" ON listing_media;
DROP POLICY IF EXISTS "Owners can manage own listing media" ON listing_media;
DROP POLICY IF EXISTS "Admins can manage all listing media" ON listing_media;

CREATE POLICY "Public media for published listings" ON listing_media FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM listings l JOIN creatives c ON c.id = l.creative_id
    WHERE l.id = listing_media.listing_id AND l.status = 'published' AND c.status = 'approved'
  )
);
CREATE POLICY "Owners can view own listing media" ON listing_media FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM listings l JOIN creatives c ON c.id = l.creative_id
    WHERE l.id = listing_media.listing_id AND c.profile_id = auth.uid()
  )
);
CREATE POLICY "Owners can manage own listing media" ON listing_media FOR ALL USING (
  EXISTS (
    SELECT 1 FROM listings l JOIN creatives c ON c.id = l.creative_id
    WHERE l.id = listing_media.listing_id AND c.profile_id = auth.uid()
  )
);
CREATE POLICY "Admins can manage all listing media" ON listing_media FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
