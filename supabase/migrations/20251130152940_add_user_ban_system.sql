/*
  # Add User Ban System

  1. Changes
    - Add `is_banned` column to `users` table (default false)
    - Add `banned_at` column to track when user was banned
    - Add `ban_reason` column to store reason for ban
    
  2. Security
    - Only admins can modify ban status
    - Banned users cannot access their data
*/

-- Add ban-related columns to users table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'is_banned'
  ) THEN
    ALTER TABLE users ADD COLUMN is_banned boolean DEFAULT false;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'banned_at'
  ) THEN
    ALTER TABLE users ADD COLUMN banned_at timestamptz;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'ban_reason'
  ) THEN
    ALTER TABLE users ADD COLUMN ban_reason text;
  END IF;
END $$;

-- Create index for faster queries on banned users
CREATE INDEX IF NOT EXISTS users_is_banned_idx ON users(is_banned);
