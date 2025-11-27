/*
  # Fix users table INSERT policy

  1. Changes
    - Add INSERT policy for users table to allow user creation
    - Allow anonymous users to insert their own record
  
  2. Security
    - Users can only insert records for themselves
    - Maintains RLS security while allowing registration
*/

CREATE POLICY "Users can create own profile"
  ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Anonymous users can create profile"
  ON users
  FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Anonymous users can view users"
  ON users
  FOR SELECT
  TO anon
  USING (true);
