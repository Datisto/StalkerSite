/*
  # Allow anon to select users

  1. Changes
    - Add SELECT policy for anon role to select users
    - This is needed because admins use local authentication, not Supabase Auth
    - Admins need to view user list in admin panel
  
  2. Security
    - This is a temporary solution until proper admin authentication is implemented
    - In production, admins should use Supabase Auth or Edge Functions with service role
*/

CREATE POLICY "Allow select users"
  ON users
  FOR SELECT
  TO anon, authenticated
  USING (true);
