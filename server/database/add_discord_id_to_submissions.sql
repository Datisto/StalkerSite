-- Add discord_id field to rules_test_submissions table
ALTER TABLE rules_test_submissions
ADD COLUMN discord_id VARCHAR(255) DEFAULT NULL AFTER steam_id;
