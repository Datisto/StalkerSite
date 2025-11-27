/*
  # Allow anon to update test submissions

  1. Changes
    - Add UPDATE policy for anon role to update test submissions
    - This is needed because admins use local authentication, not Supabase Auth
    - Admins can approve/reject tests and add grades
  
  2. Security
    - This is a temporary solution until proper admin authentication is implemented
    - In production, admins should use Supabase Auth or Edge Functions with service role
*/

DROP POLICY IF EXISTS "Admins can update test submissions" ON rules_test_submissions;

CREATE POLICY "Allow update test submissions"
  ON rules_test_submissions
  FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);
