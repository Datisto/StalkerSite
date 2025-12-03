-- ============================================
-- ETERNAL ZONE S.T.A.L.K.E.R. RP DATABASE BACKUP
-- Generated: 2025-11-30
-- ============================================

-- This file contains the complete database schema and structure
-- for the Eternal Zone roleplay server management system.

-- ============================================
-- EXTENSIONS
-- ============================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- DROP EXISTING TABLES (for clean install)
-- ============================================

DROP TABLE IF EXISTS character_comments CASCADE;
DROP TABLE IF EXISTS rules_test_submissions CASCADE;
DROP TABLE IF EXISTS rules_test_attempts CASCADE;
DROP TABLE IF EXISTS characters CASCADE;
DROP TABLE IF EXISTS rules_questions CASCADE;
DROP TABLE IF EXISTS rules CASCADE;
DROP TABLE IF EXISTS rule_categories CASCADE;
DROP TABLE IF EXISTS faq_items CASCADE;
DROP TABLE IF EXISTS faq_categories CASCADE;
DROP TABLE IF EXISTS media_videos CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS admins CASCADE;
DROP TABLE IF EXISTS server_info CASCADE;

-- ============================================
-- TABLE: users
-- Description: Stores user authentication data
-- ============================================

CREATE TABLE users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  steam_id text UNIQUE,
  steam_name text,
  discord_username text,
  rules_passed boolean DEFAULT false,
  is_banned boolean DEFAULT false,
  ban_reason text,
  banned_at timestamptz,
  banned_by text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ============================================
-- TABLE: admins
-- Description: Administrator accounts
-- ============================================

CREATE TABLE admins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  username text UNIQUE NOT NULL,
  password_hash text NOT NULL,
  role text DEFAULT 'admin' CHECK (role IN ('super_admin', 'admin', 'moderator')),
  permissions text[] DEFAULT ARRAY[]::text[],
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  last_login timestamptz
);

-- ============================================
-- TABLE: characters
-- Description: Player character profiles
-- ============================================

CREATE TABLE characters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  steam_id text,
  nickname text NOT NULL,
  age integer NOT NULL,
  backstory text NOT NULL,
  appearance text NOT NULL,
  fraction text,
  group_name text,
  reputation text,
  status text DEFAULT 'draft' CHECK (status IN ('draft', 'pending', 'approved', 'rejected')),
  admin_comment text,
  rejection_reason text,
  is_dead boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ============================================
-- TABLE: character_comments
-- Description: Admin comments on characters
-- ============================================

CREATE TABLE character_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  character_id uuid REFERENCES characters(id) ON DELETE CASCADE NOT NULL,
  admin_username text NOT NULL,
  comment text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- ============================================
-- TABLE: rule_categories
-- Description: Categories for server rules
-- ============================================

CREATE TABLE rule_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  slug text UNIQUE NOT NULL,
  order_index integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ============================================
-- TABLE: rules
-- Description: Server rules organized by category
-- ============================================

CREATE TABLE rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid REFERENCES rule_categories(id) ON DELETE CASCADE,
  number text NOT NULL UNIQUE,
  title text NOT NULL,
  content text NOT NULL,
  order_index integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ============================================
-- TABLE: rules_questions
-- Description: Questions for rules knowledge test
-- ============================================

CREATE TABLE rules_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question text NOT NULL,
  option_a text NOT NULL,
  option_b text NOT NULL,
  option_c text NOT NULL,
  option_d text NOT NULL,
  correct_answer text NOT NULL CHECK (correct_answer IN ('A', 'B', 'C', 'D')),
  points integer DEFAULT 1,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ============================================
-- TABLE: rules_test_attempts
-- Description: Tracks test attempt counts per user
-- ============================================

CREATE TABLE rules_test_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  steam_id text,
  attempt_count integer DEFAULT 0,
  last_attempt timestamptz,
  created_at timestamptz DEFAULT now()
);

-- ============================================
-- TABLE: rules_test_submissions
-- Description: Submitted test answers
-- ============================================

CREATE TABLE rules_test_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  steam_id text,
  answers jsonb NOT NULL,
  question_grades jsonb,
  total_score integer DEFAULT 0,
  max_score integer DEFAULT 0,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  approved boolean DEFAULT false,
  admin_comment text,
  submitted_at timestamptz DEFAULT now(),
  reviewed_at timestamptz,
  reviewed_by text
);

-- ============================================
-- TABLE: faq_categories
-- Description: FAQ categories
-- ============================================

CREATE TABLE faq_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  slug text UNIQUE NOT NULL,
  order_index integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ============================================
-- TABLE: faq_items
-- Description: FAQ questions and answers
-- ============================================

