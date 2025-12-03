/*
  # Add Discord Username to Users

  1. Changes
    - Add discord_username field to users table
    - Allow users to update their own discord_username
    - Allow admins to update any user's discord_username

  2. Security
    - Users can update their own discord_username
    - Admins can update any discord_username
*/

-- Add discord_username field to users table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'discord_username'
  ) THEN
    ALTER TABLE users ADD COLUMN discord_username text;
  END IF;
END $$;

-- Update RLS policy to allow admins to update discord_username
DROP POLICY IF EXISTS "Admins can update user discord_username" ON users;

CREATE POLICY "Admins can update user discord_username"
  ON users
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM admins WHERE admins.username = current_user
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admins WHERE admins.username = current_user
    )
  );
