/*
  # Add Extended Character Fields

  ## Summary
  This migration adds all missing fields to the characters table to support
  the complete character creation workflow as specified in the requirements.

  ## Changes to `characters` table
  
  ### Basic Information
  - `discord_id` (text) - User's Discord ID for notifications
  
  ### Appearance Fields
  - `face_model` (text) - Character face model selection
  - `hair_color` (text) - Hair color
  - `eye_color` (text) - Eye color
  - `beard_style` (text, nullable) - Beard/mustache style
  - `special_features` (text, nullable) - Scars, tattoos, etc.
  
  ### Physical Parameters
  - `height` (integer) - Height in cm (140-210)
  - `weight` (integer) - Weight in kg (50-120)
  - `body_type` (text) - Body type/build
  - `physical_features` (text, nullable) - Additional physical features
  
  ### Character Traits
  - `character_traits` (jsonb) - Selected character traits (3-5 from categories)
  - `phobias` (text, nullable) - Character phobias/weaknesses
  - `values` (text, nullable) - Life values and beliefs
  
  ### Faction-Specific Fields
  - `education` (text, nullable) - For Scientists
  - `scientific_profile` (text, nullable) - For Scientists
  - `research_motivation` (text, nullable) - For Scientists
  - `military_experience` (text, nullable) - For Military
  - `military_rank` (text, nullable) - For Military
  - `military_join_reason` (text, nullable) - For Military
  
  ### Biography Fields
  - `backstory` (text) - Character backstory/pre-history (min 500 chars)
  - `zone_motivation` (text) - Motivation for coming to the Zone
  - `character_goals` (text, nullable) - Character's goals
  
  ## Notes
  - All new fields are added safely using IF NOT EXISTS checks
  - Existing data is preserved
  - Fields are made nullable where appropriate for gradual migration
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'characters' AND column_name = 'discord_id'
  ) THEN
    ALTER TABLE characters ADD COLUMN discord_id text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'characters' AND column_name = 'face_model'
  ) THEN
    ALTER TABLE characters ADD COLUMN face_model text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'characters' AND column_name = 'hair_color'
  ) THEN
    ALTER TABLE characters ADD COLUMN hair_color text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'characters' AND column_name = 'eye_color'
  ) THEN
    ALTER TABLE characters ADD COLUMN eye_color text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'characters' AND column_name = 'beard_style'
  ) THEN
    ALTER TABLE characters ADD COLUMN beard_style text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'characters' AND column_name = 'special_features'
  ) THEN
    ALTER TABLE characters ADD COLUMN special_features text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'characters' AND column_name = 'height'
  ) THEN
    ALTER TABLE characters ADD COLUMN height integer;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'characters' AND column_name = 'weight'
  ) THEN
    ALTER TABLE characters ADD COLUMN weight integer;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'characters' AND column_name = 'body_type'
  ) THEN
    ALTER TABLE characters ADD COLUMN body_type text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'characters' AND column_name = 'physical_features'
  ) THEN
    ALTER TABLE characters ADD COLUMN physical_features text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'characters' AND column_name = 'character_traits'
  ) THEN
    ALTER TABLE characters ADD COLUMN character_traits jsonb DEFAULT '[]'::jsonb;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'characters' AND column_name = 'phobias'
  ) THEN
    ALTER TABLE characters ADD COLUMN phobias text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'characters' AND column_name = 'values'
  ) THEN
    ALTER TABLE characters ADD COLUMN values text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'characters' AND column_name = 'education'
  ) THEN
    ALTER TABLE characters ADD COLUMN education text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'characters' AND column_name = 'scientific_profile'
  ) THEN
    ALTER TABLE characters ADD COLUMN scientific_profile text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'characters' AND column_name = 'research_motivation'
  ) THEN
    ALTER TABLE characters ADD COLUMN research_motivation text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'characters' AND column_name = 'military_experience'
  ) THEN
    ALTER TABLE characters ADD COLUMN military_experience text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'characters' AND column_name = 'military_rank'
  ) THEN
    ALTER TABLE characters ADD COLUMN military_rank text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'characters' AND column_name = 'military_join_reason'
  ) THEN
    ALTER TABLE characters ADD COLUMN military_join_reason text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'characters' AND column_name = 'backstory'
  ) THEN
    ALTER TABLE characters ADD COLUMN backstory text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'characters' AND column_name = 'zone_motivation'
  ) THEN
    ALTER TABLE characters ADD COLUMN zone_motivation text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'characters' AND column_name = 'character_goals'
  ) THEN
    ALTER TABLE characters ADD COLUMN character_goals text;
  END IF;
END $$;