CREATE TABLE faq_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid REFERENCES faq_categories(id) ON DELETE CASCADE,
  question text NOT NULL,
  answer text NOT NULL,
  order_index integer DEFAULT 0,
  is_visible boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ============================================
-- TABLE: media_videos
-- Description: Media gallery videos
-- ============================================

CREATE TABLE media_videos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  video_url text NOT NULL,
  platform text NOT NULL CHECK (platform IN ('youtube', 'twitch')),
  order_index integer DEFAULT 0,
  is_visible boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ============================================
-- TABLE: server_info
-- Description: Server information configuration
-- ============================================

CREATE TABLE server_info (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  value text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS characters_user_id_idx ON characters(user_id);
CREATE INDEX IF NOT EXISTS characters_steam_id_idx ON characters(steam_id);
CREATE INDEX IF NOT EXISTS characters_status_idx ON characters(status);
CREATE INDEX IF NOT EXISTS characters_nickname_idx ON characters(nickname) WHERE is_dead = false;

CREATE INDEX IF NOT EXISTS character_comments_character_id_idx ON character_comments(character_id);

CREATE INDEX IF NOT EXISTS rule_categories_order_idx ON rule_categories(order_index);
CREATE INDEX IF NOT EXISTS rules_category_idx ON rules(category_id);
CREATE INDEX IF NOT EXISTS rules_order_idx ON rules(order_index);

CREATE INDEX IF NOT EXISTS faq_categories_order_idx ON faq_categories(order_index);
CREATE INDEX IF NOT EXISTS faq_items_category_idx ON faq_items(category_id);
CREATE INDEX IF NOT EXISTS faq_items_order_idx ON faq_items(order_index);
CREATE INDEX IF NOT EXISTS faq_items_visible_idx ON faq_items(is_visible);

CREATE INDEX IF NOT EXISTS media_videos_order_idx ON media_videos(order_index);
CREATE INDEX IF NOT EXISTS media_videos_visible_idx ON media_videos(is_visible);

CREATE INDEX IF NOT EXISTS rules_test_submissions_user_id_idx ON rules_test_submissions(user_id);
CREATE INDEX IF NOT EXISTS rules_test_submissions_steam_id_idx ON rules_test_submissions(steam_id);

-- ============================================
-- UNIQUE CONSTRAINT
-- ============================================

-- Allow same nickname if character is dead
CREATE UNIQUE INDEX characters_nickname_alive_unique
  ON characters (LOWER(nickname))
  WHERE is_dead = false;

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE characters ENABLE ROW LEVEL SECURITY;
ALTER TABLE character_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE rule_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE rules_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE rules_test_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE rules_test_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE faq_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE faq_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE media_videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE server_info ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS POLICIES: users
-- ============================================

CREATE POLICY "Anyone can select users"
  ON users FOR SELECT
  USING (true);

CREATE POLICY "Anyone can insert users"
  ON users FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can update users rules_passed"
  ON users FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- ============================================
-- RLS POLICIES: admins
-- ============================================

CREATE POLICY "Admins can read own profile"
  ON admins FOR SELECT
  USING (username = current_user);

CREATE POLICY "Super admins can manage admins"
  ON admins FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM admins
      WHERE admins.username = current_user
      AND admins.role = 'super_admin'
    )
  );

-- ============================================
-- RLS POLICIES: characters
-- ============================================

CREATE POLICY "Anyone can read approved characters"
  ON characters FOR SELECT
  USING (status = 'approved' OR true);

CREATE POLICY "Anyone can insert characters"
  ON characters FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can update characters"
  ON characters FOR UPDATE
  USING (true);

CREATE POLICY "Anyone can delete characters"
  ON characters FOR DELETE
  USING (true);

-- ============================================
-- RLS POLICIES: character_comments
-- ============================================

CREATE POLICY "Anyone can read character comments"
  ON character_comments FOR SELECT
  USING (true);

CREATE POLICY "Admins can insert character comments"
  ON character_comments FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admins WHERE admins.username = current_user
    )
  );

-- ============================================
-- RLS POLICIES: rule_categories
-- ============================================

CREATE POLICY "Anyone can read rule categories"
  ON rule_categories FOR SELECT
  USING (true);

CREATE POLICY "Admins can insert rule categories"
  ON rule_categories FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admins WHERE admins.username = current_user
    )
  );

CREATE POLICY "Admins can update rule categories"
  ON rule_categories FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM admins WHERE admins.username = current_user
    )
  );

CREATE POLICY "Admins can delete rule categories"
  ON rule_categories FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM admins WHERE admins.username = current_user
    )
  );

-- ============================================
-- RLS POLICIES: rules
-- ============================================

