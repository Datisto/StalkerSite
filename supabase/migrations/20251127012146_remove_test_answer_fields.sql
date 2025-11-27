/*
  # Remove test answer fields from rules_questions

  1. Changes
    - Remove correct_answer column (not needed for open-ended questions)
    - Remove incorrect_answers column (not needed for open-ended questions)
    - Remove difficulty column (not needed for open-ended questions)
  
  2. Notes
    - These are open-ended questions where players write their own answers
    - Admins review and approve submissions manually
*/

ALTER TABLE rules_questions
DROP COLUMN IF EXISTS correct_answer,
DROP COLUMN IF EXISTS incorrect_answers,
DROP COLUMN IF EXISTS difficulty;
