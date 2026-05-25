-- SPACEART Phase 1 MVP Schema

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enums
CREATE TYPE user_role AS ENUM ('visitor', 'creative', 'admin');
CREATE TYPE approval_status AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE listing_status AS ENUM ('draft', 'pending_review', 'published', 'rejected', 'archived');

-- Profiles (extends auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  role user_role NOT NULL DEFAULT 'visitor',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Categories
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Creatives
CREATE TABLE creatives (
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

-- Listings
CREATE TABLE listings (
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

-- Listing media
CREATE TABLE listing_media (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  cloudinary_public_id TEXT NOT NULL,
  url TEXT NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_creatives_status ON creatives(status);
CREATE INDEX idx_creatives_featured ON creatives(is_featured) WHERE is_featured = TRUE;
CREATE INDEX idx_creatives_search ON creatives USING GIN(search_vector);
CREATE INDEX idx_listings_status ON listings(status);
CREATE INDEX idx_listings_trending ON listings(is_trending) WHERE is_trending = TRUE;
CREATE INDEX idx_listings_creative ON listings(creative_id);
CREATE INDEX idx_listings_category ON listings(category_id);
CREATE INDEX idx_listings_search ON listings USING GIN(search_vector);
CREATE INDEX idx_listing_media_listing ON listing_media(listing_id);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER creatives_updated_at BEFORE UPDATE ON creatives
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER listings_updated_at BEFORE UPDATE ON listings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Slug helper
CREATE OR REPLACE FUNCTION generate_slug(input TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN lower(regexp_replace(regexp_replace(trim(input), '[^a-zA-Z0-9\s-]', '', 'g'), '\s+', '-', 'g'));
END;
$$ LANGUAGE plpgsql;

-- RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE creatives ENABLE ROW LEVEL SECURITY;
ALTER TABLE listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE listing_media ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Public profiles are viewable by everyone"
  ON profiles FOR SELECT USING (true);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE USING (auth.uid() = id);

-- Categories policies (public read)
CREATE POLICY "Categories are public"
  ON categories FOR SELECT USING (true);

-- Creatives policies
CREATE POLICY "Approved creatives are public"
  ON creatives FOR SELECT USING (status = 'approved');

CREATE POLICY "Owners can view own creative"
  ON creatives FOR SELECT USING (profile_id = auth.uid());

CREATE POLICY "Admins can view all creatives"
  ON creatives FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Owners can insert own creative"
  ON creatives FOR INSERT WITH CHECK (profile_id = auth.uid());

CREATE POLICY "Owners can update own creative"
  ON creatives FOR UPDATE USING (profile_id = auth.uid());

CREATE POLICY "Admins can update creatives"
  ON creatives FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Listings policies
CREATE POLICY "Published listings from approved creatives are public"
  ON listings FOR SELECT USING (
    status = 'published' AND EXISTS (
      SELECT 1 FROM creatives c
      WHERE c.id = listings.creative_id AND c.status = 'approved'
    )
  );

CREATE POLICY "Owners can view own listings"
  ON listings FOR SELECT USING (
    EXISTS (SELECT 1 FROM creatives c WHERE c.id = listings.creative_id AND c.profile_id = auth.uid())
  );

CREATE POLICY "Admins can view all listings"
  ON listings FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Owners can insert listings"
  ON listings FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM creatives c WHERE c.id = creative_id AND c.profile_id = auth.uid())
  );

CREATE POLICY "Owners can update own listings"
  ON listings FOR UPDATE USING (
    EXISTS (SELECT 1 FROM creatives c WHERE c.id = listings.creative_id AND c.profile_id = auth.uid())
  );

CREATE POLICY "Admins can update listings"
  ON listings FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Listing media policies
CREATE POLICY "Public media for published listings"
  ON listing_media FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM listings l
      JOIN creatives c ON c.id = l.creative_id
      WHERE l.id = listing_media.listing_id
        AND l.status = 'published'
        AND c.status = 'approved'
    )
  );

CREATE POLICY "Owners can view own listing media"
  ON listing_media FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM listings l
      JOIN creatives c ON c.id = l.creative_id
      WHERE l.id = listing_media.listing_id AND c.profile_id = auth.uid()
    )
  );

CREATE POLICY "Owners can manage own listing media"
  ON listing_media FOR ALL USING (
    EXISTS (
      SELECT 1 FROM listings l
      JOIN creatives c ON c.id = l.creative_id
      WHERE l.id = listing_media.listing_id AND c.profile_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage all listing media"
  ON listing_media FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );
