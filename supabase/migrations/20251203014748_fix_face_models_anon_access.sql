/*
  # Fix face_models anonymous access

  1. Changes
    - Add policy for anonymous users to view active face models
    - This allows unauthenticated users during character creation to see face models

  2. Security
    - Read-only access
    - Only active models visible
*/

-- Allow anonymous users to view active face models
CREATE POLICY "Anonymous users can view active face models"
  ON face_models
  FOR SELECT
  TO anon
  USING (is_active = true);
