/*
  # Add Steam ID to Characters Table
  
  1. Changes
    - Add `steam_id` column to `characters` table
    - Populate existing characters with steam_id from users table
    - Create index on steam_id for fast lookups
  
  2. Purpose
    - Direct Steam ID reference for reliable access control
    - Prevents issues when user_id changes
    - Allows admin to see player's Steam ID
*/

-- Add steam_id column
ALTER TABLE characters 
ADD COLUMN IF NOT EXISTS steam_id text;

-- Populate steam_id for existing characters
UPDATE characters c
SET steam_id = u.steam_id
FROM users u
WHERE c.user_id = u.id
AND c.steam_id IS NULL;

-- Create index for fast lookups
CREATE INDEX IF NOT EXISTS idx_characters_steam_id ON characters(steam_id);
