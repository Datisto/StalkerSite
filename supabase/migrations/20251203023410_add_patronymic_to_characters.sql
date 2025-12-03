/*
  # Add patronymic field to characters table

  1. Changes
    - Add `patronymic` column to `characters` table
      - Type: text
      - Nullable: true (optional field)
      - Position: after `surname` column
    - This field stores the patronymic (по батькові) of the character

  2. Notes
    - Patronymic is optional as not all characters may have one
    - No RLS changes needed as it follows existing character policies
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'characters' AND column_name = 'patronymic'
  ) THEN
    ALTER TABLE characters ADD COLUMN patronymic text;
  END IF;
END $$;