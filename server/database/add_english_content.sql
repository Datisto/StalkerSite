-- MySQL: run ONCE against an existing database, before deploying the updated API.
-- Existing Ukrainian text, rule IDs, numbering, ordering and hierarchy are preserved.
-- New installations use schema.sql, which already includes these columns.
-- DDL auto-commits in MySQL. Back up the database before applying schema changes.
-- Deploy the updated API after this migration, then deploy the rebuilt frontend.
-- English columns are optional: NULL means use the original Ukrainian text.

ALTER TABLE rules_categories
  ADD COLUMN name_en VARCHAR(255) DEFAULT NULL AFTER name;

ALTER TABLE rules
  ADD COLUMN title_en VARCHAR(255) DEFAULT NULL AFTER title,
  ADD COLUMN content_en TEXT DEFAULT NULL AFTER content;

ALTER TABLE rules_questions
  ADD COLUMN question_text_en TEXT DEFAULT NULL AFTER question_text,
  ADD COLUMN category_en VARCHAR(255) DEFAULT NULL AFTER category;

-- Historical submissions used the Ukrainian questions.
ALTER TABLE rules_test_submissions
  ADD COLUMN language VARCHAR(2) NOT NULL DEFAULT 'uk' AFTER steam_id;
