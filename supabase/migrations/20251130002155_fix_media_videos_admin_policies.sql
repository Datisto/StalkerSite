/*
  # Fix Media Videos Admin Policies

  1. Changes
    - Drop existing admin policies for media_videos
    - Create new policies that check admins table by username instead of auth.uid()
    - Allow admins to insert, update, and delete media videos

  2. Security
    - Maintains RLS protection
    - Public read access remains unchanged
    - Admin operations require valid admin session
*/

DROP POLICY IF EXISTS "Admins can insert media videos" ON media_videos;
DROP POLICY IF EXISTS "Admins can update media videos" ON media_videos;
DROP POLICY IF EXISTS "Admins can delete media videos" ON media_videos;

CREATE POLICY "Admins can insert media videos"
  ON media_videos
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admins WHERE username = current_user AND is_active = true
    )
  );

CREATE POLICY "Admins can update media videos"
  ON media_videos
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM admins WHERE username = current_user AND is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admins WHERE username = current_user AND is_active = true
    )
  );

CREATE POLICY "Admins can delete media videos"
  ON media_videos
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM admins WHERE username = current_user AND is_active = true
    )
  );

CREATE POLICY "Admins can select all media videos"
  ON media_videos
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM admins WHERE username = current_user AND is_active = true
    )
  );