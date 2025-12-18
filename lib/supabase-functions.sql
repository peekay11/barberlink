-- Auto-update featured shops function
CREATE OR REPLACE FUNCTION update_featured_shops()
RETURNS void AS $$
DECLARE
  shop_record RECORD;
  featured_count INTEGER := 0;
  max_featured INTEGER := 12;
BEGIN
  -- First, unfeatured all current featured shops
  UPDATE shops SET is_featured = false WHERE is_featured = true;
  
  -- Select top performing shops based on criteria
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
      AND (s.last_featured_at IS NULL OR s.last_featured_at < NOW() - INTERVAL '30 days')
    ORDER BY 
      (COALESCE(AVG(r.rating), 0) * 0.4 + 
       LEAST(COUNT(r.id) / 50.0, 1) * 0.25 + 
       LEAST(s.view_count / 1000.0, 1) * 0.2 + 
       (CASE WHEN s.is_verified THEN 0.1 ELSE 0 END) +
       (CASE WHEN s.created_at > NOW() - INTERVAL '90 days' THEN 0.05 ELSE 0 END)) DESC
    LIMIT max_featured
  LOOP
    -- Update shop to featured
    UPDATE shops 
    SET 
      is_featured = true,
      last_featured_at = NOW()
    WHERE id = shop_record.id;
    
    featured_count := featured_count + 1;
  END LOOP;
  
  -- Log the update
  INSERT INTO featured_updates (updated_at, shops_featured) 
  VALUES (NOW(), featured_count);
END;
$$ LANGUAGE plpgsql;

-- Create table to track featured updates
CREATE TABLE IF NOT EXISTS featured_updates (
  id SERIAL PRIMARY KEY,
  updated_at TIMESTAMP DEFAULT NOW(),
  shops_featured INTEGER
);

-- Add last_featured_at column to shops table if it doesn't exist
ALTER TABLE shops ADD COLUMN IF NOT EXISTS last_featured_at TIMESTAMP;