/*
  # Add Media Videos Table

  1. New Tables
    - `media_videos`
      - `id` (uuid, primary key)
      - `title` (text) - Назва відео
      - `description` (text) - Опис відео
      - `video_url` (text) - URL відео з YouTube або Twitch
      - `platform` (text) - Платформа (youtube або twitch)
      - `thumbnail_url` (text) - URL мініатюри відео
      - `display_order` (integer) - Порядок відображення
      - `is_visible` (boolean) - Чи відображається відео
      - `created_at` (timestamptz) - Дата створення
      - `updated_at` (timestamptz) - Дата оновлення

  2. Security
    - Enable RLS on `media_videos` table
    - Add policy for public read access to visible videos
    - Add policy for admin insert/update/delete access
*/

CREATE TABLE IF NOT EXISTS media_videos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text DEFAULT '',
  video_url text NOT NULL,
  platform text NOT NULL CHECK (platform IN ('youtube', 'twitch')),
  thumbnail_url text DEFAULT '',
  display_order integer DEFAULT 0,
  is_visible boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE media_videos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view visible media videos"
  ON media_videos
  FOR SELECT
  USING (is_visible = true);

CREATE POLICY "Admins can insert media videos"
  ON media_videos
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admins WHERE id = auth.uid()
    )
  );

CREATE POLICY "Admins can update media videos"
  ON media_videos
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admins WHERE id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admins WHERE id = auth.uid()
    )
  );

CREATE POLICY "Admins can delete media videos"
  ON media_videos
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admins WHERE id = auth.uid()
    )
  );

CREATE INDEX IF NOT EXISTS idx_media_videos_display_order ON media_videos(display_order);
CREATE INDEX IF NOT EXISTS idx_media_videos_is_visible ON media_videos(is_visible);