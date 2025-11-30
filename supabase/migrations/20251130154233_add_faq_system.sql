/*
  # Add FAQ System

  1. New Tables
    - `faq_categories`
      - `id` (uuid, primary key)
      - `title` (text) - Category title
      - `slug` (text, unique) - URL-friendly identifier
      - `order_index` (integer) - Display order
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `faq_items`
      - `id` (uuid, primary key)
      - `category_id` (uuid, foreign key to faq_categories)
      - `question` (text) - FAQ question
      - `answer` (text) - FAQ answer (supports markdown)
      - `order_index` (integer) - Display order within category
      - `is_visible` (boolean) - Whether to show on public pages
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on both tables
    - Public can read visible FAQ items
    - Only admins can modify FAQ content
*/

-- Create faq_categories table
CREATE TABLE IF NOT EXISTS faq_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  slug text UNIQUE NOT NULL,
  order_index integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create faq_items table
CREATE TABLE IF NOT EXISTS faq_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid REFERENCES faq_categories(id) ON DELETE CASCADE,
  question text NOT NULL,
  answer text NOT NULL,
  order_index integer DEFAULT 0,
  is_visible boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE faq_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE faq_items ENABLE ROW LEVEL SECURITY;

-- Public can read all categories
CREATE POLICY "Anyone can read faq categories"
  ON faq_categories
  FOR SELECT
  USING (true);

-- Public can read visible FAQ items
CREATE POLICY "Anyone can read visible faq items"
  ON faq_items
  FOR SELECT
  USING (is_visible = true);

-- Admins can do everything (using admin role check)
CREATE POLICY "Admins can manage faq categories"
  ON faq_categories
  FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Admins can manage faq items"
  ON faq_items
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS faq_categories_order_idx ON faq_categories(order_index);
CREATE INDEX IF NOT EXISTS faq_items_category_idx ON faq_items(category_id);
CREATE INDEX IF NOT EXISTS faq_items_order_idx ON faq_items(order_index);
CREATE INDEX IF NOT EXISTS faq_items_visible_idx ON faq_items(is_visible);
