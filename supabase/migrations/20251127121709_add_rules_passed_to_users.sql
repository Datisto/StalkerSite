/*
  # Add rules_passed flag to users table

  1. Changes
    - Add `rules_passed` boolean column to users table
    - Default value is false
    - This tracks whether user has successfully passed the rules test
  
  2. Security
    - Column can be read by the user
    - Only admins should update this through the test approval process
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'rules_passed'
  ) THEN
    ALTER TABLE users ADD COLUMN rules_passed boolean DEFAULT false;
  END IF;
END $$;
