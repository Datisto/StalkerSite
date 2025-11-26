# База даних Supabase - Інструкція з налаштування

Цей проект використовує **Supabase** як базу даних. База даних вже підключена через змінні оточення у файлі `.env`.

## Крок 1: Створення проекту в Supabase

1. Зайдіть на [supabase.com](https://supabase.com)
2. Створіть новий проект або використовуйте існуючий
3. Запам'ятайте Project URL та anon/public API key

## Крок 2: Налаштування змінних оточення

У файлі `.env` у корені проекту додайте ваші дані:

```env
VITE_SUPABASE_URL=your_project_url_here
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

**Важливо:** Замініть значення на ваші реальні дані з Supabase Dashboard!

## Крок 3: Виконання міграцій

Міграції вже виконані автоматично через Supabase MCP Tools. Ваша база даних містить наступні таблиці:

### Створені таблиці:

1. **users** - Користувачі (Steam авторизація)
2. **characters** - Персонажі гравців (з усіма полями згідно вимог)
3. **admins** - Адміністратори
4. **rules_questions** - Питання для тесту правил
5. **rules_test_attempts** - Спроби проходження тесту
6. **server_info** - Інформація про сервер
7. **character_comments** - Коментарі адміністраторів до персонажів

### Поля таблиці characters:

Таблиця `characters` включає ВСІ необхідні поля:

**Основна інформація:**
- steam_id, discord_id, name, surname, nickname, gender, age

**Зовнішність:**
- face_model, hair_color, eye_color, beard_style, special_features

**Фізичні параметри:**
- height (140-210 см), weight (50-120 кг), body_type, physical_features

**Характер:**
- character_traits (JSONB масив), phobias, values

**Фракція:**
- faction (Сталкер/Учений/Військовий)

**Додаткові поля для Ученого:**
- education, scientific_profile, research_motivation

**Додаткові поля для Військового:**
- military_experience, military_rank, military_join_reason

**Біографія (Квента):**
- backstory (мін. 500 символів), zone_motivation, character_goals

**Службові поля:**
- status, rejection_reason, admin_notes, created_at, updated_at, submitted_at, approved_at

## Крок 4: Перевірка RLS (Row Level Security)

Усі таблиці мають налаштовані політики RLS для безпеки:

- Користувачі можуть бачити лише свої власні дані
- Адміністратори мають розширені права доступу
- Персонажі захищені політиками доступу

## Крок 5: Додавання тестових даних (опціонально)

### Додати питання для тесту правил:

```sql
INSERT INTO rules_questions (question_text, correct_answer, incorrect_answers, category, difficulty)
VALUES
  ('Що таке RDM?', 'Вбивство без roleplay причини', '["Вбивство за гроші", "Вбивство ворога", "Вбивство мутантів"]'::jsonb, 'Основні правила', 'easy'),
  ('Чи можна метагеймити?', 'Ні, це заборонено', '["Так, це дозволено", "Тільки з друзями", "Тільки в дискорді"]'::jsonb, 'Основні правила', 'easy'),
  ('Скільки персонажів може мати гравець?', 'Один активний персонаж', '["Необмежено", "До трьох", "До п\'яти"]'::jsonb, 'Правила створення', 'medium');
```

### Створити адміністратора:

```sql
-- Спочатку створіть користувача або прив'яжіть до існуючого Steam користувача
-- Потім додайте адмін запис (пароль потрібно хешувати через bcrypt)
INSERT INTO admins (username, password_hash, role, is_active)
VALUES ('admin', '$2b$10$your_hashed_password_here', 'super_admin', true);
```

**Важливо:** Для хешування паролів використовуйте bcrypt з cost factor 10-12.

## Крок 6: Налаштування Steam авторизації

Для повноцінної роботи потрібно налаштувати Steam OpenID:

1. Зареєструйте ваш сайт на: https://steamcommunity.com/dev/apikey
2. Реалізуйте Steam OpenID flow через Supabase Edge Function або backend сервіс
3. При успішній авторизації створюйте/оновлюйте запис у таблиці `users`

## Перевірка роботи

1. Запустіть проект: `npm run dev`
2. Перевірте підключення до бази даних
3. Спробуйте створити персонажа (потрібна авторизація)
4. Перевірте адмін-панель (потрібен адмін аккаунт)

## Troubleshooting

### Помилка підключення до Supabase
- Перевірте правильність VITE_SUPABASE_URL та VITE_SUPABASE_ANON_KEY
- Переконайтесь що проект Supabase активний

### Помилки RLS
- Перевірте що користувач авторизований
- Переконайтесь що RLS політики створені правильно

### Помилки збереження персонажа
- Перевірте що всі обов'язкові поля заповнені
- Переконайтесь що character_traits є масивом

## Підтримка

При виникненні проблем перевірте:
1. Console у браузері на наявність помилок
2. Supabase Dashboard -> Logs для серверних помилок
3. Правильність типів даних у полях форми
