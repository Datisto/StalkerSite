/*
  # Update RLS Policies for Banned Users

  1. Changes
    - Update users table select policy to block banned users from accessing their data
    - Update characters table policies to block banned users
    - Update rules_test_submissions policies to block banned users
    
  2. Security
    - Banned users cannot see or modify their own data
    - Only non-banned users can access player cabinet features
*/

-- Drop and recreate users select policy to include ban check
DROP POLICY IF EXISTS "Users can read own data" ON users;
CREATE POLICY "Users can read own data"
  ON users
  FOR SELECT
  USING (id = auth.uid() AND is_banned = false);

-- Update characters policies to block banned users
DROP POLICY IF EXISTS "Anyone can read characters" ON characters;
CREATE POLICY "Anyone can read characters"
  ON characters
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Anyone can insert characters" ON characters;
CREATE POLICY "Anyone can insert characters"
  ON characters
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.steam_id = characters.steam_id 
      AND users.is_banned = false
    )
  );

DROP POLICY IF EXISTS "Anyone can update own characters" ON characters;
CREATE POLICY "Anyone can update own characters"
  ON characters
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.steam_id = characters.steam_id 
      AND users.is_banned = false
    )
  );

DROP POLICY IF EXISTS "Anyone can delete own characters" ON characters;
CREATE POLICY "Anyone can delete own characters"
  ON characters
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.steam_id = characters.steam_id 
      AND users.is_banned = false
    )
  );

-- Update rules test submissions policies
DROP POLICY IF EXISTS "Anyone can insert test submissions" ON rules_test_submissions;
CREATE POLICY "Anyone can insert test submissions"
  ON rules_test_submissions
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = rules_test_submissions.user_id 
      AND users.is_banned = false
    )
  );

DROP POLICY IF EXISTS "Anyone can read own test submissions" ON rules_test_submissions;
CREATE POLICY "Anyone can read own test submissions"
  ON rules_test_submissions
  FOR SELECT
  USING (
    user_id = auth.uid() 
    OR EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = rules_test_submissions.user_id 
      AND users.is_banned = false
    )
  );
