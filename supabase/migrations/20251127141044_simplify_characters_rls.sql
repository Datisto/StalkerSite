/*
  # Simplify Characters RLS for Testing
  
  1. Changes
    - Drop all existing character policies
    - Create one simple policy allowing all operations for anon users
    - This is temporary for debugging access issues
  
  2. Security Note
    - This is permissive for testing
    - Will be tightened after confirming access works
*/

-- Drop all existing policies
DROP POLICY IF EXISTS "Allow delete characters" ON characters;
DROP POLICY IF EXISTS "Anonymous users can create characters" ON characters;
DROP POLICY IF EXISTS "Anonymous users can update characters" ON characters;
DROP POLICY IF EXISTS "Anonymous users can view characters" ON characters;
DROP POLICY IF EXISTS "Users can insert own characters" ON characters;
DROP POLICY IF EXISTS "Users can update own draft characters" ON characters;
DROP POLICY IF EXISTS "Users can view own characters" ON characters;

-- Create one simple permissive policy for testing
CREATE POLICY "Allow all operations for anon users"
  ON characters
  FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);
