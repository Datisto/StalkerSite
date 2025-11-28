/*
  # Rules Management System

  1. New Tables
    - `rule_categories`
      - `id` (uuid, primary key)
      - `title` (text) - Category title (e.g., "Основні правила")
      - `slug` (text, unique) - URL-friendly identifier
      - `order_index` (integer) - Display order
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `rules`
      - `id` (uuid, primary key)
      - `category_id` (uuid, foreign key to rule_categories)
      - `number` (text) - Rule number (e.g., "1.1", "2.3.1")
      - `title` (text) - Short rule title
      - `content` (text) - Full rule description
      - `order_index` (integer) - Display order within category
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on both tables
    - Anyone can read rules (public access)
    - Only authenticated users can modify rules (admin check will be on frontend)

  3. Indexes
    - Index on category_id for faster lookups
    - Index on slug for category lookups
    - Index on order_index for sorting
*/

-- Create rule_categories table
CREATE TABLE IF NOT EXISTS rule_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  slug text UNIQUE NOT NULL,
  order_index integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create rules table
CREATE TABLE IF NOT EXISTS rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid REFERENCES rule_categories(id) ON DELETE CASCADE,
  number text NOT NULL,
  title text NOT NULL,
  content text NOT NULL,
  order_index integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE rule_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE rules ENABLE ROW LEVEL SECURITY;

-- Public read access
CREATE POLICY "Anyone can read rule categories"
  ON rule_categories FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Anyone can read rules"
  ON rules FOR SELECT
  TO public
  USING (true);

-- Authenticated write access (categories)
CREATE POLICY "Authenticated users can insert rule categories"
  ON rule_categories FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update rule categories"
  ON rule_categories FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete rule categories"
  ON rule_categories FOR DELETE
  TO authenticated
  USING (true);

-- Authenticated write access (rules)
CREATE POLICY "Authenticated users can insert rules"
  ON rules FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update rules"
  ON rules FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete rules"
  ON rules FOR DELETE
  TO authenticated
  USING (true);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_rules_category_id ON rules(category_id);
CREATE INDEX IF NOT EXISTS idx_rule_categories_slug ON rule_categories(slug);
CREATE INDEX IF NOT EXISTS idx_rule_categories_order ON rule_categories(order_index);
CREATE INDEX IF NOT EXISTS idx_rules_order ON rules(order_index);

-- Insert initial categories and rules
INSERT INTO rule_categories (title, slug, order_index) VALUES
  ('Основні правила сервера', 'main-rules', 1),
  ('Правила поведінки в грі (IC)', 'ic-rules', 2),
  ('Правила взаємодії з гравцями (OOC)', 'ooc-rules', 3),
  ('Правила бойових дій', 'combat-rules', 4),
  ('Правила торгівлі та економіки', 'economy-rules', 5),
  ('Санкції та покарання', 'sanctions', 6)
ON CONFLICT (slug) DO NOTHING;

-- Get category IDs and insert rules
DO $$
DECLARE
  main_rules_id uuid;
  ic_rules_id uuid;
  ooc_rules_id uuid;
  combat_rules_id uuid;
  economy_rules_id uuid;
  sanctions_id uuid;
BEGIN
  SELECT id INTO main_rules_id FROM rule_categories WHERE slug = 'main-rules';
  SELECT id INTO ic_rules_id FROM rule_categories WHERE slug = 'ic-rules';
  SELECT id INTO ooc_rules_id FROM rule_categories WHERE slug = 'ooc-rules';
  SELECT id INTO combat_rules_id FROM rule_categories WHERE slug = 'combat-rules';
  SELECT id INTO economy_rules_id FROM rule_categories WHERE slug = 'economy-rules';
  SELECT id INTO sanctions_id FROM rule_categories WHERE slug = 'sanctions';

  -- Main rules
  INSERT INTO rules (category_id, number, title, content, order_index) VALUES
    (main_rules_id, '1.1', 'Незнання правил не звільняє від відповідальності', 'Кожен гравець зобов''язаний ознайомитися з правилами сервера перед грою.', 1),
    (main_rules_id, '1.2', 'Адміністрація має право вносити зміни', 'Адміністрація залишає за собою право вносити зміни до правил без попереднього повідомлення.', 2),
    (main_rules_id, '1.3', 'Дотримання духу правил', 'Гравці повинні дотримуватися не лише букви, але й духу правил.', 3)
  ON CONFLICT DO NOTHING;

  -- IC rules
  INSERT INTO rules (category_id, number, title, content, order_index) VALUES
    (ic_rules_id, '2.1', 'Roleplay обов''язковий', 'Усі дії в грі повинні мати roleplay обґрунтування.', 1),
    (ic_rules_id, '2.2', 'Заборонено RDM', 'Random Deathmatch - вбивство без roleplay причини суворо заборонено.', 2),
    (ic_rules_id, '2.3', 'Fear RP', 'Ваш персонаж цінує своє життя і боїться смерті. Діяти необхідно відповідно до ситуації.', 3),
    (ic_rules_id, '2.4', 'PowerGaming заборонено', 'Заборонено виконувати дії, які фізично неможливі для вашого персонажа.', 4)
  ON CONFLICT DO NOTHING;

  -- OOC rules
  INSERT INTO rules (category_id, number, title, content, order_index) VALUES
    (ooc_rules_id, '3.1', 'Заборонено метагейминг', 'Використання інформації, отриманої поза грою (Discord, стріми) в IC ситуаціях заборонено.', 1),
    (ooc_rules_id, '3.2', 'Повага до інших гравців', 'Токсична поведінка, образи та провокації неприпустимі як в грі, так і в Discord.', 2),
    (ooc_rules_id, '3.3', 'Заборонено спам', 'Спам у чаті або голосом заборонено.', 3)
  ON CONFLICT DO NOTHING;

  -- Combat rules
  INSERT INTO rules (category_id, number, title, content, order_index) VALUES
    (combat_rules_id, '4.1', 'Правило нового життя (NLR)', 'Після смерті персонаж забуває події, що призвели до неї. Заборонено повертатися на місце смерті протягом 30 хвилин.', 1),
    (combat_rules_id, '4.2', 'Взяття в заручники', 'Дозволено за наявності roleplay причини. Необхідно забезпечити можливість для переговорів.', 2),
    (combat_rules_id, '4.3', 'Пограбування', 'Дозволено з roleplay причиною. Заборонено забирати все спорядження - залиште базові речі для виживання.', 3)
  ON CONFLICT DO NOTHING;

  -- Economy rules
  INSERT INTO rules (category_id, number, title, content, order_index) VALUES
    (economy_rules_id, '5.1', 'Чесна торгівля', 'Шахрайство в торгівлі має мати IC наслідки, але не повинно виходити за межі roleplay.', 1),
    (economy_rules_id, '5.2', 'Ціноутворення', 'Ціни на товари встановлюються торгівцями, але мають бути адекватними економіці сервера.', 2)
  ON CONFLICT DO NOTHING;

  -- Sanctions
  INSERT INTO rules (category_id, number, title, content, order_index) VALUES
    (sanctions_id, '6.1', 'Попередження', 'За незначні порушення видається попередження.', 1),
    (sanctions_id, '6.2', 'Кік', 'За повторні порушення - виключення з сервера.', 2),
    (sanctions_id, '6.3', 'Бан', 'За грубі порушення або систематичне ігнорування правил - блокування від 1 дня до перманентного бану.', 3)
  ON CONFLICT DO NOTHING;
END $$;