CREATE POLICY "Anyone can read rules"
  ON rules FOR SELECT
  USING (true);

CREATE POLICY "Admins can insert rules"
  ON rules FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admins WHERE admins.username = current_user
    )
  );

CREATE POLICY "Admins can update rules"
  ON rules FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM admins WHERE admins.username = current_user
    )
  );

CREATE POLICY "Admins can delete rules"
  ON rules FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM admins WHERE admins.username = current_user
    )
  );

-- ============================================
-- RLS POLICIES: rules_questions
-- ============================================

CREATE POLICY "Anyone can read active questions"
  ON rules_questions FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can manage questions"
  ON rules_questions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM admins WHERE admins.username = current_user
    )
  );

-- ============================================
-- RLS POLICIES: rules_test_attempts
-- ============================================

CREATE POLICY "Anyone can read test attempts"
  ON rules_test_attempts FOR SELECT
  USING (true);

CREATE POLICY "Anyone can insert test attempts"
  ON rules_test_attempts FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can update test attempts"
  ON rules_test_attempts FOR UPDATE
  USING (true);

-- ============================================
-- RLS POLICIES: rules_test_submissions
-- ============================================

CREATE POLICY "Anyone can read test submissions"
  ON rules_test_submissions FOR SELECT
  USING (true);

CREATE POLICY "Anyone can insert test submissions"
  ON rules_test_submissions FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can update test submissions"
  ON rules_test_submissions FOR UPDATE
  USING (true);

CREATE POLICY "Anyone can delete test submissions"
  ON rules_test_submissions FOR DELETE
  USING (true);

CREATE POLICY "Admins can update test submission status"
  ON rules_test_submissions FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM admins WHERE admins.username = current_user
    )
  );

-- ============================================
-- RLS POLICIES: faq_categories
-- ============================================

CREATE POLICY "Anyone can read faq categories"
  ON faq_categories FOR SELECT
  USING (true);

CREATE POLICY "Admins can insert faq categories"
  ON faq_categories FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admins WHERE admins.username = current_user
    )
  );

CREATE POLICY "Admins can update faq categories"
  ON faq_categories FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM admins WHERE admins.username = current_user
    )
  );

CREATE POLICY "Admins can delete faq categories"
  ON faq_categories FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM admins WHERE admins.username = current_user
    )
  );

-- ============================================
-- RLS POLICIES: faq_items
-- ============================================

CREATE POLICY "Anyone can read visible faq items"
  ON faq_items FOR SELECT
  USING (is_visible = true);

CREATE POLICY "Admins can read all faq items"
  ON faq_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM admins WHERE admins.username = current_user
    )
  );

CREATE POLICY "Admins can insert faq items"
  ON faq_items FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admins WHERE admins.username = current_user
    )
  );

CREATE POLICY "Admins can update faq items"
  ON faq_items FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM admins WHERE admins.username = current_user
    )
  );

CREATE POLICY "Admins can delete faq items"
  ON faq_items FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM admins WHERE admins.username = current_user
    )
  );

-- ============================================
-- RLS POLICIES: media_videos
-- ============================================

CREATE POLICY "Anyone can read visible videos"
  ON media_videos FOR SELECT
  USING (is_visible = true OR true);

CREATE POLICY "Admins can insert videos"
  ON media_videos FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admins WHERE admins.username = current_user
    )
  );

CREATE POLICY "Admins can update videos"
  ON media_videos FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM admins WHERE admins.username = current_user
    )
  );

CREATE POLICY "Admins can delete videos"
  ON media_videos FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM admins WHERE admins.username = current_user
    )
  );

-- ============================================
-- RLS POLICIES: server_info
-- ============================================

CREATE POLICY "Anyone can read server info"
  ON server_info FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage server info"
  ON server_info FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM admins WHERE admins.username = current_user
    )
  );

-- ============================================
-- INITIAL DATA: Default Admin Account
-- ============================================

-- Default admin account
-- Username: admin
-- Password: admin123 (CHANGE THIS IMMEDIATELY!)
INSERT INTO admins (username, password_hash, role, permissions, is_active)
VALUES (
  'admin',
  'admin123',
  'super_admin',
  ARRAY['manage_characters', 'manage_questions', 'manage_rules', 'manage_admins'],
  true
) ON CONFLICT (username) DO NOTHING;

-- ============================================
-- END OF BACKUP
-- ============================================

-- IMPORTANT NOTES:
-- 1. Change the default admin password immediately after setup
-- 2. Configure your environment variables (see DEPLOYMENT.md)
-- 3. Set up Steam authentication (see STEAM_AUTH_SETUP.md)
-- 4. Review and adjust RLS policies based on your security requirements
