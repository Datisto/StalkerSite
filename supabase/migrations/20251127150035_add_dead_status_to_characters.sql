/*
  # Add 'dead' status to characters

  1. Changes
    - Add 'dead' status to characters.status CHECK constraint
    - This allows admins to mark characters as dead
    - Dead characters will not block nickname availability
    - Dead characters will not block new character creation

  2. Notes
    - Users with dead characters can create new characters
    - Nicknames from dead characters become available again
*/

-- Drop existing constraint
ALTER TABLE characters DROP CONSTRAINT IF EXISTS characters_status_check;

-- Add new constraint with 'dead' status
ALTER TABLE characters ADD CONSTRAINT characters_status_check 
  CHECK (status IN ('draft', 'pending', 'approved', 'rejected', 'active', 'archived', 'dead'));
