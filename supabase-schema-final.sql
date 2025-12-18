-- BarberLink Production Database Schema

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  full_name TEXT,
  role TEXT CHECK (role IN ('client', 'vendor')) DEFAULT 'client',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create shops table
CREATE TABLE IF NOT EXISTS shops (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID REFERENCES profiles(id),
  shop_name TEXT NOT NULL,
  address TEXT NOT NULL,
  manager_name TEXT NOT NULL,
  manager_phone TEXT,
  manager_email TEXT,
  description TEXT,
  services TEXT[],
  image_urls TEXT[],
  is_verified BOOLEAN DEFAULT false,
  is_featured BOOLEAN DEFAULT false,
  view_count INTEGER DEFAULT 0,
  last_featured_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create reviews table
CREATE TABLE IF NOT EXISTS reviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  shop_id UUID REFERENCES shops(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id),
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create featured updates tracking table
CREATE TABLE IF NOT EXISTS featured_updates (
  id SERIAL PRIMARY KEY,
  updated_at TIMESTAMP DEFAULT NOW(),
  shops_featured INTEGER
);

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE shops ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Anyone can view shops" ON shops;
DROP POLICY IF EXISTS "Vendors can insert shops" ON shops;
DROP POLICY IF EXISTS "Owners can update own shops" ON shops;
DROP POLICY IF EXISTS "Anyone can view reviews" ON reviews;
DROP POLICY IF EXISTS "Authenticated users can insert reviews" ON reviews;
DROP POLICY IF EXISTS "Users can update own reviews" ON reviews;

-- Profiles policies
CREATE POLICY "Users can view all profiles" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Shops policies
CREATE POLICY "Anyone can view shops" ON shops FOR SELECT USING (true);
CREATE POLICY "Vendors can insert shops" ON shops FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'vendor')
);
CREATE POLICY "Owners can update own shops" ON shops FOR UPDATE USING (owner_id = auth.uid());

-- Reviews policies
CREate POLICY "Anyone can view reviews" ON reviews FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert reviews" ON reviews FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update own reviews" ON reviews FOR UPDATE USING (true);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_shops_featured ON shops(is_featured);
CREATE INDEX IF NOT EXISTS idx_shops_verified ON shops(is_verified);
CREATE INDEX IF NOT EXISTS idx_shops_owner ON shops(owner_id);
CREATE INDEX IF NOT EXISTS idx_reviews_shop ON reviews(shop_id);
-- CREATE INDEX IF NOT EXISTS idx_reviews_user ON reviews(user_id);

-- Auto-update featured shops function
CREATE OR REPLACE FUNCTION update_featured_shops()
RETURNS void AS $$
DECLARE
  shop_record RECORD;
  featured_count INTEGER := 0;
  max_featured INTEGER := 12;
BEGIN
  -- Unfeatured all current featured shops
  UPDATE shops SET is_featured = false WHERE is_featured = true;
  
  -- Select top performing shops
  FOR shop_record IN
    SELECT 
      s.id,
      COALESCE(AVG(r.rating), 0) as avg_rating,
      COUNT(r.id) as review_count,
      s.view_count,
      s.is_verified,
      s.created_at,
      s.last_featured_at
    FROM shops s
    LEFT JOIN reviews r ON s.id = r.shop_id
    WHERE s.is_verified = true
    GROUP BY s.id, s.view_count, s.is_verified, s.created_at, s.last_featured_at
    HAVING 
      COALESCE(AVG(r.rating), 0) >= 4.2 
      AND COUNT(r.id) >= 10 
      AND s.view_count >= 100
      AND (s.last_featured_at IS NULL OR s.last_featured_at < NOW() - INTERVAL '7 days')
    ORDER BY 
      (COALESCE(AVG(r.rating), 0) * 0.4 + 
       LEAST(COUNT(r.id) / 50.0, 1) * 0.25 + 
       LEAST(s.view_count / 1000.0, 1) * 0.2 + 
       (CASE WHEN s.is_verified THEN 0.1 ELSE 0 END) +
       (CASE WHEN s.created_at > NOW() - INTERVAL '90 days' THEN 0.05 ELSE 0 END)) DESC
    LIMIT max_featured
  LOOP
    UPDATE shops 
    SET 
      is_featured = true,
      last_featured_at = NOW()
    WHERE id = shop_record.id;
    
    featured_count := featured_count + 1;
  END LOOP;
  
  INSERT INTO featured_updates (updated_at, shops_featured) 
  VALUES (NOW(), featured_count);
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-create profile on user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, full_name, role)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name', COALESCE(NEW.raw_user_meta_data->>'role', 'client'));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();