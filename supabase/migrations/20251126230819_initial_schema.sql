/*
  # Stalker RP Database Schema

  ## Overview
  Complete database schema for Stalker RP website including user management,
  character profiles, admin system, and rules testing.

  ## New Tables

  ### 1. `users` - User accounts linked to Steam
    - `id` (uuid, primary key) - User unique identifier
    - `steam_id` (text, unique) - Steam OpenID identifier
    - `steam_nickname` (text) - Steam display name
    - `discord_id` (text, nullable) - Discord user ID for notifications
    - `discord_username` (text, nullable) - Discord username
    - `is_banned` (boolean) - Ban status
    - `ban_reason` (text, nullable) - Reason for ban if applicable
    - `created_at` (timestamptz) - Account creation timestamp
    - `last_login` (timestamptz) - Last login timestamp

  ### 2. `characters` - Player character profiles
    - `id` (uuid, primary key) - Character unique identifier
    - `user_id` (uuid, foreign key) - Owner user ID
    - `status` (text) - Character status: draft, pending, approved, rejected, active, archived
    - Basic character information fields
    - Biography and appearance
    - Skills and inventory

  ### 3. `admins` - Admin accounts
  ### 4. `rules_questions` - Rules testing questions  
  ### 5. `rules_test_attempts` - User test attempts tracking
  ### 6. `server_info` - Server information content
  ### 7. `character_comments` - Admin comments on characters

  ## Security
  - Row Level Security (RLS) enabled on all tables
  - Users can only read/update their own data
  - Admins have elevated permissions based on roles
  - Character visibility controlled by status and ownership
*/

CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  steam_id text UNIQUE NOT NULL,
  steam_nickname text NOT NULL,
  discord_id text,
  discord_username text,
  is_banned boolean DEFAULT false,
  ban_reason text,
  created_at timestamptz DEFAULT now(),
  last_login timestamptz DEFAULT now()
);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON users FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE TABLE IF NOT EXISTS characters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  status text DEFAULT 'draft' CHECK (status IN ('draft', 'pending', 'approved', 'rejected', 'active', 'archived')),
  name text NOT NULL,
  surname text NOT NULL,
  nickname text,
  age integer CHECK (age >= 18 AND age <= 80),
  gender text CHECK (gender IN ('male', 'female')),
  origin_country text,
  citizenship text,
  faction text,
  biography text CHECK (char_length(biography) <= 1500),
  appearance text,
  psychological_portrait text,
  skills jsonb DEFAULT '[]'::jsonb,
  inventory jsonb DEFAULT '[]'::jsonb,
  rejection_reason text,
  admin_notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  submitted_at timestamptz,
  approved_at timestamptz
);

ALTER TABLE characters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own characters"
  ON characters FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own characters"
  ON characters FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own draft characters"
  ON characters FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id AND status IN ('draft', 'rejected'))
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own draft characters"
  ON characters FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id AND status = 'draft');

CREATE TABLE IF NOT EXISTS admins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  username text UNIQUE NOT NULL,
  password_hash text NOT NULL,
  role text DEFAULT 'moderator' CHECK (role IN ('super_admin', 'moderator', 'content_manager')),
  permissions jsonb DEFAULT '[]'::jsonb,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  last_login timestamptz
);

ALTER TABLE admins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view own profile"
  ON admins FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS rules_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question_text text NOT NULL,
  correct_answer text NOT NULL,
  incorrect_answers jsonb DEFAULT '[]'::jsonb,
  category text,
  difficulty text DEFAULT 'medium' CHECK (difficulty IN ('easy', 'medium', 'hard')),
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE rules_questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active questions"
  ON rules_questions FOR SELECT
  TO authenticated
  USING (is_active = true);

CREATE TABLE IF NOT EXISTS rules_test_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  score integer CHECK (score >= 0 AND score <= 100),
  total_questions integer NOT NULL,
  correct_answers integer NOT NULL,
  passed boolean DEFAULT false,
  answers jsonb DEFAULT '[]'::jsonb,
  started_at timestamptz DEFAULT now(),
  completed_at timestamptz
);

ALTER TABLE rules_test_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own test attempts"
  ON rules_test_attempts FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own test attempts"
  ON rules_test_attempts FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS server_info (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  section text UNIQUE NOT NULL,
  title text NOT NULL,
  content text,
  order_index integer DEFAULT 0,
  is_published boolean DEFAULT true,
  updated_at timestamptz DEFAULT now(),
  updated_by uuid REFERENCES admins(id)
);

ALTER TABLE server_info ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view published server info"
  ON server_info FOR SELECT
  TO authenticated
  USING (is_published = true);

CREATE TABLE IF NOT EXISTS character_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  character_id uuid REFERENCES characters(id) ON DELETE CASCADE NOT NULL,
  admin_id uuid REFERENCES admins(id) ON DELETE SET NULL,
  comment_text text NOT NULL,
  is_internal boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE character_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view public comments on own characters"
  ON character_comments FOR SELECT
  TO authenticated
  USING (
    is_internal = false
    AND character_id IN (
      SELECT id FROM characters WHERE user_id = auth.uid()
    )
  );

CREATE INDEX IF NOT EXISTS idx_users_steam_id ON users(steam_id);
CREATE INDEX IF NOT EXISTS idx_characters_user_id ON characters(user_id);
CREATE INDEX IF NOT EXISTS idx_characters_status ON characters(status);
CREATE INDEX IF NOT EXISTS idx_test_attempts_user_id ON rules_test_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_character_id ON character_comments(character_id);