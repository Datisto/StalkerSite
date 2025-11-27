/*
  # Allow anon to update users rules_passed flag

  1. Changes
    - Add UPDATE policy for anon role to update users.rules_passed
    - This is needed because admins use local authentication, not Supabase Auth
    - Admins can mark users as having passed the rules test
  
  2. Security
    - This is a temporary solution until proper admin authentication is implemented
    - In production, admins should use Supabase Auth or Edge Functions with service role
*/

CREATE POLICY "Allow update users rules_passed"
  ON users
  FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);
