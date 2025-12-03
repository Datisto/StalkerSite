/*
  # Create face_models table for character faces

  1. New Tables
    - `face_models`
      - `id` (uuid, primary key) - Unique identifier
      - `name` (text, unique, not null) - Face model name
      - `image_url` (text, not null) - URL to face image
      - `is_unique` (boolean, default false) - Whether face is unique (only one alive character can use it)
      - `display_order` (integer, default 0) - Display order in UI
      - `is_active` (boolean, default true) - Whether model is available for selection
      - `created_at` (timestamptz) - Creation timestamp

  2. Security
    - Enable RLS on `face_models` table
    - Allow public read access for active models
    - Only admins can create, update, or delete face models

  3. Notes
    - Unique faces can only be used by one alive character at a time
    - When a character with unique face dies, the face becomes available again
*/

-- Create face_models table
CREATE TABLE IF NOT EXISTS face_models (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  image_url text NOT NULL,
  is_unique boolean DEFAULT false,
  display_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE face_models ENABLE ROW LEVEL SECURITY;

-- Public can view active face models
CREATE POLICY "Anyone can view active face models"
  ON face_models
  FOR SELECT
  USING (is_active = true);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_face_models_display_order ON face_models(display_order);
CREATE INDEX IF NOT EXISTS idx_face_models_is_unique ON face_models(is_unique);

-- Insert default face models with placeholders
INSERT INTO face_models (name, image_url, is_unique, display_order) VALUES
  ('Модель 1', 'https://placehold.co/200x200/1a1a1a/ffffff?text=Face+1', false, 1),
  ('Модель 2', 'https://placehold.co/200x200/1a1a1a/ffffff?text=Face+2', false, 2),
  ('Модель 3', 'https://placehold.co/200x200/1a1a1a/ffffff?text=Face+3', false, 3),
  ('Модель 4', 'https://placehold.co/200x200/1a1a1a/ffffff?text=Face+4', false, 4),
  ('Модель 5', 'https://placehold.co/200x200/1a1a1a/ffffff?text=Face+5', false, 5),
  ('Унікальне обличчя 1', 'https://placehold.co/200x200/8b0000/ffffff?text=Unique+1', true, 10),
  ('Унікальне обличчя 2', 'https://placehold.co/200x200/8b0000/ffffff?text=Unique+2', true, 11),
  ('Унікальне обличчя 3', 'https://placehold.co/200x200/8b0000/ffffff?text=Unique+3', true, 12)
ON CONFLICT (name) DO NOTHING;
