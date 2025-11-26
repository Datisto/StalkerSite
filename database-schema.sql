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
    - `name` (text) - Character name
    - `surname` (text) - Character surname
    - `nickname` (text) - Character nickname
    - `age` (integer) - Character age
    - `gender` (text) - Character gender
    - `origin_country` (text) - Country of origin
    - `citizenship` (text) - Citizenship
    - `faction` (text) - Character faction
    - `biography` (text) - Character biography (up to 1500 chars)
    - `appearance` (text) - Appearance description
    - `psychological_portrait` (text) - Psychological characteristics
    - `skills` (jsonb) - Character skills and abilities
    - `inventory` (jsonb) - Character inventory items
    - `rejection_reason` (text, nullable) - Admin rejection reason
    - `admin_notes` (text, nullable) - Admin private notes
    - `created_at` (timestamptz) - Character creation timestamp
    - `updated_at` (timestamptz) - Last update timestamp
    - `submitted_at` (timestamptz, nullable) - Submission for review timestamp
    - `approved_at` (timestamptz, nullable) - Approval timestamp

  ### 3. `admins` - Admin accounts
    - `id` (uuid, primary key) - Admin unique identifier
    - `user_id` (uuid, foreign key) - Linked user account
    - `username` (text, unique) - Admin login username
    - `password_hash` (text) - Hashed password
    - `role` (text) - Admin role: super_admin, moderator, content_manager
    - `permissions` (jsonb) - Specific permissions array
    - `is_active` (boolean) - Account active status
    - `created_at` (timestamptz) - Account creation timestamp
    - `last_login` (timestamptz) - Last login timestamp

  ### 4. `rules_questions` - Rules testing questions
    - `id` (uuid, primary key) - Question unique identifier
    - `question_text` (text) - The question text
    - `correct_answer` (text) - Correct answer text
    - `incorrect_answers` (jsonb) - Array of incorrect answer options
    - `category` (text) - Question category/section
    - `difficulty` (text) - Question difficulty: easy, medium, hard
    - `is_active` (boolean) - Whether question is active
    - `created_at` (timestamptz) - Creation timestamp
    - `updated_at` (timestamptz) - Last update timestamp

  ### 5. `rules_test_attempts` - User test attempts tracking
    - `id` (uuid, primary key) - Attempt unique identifier
    - `user_id` (uuid, foreign key) - User taking the test
    - `score` (integer) - Test score (0-100)
    - `total_questions` (integer) - Total questions in test
    - `correct_answers` (integer) - Number of correct answers
    - `passed` (boolean) - Whether test was passed
    - `answers` (jsonb) - Detailed answers and results
    - `started_at` (timestamptz) - Test start timestamp
    - `completed_at` (timestamptz) - Test completion timestamp

  ### 6. `server_info` - Server information content
    - `id` (uuid, primary key) - Content unique identifier
    - `section` (text, unique) - Section identifier (about, rules, factions, etc.)
    - `title` (text) - Section title
    - `content` (text) - Section content (HTML)
    - `order_index` (integer) - Display order
    - `is_published` (boolean) - Publication status
    - `updated_at` (timestamptz) - Last update timestamp
    - `updated_by` (uuid, foreign key) - Admin who updated

  ### 7. `character_comments` - Admin comments on characters
    - `id` (uuid, primary key) - Comment unique identifier
    - `character_id` (uuid, foreign key) - Related character
    - `admin_id` (uuid, foreign key) - Admin who commented
    - `comment_text` (text) - Comment content
    - `is_internal` (boolean) - Whether comment is for admins only
    - `created_at` (timestamptz) - Comment creation timestamp

  ## Security
  - Row Level Security (RLS) enabled on all tables
  - Users can only read/update their own data
  - Admins have elevated permissions based on roles
  - Character visibility controlled by status and ownership
*/

-- Users table
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

-- Characters table
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

-- Admins table
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

-- Rules questions table
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

-- Rules test attempts table
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

-- Server info table
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

-- Character comments table
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

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_steam_id ON users(steam_id);
CREATE INDEX IF NOT EXISTS idx_characters_user_id ON characters(user_id);
CREATE INDEX IF NOT EXISTS idx_characters_status ON characters(status);
CREATE INDEX IF NOT EXISTS idx_test_attempts_user_id ON rules_test_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_character_id ON character_comments(character_id);
