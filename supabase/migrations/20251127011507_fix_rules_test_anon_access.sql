/*
  # Fix rules test submissions for anonymous users

  1. Changes
    - Add INSERT policy for anonymous users to submit rules test
    - Add SELECT policy for anonymous users to view their submissions
  
  2. Security
    - Anonymous users can submit tests
    - Anonymous users can view all submissions (for admin review)
*/

CREATE POLICY "Anonymous users can submit test"
  ON rules_test_submissions
  FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Anonymous users can view submissions"
  ON rules_test_submissions
  FOR SELECT
  TO anon
  USING (true);
