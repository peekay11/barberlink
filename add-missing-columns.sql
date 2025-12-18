-- Add missing columns to existing tables

-- Add missing columns to shops table
ALTER TABLE shops ADD COLUMN IF NOT EXISTS last_featured_at TIMESTAMP;

-- Add missing columns to reviews table (if user_id doesn't exist)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='reviews' AND column_name='user_id') THEN
        ALTER TABLE reviews ADD COLUMN user_id UUID REFERENCES profiles(id);
    END IF;
END $$;

-- Create missing indexes
CREATE INDEX IF NOT EXISTS idx_reviews_user ON reviews(user_id);

-- Update RLS policies for reviews
DROP POLICY IF EXISTS "reviews_insert" ON reviews;
DROP POLICY IF EXISTS "reviews_update" ON reviews;

CREATE POLICY "reviews_insert" ON reviews FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "reviews_update" ON reviews FOR UPDATE USING (auth.uid() = user_id);