/*
  # Add individual question grading to submissions

  1. Changes
    - Add question_grades column to store correct/incorrect for each question
      Format: array of booleans [true, false, true...] where true = correct
    - This allows admins to mark each question individually
  
  2. Notes
    - Admin can mark each of 15 questions as correct or incorrect
    - System calculates score (e.g., "correct 12/15")
*/

ALTER TABLE rules_test_submissions
ADD COLUMN IF NOT EXISTS question_grades boolean[] DEFAULT NULL;

COMMENT ON COLUMN rules_test_submissions.question_grades IS 'Array of booleans marking each question as correct (true) or incorrect (false)';
