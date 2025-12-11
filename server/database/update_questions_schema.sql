-- Update rules_questions table to allow NULL for correct_answer
-- This is needed for open-ended questions

ALTER TABLE rules_questions
MODIFY COLUMN correct_answer TEXT DEFAULT NULL;
