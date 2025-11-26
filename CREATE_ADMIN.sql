-- Створення тестового адміністратора
-- Виконайте цей SQL в Supabase SQL Editor

-- ВАЖЛИВО: Це тестовий адміністратор з простим паролем
-- В продакшені використовуйте bcrypt для хешування паролів!

INSERT INTO admins (username, password_hash, role, is_active, created_at)
VALUES
  ('admin', 'admin123', 'super_admin', true, now()),
  ('moderator', 'mod123', 'moderator', true, now())
ON CONFLICT (username) DO NOTHING;

-- Перевірка створення
SELECT id, username, role, is_active, created_at
FROM admins;

-- Тепер ви можете увійти:
-- Логін: admin
-- Пароль: admin123
--
-- Або:
-- Логін: moderator
-- Пароль: mod123
