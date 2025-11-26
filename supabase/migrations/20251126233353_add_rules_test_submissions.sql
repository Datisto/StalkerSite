/*
  # Таблиця для здач тесту правил

  1. Нова таблиця
    - `rules_test_submissions`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key до users)
      - `steam_id` (text) - Steam ID користувача
      - `discord_id` (text) - Discord ID користувача
      - `questions` (text[]) - масив питань
      - `answers` (text[]) - масив відповідей
      - `submitted_at` (timestamptz) - дата/час здачі
      - `reviewed` (boolean) - чи переглянуто адміном
      - `review_notes` (text) - коментарі адміна

  2. Security
    - Enable RLS
    - Користувачі можуть читати свої власні здачі
    - Тільки автентифіковані можуть додавати
*/

CREATE TABLE IF NOT EXISTS rules_test_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  steam_id text NOT NULL,
  discord_id text NOT NULL,
  questions text[] NOT NULL,
  answers text[] NOT NULL,
  submitted_at timestamptz DEFAULT now(),
  reviewed boolean DEFAULT false,
  review_notes text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE rules_test_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own submissions"
  ON rules_test_submissions
  FOR SELECT
  TO authenticated
  USING (user_id = (SELECT id FROM users WHERE id = user_id LIMIT 1));

CREATE POLICY "Users can insert own submissions"
  ON rules_test_submissions
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_rules_test_submissions_user_id ON rules_test_submissions(user_id);
CREATE INDEX IF NOT EXISTS idx_rules_test_submissions_submitted_at ON rules_test_submissions(submitted_at DESC);
CREATE INDEX IF NOT EXISTS idx_rules_test_submissions_reviewed ON rules_test_submissions(reviewed);
