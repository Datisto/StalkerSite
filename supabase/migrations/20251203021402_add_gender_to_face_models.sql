/*
  # Add gender field to face_models table

  1. Changes
    - Add gender column to face_models table (male/female)
    - Set gender values for existing face models based on names
    - Add check constraint to ensure gender is either 'male' or 'female'

  2. Notes
    - Standard models will be assigned based on typical gendered names
    - Unique models will be assigned based on character context
*/

-- Add gender column
ALTER TABLE face_models 
ADD COLUMN IF NOT EXISTS gender text;

-- Update existing models with gender
UPDATE face_models SET gender = 'male' WHERE name = 'Іван "Сталкер" Петренко';
UPDATE face_models SET gender = 'male' WHERE name = 'Олександр "Вовк" Коваленко';
UPDATE face_models SET gender = 'male' WHERE name = 'Дмитро "Тінь" Сидоренко';
UPDATE face_models SET gender = 'male' WHERE name = 'Андрій "Ворон" Мельник';
UPDATE face_models SET gender = 'male' WHERE name = 'Михайло "Скарб" Борисенко';
UPDATE face_models SET gender = 'male' WHERE name = 'Survivor_Mirek';
UPDATE face_models SET gender = 'male' WHERE name = 'Професор Захаров';
UPDATE face_models SET gender = 'male' WHERE name = 'Майор Дегтярьов';

-- Add check constraint
ALTER TABLE face_models
ADD CONSTRAINT face_models_gender_check CHECK (gender IN ('male', 'female'));