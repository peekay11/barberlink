-- Add CASCADE DELETE to ensure proper cleanup when users delete accounts

-- Update foreign key constraints to cascade deletes
ALTER TABLE shops DROP CONSTRAINT IF EXISTS shops_owner_id_fkey;
ALTER TABLE shops ADD CONSTRAINT shops_owner_id_fkey 
  FOREIGN KEY (owner_id) REFERENCES profiles(id) ON DELETE CASCADE;

ALTER TABLE reviews DROP CONSTRAINT IF EXISTS reviews_user_id_fkey;
ALTER TABLE reviews ADD CONSTRAINT reviews_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- Create function to handle account deletion
CREATE OR REPLACE FUNCTION delete_user_account(user_uuid UUID)
RETURNS void AS $$
BEGIN
  -- Delete all user data (cascades to shops and reviews)
  DELETE FROM profiles WHERE id = user_uuid;
  
  -- Delete auth user
  DELETE FROM auth.users WHERE id = user_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;