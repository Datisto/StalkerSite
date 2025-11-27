/*
  # Allow anon to delete characters

  1. Changes
    - Add DELETE policy for anon role to delete characters
    - This is needed because admins use local authentication, not Supabase Auth
    - Admins can delete characters from the admin panel
  
  2. Security
    - This is a temporary solution until proper admin authentication is implemented
    - In production, admins should use Supabase Auth or Edge Functions with service role
*/

CREATE POLICY "Allow delete characters"
  ON characters
  FOR DELETE
  TO anon, authenticated
  USING (true);
