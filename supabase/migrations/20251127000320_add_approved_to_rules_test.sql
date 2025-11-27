/*
  # Додавання поля approved до rules_test_submissions

  Додаємо поле для відстеження схвалення тесту правил.
  Після схвалення користувач зможе створити персонажа.
*/

ALTER TABLE rules_test_submissions
ADD COLUMN IF NOT EXISTS approved BOOLEAN DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_rules_test_user_approved 
ON rules_test_submissions(user_id, approved);
