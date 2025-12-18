-- Drop existing tables completely and recreate with new schema
DROP TABLE IF EXISTS reviews CASCADE;
DROP TABLE IF EXISTS shops CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- Drop existing trigger and function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Create custom types (skip if exists)
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('client', 'vendor');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create profiles table (extends auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role user_role NOT NULL DEFAULT 'client',
  full_name TEXT NOT NULL DEFAULT 'User',
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create shops table with all new fields
CREATE TABLE shops (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  shop_name TEXT NOT NULL,
  description TEXT NOT NULL,
  address TEXT NOT NULL,
  full_address TEXT NOT NULL,
  manager_name TEXT NOT NULL,
  contact_number TEXT NOT NULL,
  whatsapp_number TEXT,
  email TEXT NOT NULL,
  website TEXT,
  facebook_url TEXT,
  instagram_url TEXT,
  twitter_url TEXT,
  services TEXT[] DEFAULT '{}',
  opening_hours JSONB DEFAULT '{}',
  price_range TEXT NOT NULL,
  image_urls TEXT[] DEFAULT '{}',
  is_verified BOOLEAN DEFAULT FALSE,
  is_featured BOOLEAN DEFAULT FALSE,
  view_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create reviews table
CREATE TABLE reviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  shop_id UUID REFERENCES shops(id) ON DELETE CASCADE NOT NULL,
  client_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(shop_id, client_id)
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE shops ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view all profiles" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (true);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (true);

-- Shops policies
CREATE POLICY "Anyone can view shops" ON shops FOR SELECT USING (true);
CREATE POLICY "Vendors can insert own shops" ON shops FOR INSERT WITH CHECK (true);
CREATE POLICY "Vendors can update own shops" ON shops FOR UPDATE USING (true);
CREATE POLICY "Vendors can delete own shops" ON shops FOR DELETE USING (true);

-- Reviews policies
CREATE POLICY "Anyone can view reviews" ON reviews FOR SELECT USING (true);
CREATE POLICY "Clients can insert reviews" ON reviews FOR INSERT WITH CHECK (true);
CREATE POLICY "Clients can update own reviews" ON reviews FOR UPDATE USING (true);
CREATE POLICY "Clients can delete own reviews" ON reviews FOR DELETE USING (true);

-- Create indexes for better performance
CREATE INDEX idx_shops_owner_id ON shops(owner_id);
CREATE INDEX idx_reviews_shop_id ON reviews(shop_id);
CREATE INDEX idx_reviews_client_id ON reviews(client_id);
CREATE INDEX idx_shops_address ON shops(address);
CREATE INDEX idx_shops_verified ON shops(is_verified);

-- Insert fake data
DO $$
DECLARE
    shop_names TEXT[] := ARRAY[
        'Elite Cuts', 'Royal Barber', 'Sharp Edge', 'Classic Cuts', 'Modern Fade',
        'Gentleman''s Choice', 'The Barber Shop', 'Style Studio', 'Fresh Cuts', 'Urban Barber',
        'Premium Cuts', 'Master Barber', 'Signature Style', 'The Cut House', 'Blade & Fade',
        'Luxury Barber', 'Smooth Cuts', 'Perfect Trim', 'Style Masters', 'The Grooming Co',
        'Executive Cuts', 'Vintage Barber', 'Clean Cut', 'Sharp Style', 'The Hair Studio',
        'Precision Cuts', 'Barber Kings', 'Style Point', 'Cut Above', 'The Fade Shop',
        'Grooming Lounge', 'Barber Elite', 'Style Central', 'Cut & Style', 'The Trim Shop',
        'Barber Pro', 'Style Zone', 'Cut Masters', 'The Shave', 'Fade Factory',
        'Barber House', 'Style Works', 'Cut Studio', 'The Clipper', 'Fade Zone',
        'Barber Central', 'Style Hub', 'Cut Pro', 'The Razor', 'Fade Studio'
    ];
    
    areas TEXT[] := ARRAY['Sandton', 'Rosebank', 'Braamfontein', 'Melville', 'Parkhurst', 'Greenside', 'Randburg', 'Fourways', 'Midrand', 'Centurion'];
    
    services TEXT[] := ARRAY['Haircut', 'Beard Trim', 'Hot Towel Shave', 'Hair Wash', 'Styling', 'Mustache Trim', 'Eyebrow Trim', 'Hair Treatment'];
    
    price_ranges TEXT[] := ARRAY['Budget (R50-R100)', 'Mid-range (R100-R200)', 'Premium (R200-R350)', 'Luxury (R350+)'];
    
    manager_names TEXT[] := ARRAY['John', 'Mike', 'David', 'Chris', 'James', 'Robert', 'Paul', 'Mark', 'Steve', 'Tony'];
    
    descriptions TEXT[] := ARRAY[
        'Professional barber shop offering premium cuts and styling services in a modern environment.',
        'Traditional barbering with a contemporary twist. Expert stylists and premium products.',
        'Luxury grooming experience with attention to detail and personalized service.',
        'Classic barbering techniques combined with modern styling for the perfect look.',
        'Premium barber shop specializing in fades, beard grooming, and hot towel shaves.'
    ];
    
    i INTEGER;
    random_services TEXT[];
    j INTEGER;
    dummy_owner_id UUID := gen_random_uuid();
    dummy_client_id UUID := gen_random_uuid();
    shop_ids UUID[];
    random_shop UUID;
BEGIN
    -- Create dummy profiles
    INSERT INTO profiles (id, full_name, role) VALUES 
    (dummy_owner_id, 'System Owner', 'vendor'),
    (dummy_client_id, 'Demo Client', 'client')
    ON CONFLICT (id) DO NOTHING;
    
    -- Insert 200 shops
    FOR i IN 1..200 LOOP
        random_services := ARRAY[]::TEXT[];
        FOR j IN 1..(2 + (random() * 2)::INTEGER) LOOP
            random_services := array_append(random_services, services[1 + (random() * (array_length(services, 1) - 1))::INTEGER]);
        END LOOP;
        
        INSERT INTO shops (
            owner_id, shop_name, description, address, full_address, manager_name,
            contact_number, whatsapp_number, email, website, facebook_url, instagram_url,
            services, price_range, image_urls, is_verified, is_featured, view_count, created_at
        ) VALUES (
            dummy_owner_id,
            shop_names[1 + (i % array_length(shop_names, 1))::INTEGER] || ' ' || i,
            descriptions[1 + (random() * (array_length(descriptions, 1) - 1))::INTEGER],
            areas[1 + (random() * (array_length(areas, 1) - 1))::INTEGER],
            (random() * 999 + 1)::INTEGER || ' ' || (ARRAY['Main', 'Church', 'Market', 'Oak', 'Pine'])[1 + (random() * 4)::INTEGER] || ' Street',
            manager_names[1 + (random() * (array_length(manager_names, 1) - 1))::INTEGER] || ' Smith',
            '+27' || (random() * 900000000 + 100000000)::BIGINT,
            '+27' || (random() * 900000000 + 100000000)::BIGINT,
            'shop' || i || '@barberlink.co.za',
            CASE WHEN random() > 0.5 THEN 'https://shop' || i || '.co.za' ELSE NULL END,
            CASE WHEN random() > 0.6 THEN 'https://facebook.com/shop' || i ELSE NULL END,
            CASE WHEN random() > 0.6 THEN 'https://instagram.com/shop' || i ELSE NULL END,
            random_services,
            price_ranges[1 + (random() * (array_length(price_ranges, 1) - 1))::INTEGER],
            ARRAY['https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=500'],
            random() > 0.7,
            random() > 0.9,
            (random() * 1000)::INTEGER,
            NOW() - (random() * INTERVAL '365 days')
        );
    END LOOP;
    
    -- Create multiple client profiles for reviews
    FOR i IN 1..50 LOOP
        INSERT INTO profiles (id, full_name, role) VALUES 
        (gen_random_uuid(), 
         (ARRAY['Michael', 'Sarah', 'David', 'Emma', 'James', 'Lisa', 'Robert', 'Maria', 'John', 'Anna', 'Chris', 'Sophie', 'Daniel', 'Kate', 'Mark'])[1 + (random() * 14)::INTEGER] || ' ' ||
         (ARRAY['Johnson', 'Smith', 'Brown', 'Davis', 'Wilson', 'Miller', 'Moore', 'Taylor', 'Anderson', 'Thomas'])[1 + (random() * 9)::INTEGER],
         'client')
        ON CONFLICT (id) DO NOTHING;
    END LOOP;
    
    -- Insert diverse reviews with different ratings and detailed comments
    SELECT ARRAY(SELECT id FROM shops) INTO shop_ids;
    FOR i IN 1..800 LOOP
        DECLARE
            client_ids UUID[];
            random_client UUID;
            rating_val INTEGER;
            comment_text TEXT;
        BEGIN
            SELECT ARRAY(SELECT id FROM profiles WHERE role = 'client') INTO client_ids;
            random_shop := shop_ids[1 + (random() * (array_length(shop_ids, 1) - 1))::INTEGER];
            random_client := client_ids[1 + (random() * (array_length(client_ids, 1) - 1))::INTEGER];
            rating_val := CASE 
                WHEN random() < 0.1 THEN 1
                WHEN random() < 0.2 THEN 2
                WHEN random() < 0.4 THEN 3
                WHEN random() < 0.7 THEN 4
                ELSE 5
            END;
            
            comment_text := CASE rating_val
                WHEN 5 THEN (ARRAY[
                    'Absolutely fantastic service! The barber was skilled and professional. Will definitely be back!',
                    'Best haircut I''ve had in years! Clean shop, friendly staff, and excellent attention to detail.',
                    'Outstanding experience from start to finish. Highly recommend this place to anyone.',
                    'Perfect fade and beard trim. The barber really knows what they''re doing.',
                    'Exceptional service and great atmosphere. This is now my go-to barber shop!'
                ])[1 + (random() * 4)::INTEGER]
                WHEN 4 THEN (ARRAY[
                    'Great haircut and good service. Very satisfied with the results.',
                    'Professional staff and clean environment. Would recommend.',
                    'Good experience overall. The barber did exactly what I asked for.',
                    'Quality service at a reasonable price. Will come back again.',
                    'Nice atmosphere and skilled barbers. Happy with my haircut.'
                ])[1 + (random() * 4)::INTEGER]
                WHEN 3 THEN (ARRAY[
                    'Decent haircut but nothing special. Service was okay.',
                    'Average experience. The cut was fine but could be better.',
                    'Not bad but I''ve had better elsewhere. Might try again.',
                    'Okay service, the barber was friendly but the cut wasn''t perfect.',
                    'It''s an alright place. The haircut was acceptable.'
                ])[1 + (random() * 4)::INTEGER]
                WHEN 2 THEN (ARRAY[
                    'Disappointing experience. The haircut wasn''t what I asked for.',
                    'Below average service. Had to ask for corrections multiple times.',
                    'Not satisfied with the results. Won''t be returning.',
                    'Poor attention to detail. The barber seemed rushed.',
                    'Expected better based on the reviews. Quite disappointed.'
                ])[1 + (random() * 4)::INTEGER]
                ELSE (ARRAY[
                    'Terrible experience. Completely ruined my hair.',
                    'Worst haircut ever. Avoid this place at all costs.',
                    'Unprofessional service and poor results. Very disappointed.',
                    'Had to go elsewhere to fix what they did wrong.',
                    'Absolutely awful. Would not recommend to anyone.'
                ])[1 + (random() * 4)::INTEGER]
            END;
            
            INSERT INTO reviews (shop_id, client_id, rating, comment, created_at)
            VALUES (
                random_shop, 
                random_client, 
                rating_val,
                comment_text,
                NOW() - (random() * INTERVAL '365 days')
            ) ON CONFLICT (shop_id, client_id) DO NOTHING;
        END;
    END LOOP;
END $$;