/*
  # Add unique constraint for nicknames excluding dead characters

  1. Changes
    - Add unique partial index on nickname column
    - Index only applies to characters that are NOT dead
    - This allows nickname reuse after character dies

  2. Notes
    - Dead characters don't block nickname availability
    - Multiple dead characters can have the same nickname
    - Only one living character can have a specific nickname
*/

-- Create unique partial index for nicknames (excluding dead characters)
CREATE UNIQUE INDEX IF NOT EXISTS characters_nickname_unique_alive 
  ON characters (nickname) 
  WHERE status != 'dead' AND nickname IS NOT NULL;
