/*
  # Allow anon to delete test submissions

  1. Changes
    - Add DELETE policy for anon role to delete test submissions
    - This is needed because admins use local authentication, not Supabase Auth
    - Admins can delete test submissions to allow users to retake the test
  
  2. Security
    - This is a temporary solution until proper admin authentication is implemented
    - In production, admins should use Supabase Auth or Edge Functions with service role
*/

CREATE POLICY "Allow delete test submissions"
  ON rules_test_submissions
  FOR DELETE
  TO anon, authenticated
  USING (true);
