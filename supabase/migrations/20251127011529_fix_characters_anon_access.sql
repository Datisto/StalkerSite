/*
  # Fix characters table access for anonymous users

  1. Changes
    - Add SELECT policy for anonymous users to view characters
    - Add INSERT policy for anonymous users to create characters
    - Add UPDATE policy for anonymous users to update their characters
  
  2. Security
    - Anonymous users can view all characters
    - Anonymous users can create and update characters
*/

CREATE POLICY "Anonymous users can view characters"
  ON characters
  FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Anonymous users can create characters"
  ON characters
  FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Anonymous users can update characters"
  ON characters
  FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);
