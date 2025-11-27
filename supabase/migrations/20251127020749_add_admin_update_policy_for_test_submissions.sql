/*
  # Add admin update policy for test submissions

  1. Changes
    - Add UPDATE policy for authenticated users (admins) to update test submissions
    - This allows admins to approve/reject tests and add grades
  
  2. Security
    - Only authenticated users can update submissions
    - This includes marking as reviewed, approved, and adding question grades
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'rules_test_submissions' 
    AND policyname = 'Admins can update test submissions'
  ) THEN
    CREATE POLICY "Admins can update test submissions"
      ON rules_test_submissions
      FOR UPDATE
      TO authenticated
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;
