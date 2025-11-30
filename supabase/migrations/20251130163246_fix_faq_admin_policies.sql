/*
  # Fix FAQ Admin Access Policies

  1. Changes
    - Drop existing admin policies that allow everyone
    - Create proper admin-only policies using admins table check
    - Ensure only authenticated admins can manage FAQ content

  2. Security
    - Public can only read visible FAQ items
    - Only users in admins table can insert/update/delete FAQ content
*/

-- Drop existing overly permissive policies
DROP POLICY IF EXISTS "Admins can manage faq categories" ON faq_categories;
DROP POLICY IF EXISTS "Admins can manage faq items" ON faq_items;

-- Create proper admin-only policies for faq_categories
CREATE POLICY "Admins can insert faq categories"
  ON faq_categories
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admins WHERE admins.username = current_user
    )
  );

CREATE POLICY "Admins can update faq categories"
  ON faq_categories
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM admins WHERE admins.username = current_user
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admins WHERE admins.username = current_user
    )
  );

CREATE POLICY "Admins can delete faq categories"
  ON faq_categories
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM admins WHERE admins.username = current_user
    )
  );

-- Create proper admin-only policies for faq_items
CREATE POLICY "Admins can insert faq items"
  ON faq_items
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admins WHERE admins.username = current_user
    )
  );

CREATE POLICY "Admins can update faq items"
  ON faq_items
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM admins WHERE admins.username = current_user
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admins WHERE admins.username = current_user
    )
  );

CREATE POLICY "Admins can delete faq items"
  ON faq_items
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM admins WHERE admins.username = current_user
    )
  );

-- Admins should also be able to read all items (including hidden)
CREATE POLICY "Admins can read all faq items"
  ON faq_items
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM admins WHERE admins.username = current_user
    )
  );
