# База даних Eternal ZONE - Структура

## Загальна інформація

База даних побудована на PostgreSQL з використанням Row Level Security (RLS) для контролю доступу.

---

## Таблиці

### 1. `users` - Користувачі

**Призначення:** Зберігає інформацію про користувачів системи.

| Поле | Тип | Опис |
|------|-----|------|
| `id` | uuid | Унікальний ідентифікатор (PK) |
| `steam_id` | text | Steam ID користувача (унікальний) |
| `steam_name` | text | Нікнейм користувача в Steam |
| `rules_passed` | boolean | Чи здав користувач тест на знання правил |
| `is_banned` | boolean | Чи заблокований користувач |
| `ban_reason` | text | Причина блокування |
| `banned_at` | timestamptz | Час блокування |
| `banned_by` | text | Хто заблокував (username адміна) |
| `created_at` | timestamptz | Дата створення |
| `updated_at` | timestamptz | Дата оновлення |

**RLS:** Публічний доступ на читання/запис (Steam authentication).

---

### 2. `admins` - Адміністратори

**Призначення:** Адміністративні акаунти системи.

| Поле | Тип | Опис |
|------|-----|------|
| `id` | uuid | Унікальний ідентифікатор (PK) |
| `user_id` | uuid | Посилання на користувача (FK users) |
| `username` | text | Логін адміна (унікальний) |
| `password_hash` | text | Хеш пароля |
| `role` | text | Роль (super_admin, admin, moderator) |
| `permissions` | text[] | Масив дозволів |
| `is_active` | boolean | Чи активний акаунт |
| `created_at` | timestamptz | Дата створення |
| `last_login` | timestamptz | Останній вхід |

**RLS:**
- Адміни можуть читати свій профіль
- Тільки super_admin можуть керувати іншими адмінами

**За замовчуванням:**
- Username: `admin`
- Password: `admin123` (ЗМІНІТЬ ПІСЛЯ ВСТАНОВЛЕННЯ!)
- Role: `super_admin`

---

### 3. `characters` - Персонажі

**Призначення:** Анкети персонажів гравців.

| Поле | Тип | Опис |
|------|-----|------|
| `id` | uuid | Унікальний ідентифікатор (PK) |
| `user_id` | uuid | Посилання на користувача (FK users) |
| `steam_id` | text | Steam ID створювача |
| `nickname` | text | Нікнейм персонажа |
| `age` | integer | Вік персонажа |
| `backstory` | text | Передісторія |
| `appearance` | text | Зовнішність |
| `fraction` | text | Фракція |
| `group_name` | text | Група |
| `reputation` | text | Репутація |
| `status` | text | Статус (draft, pending, approved, rejected) |
| `admin_comment` | text | Коментар адміна |
| `rejection_reason` | text | Причина відхилення |
| `is_dead` | boolean | Чи мертвий персонаж |
| `created_at` | timestamptz | Дата створення |
| `updated_at` | timestamptz | Дата оновлення |

**RLS:** Публічний доступ на читання/запис.

**Особливості:**
- Унікальність `nickname` тільки для живих персонажів (`is_dead = false`)
- Індекс на `steam_id`, `status`, `nickname`

---

### 4. `character_comments` - Коментарі до персонажів

**Призначення:** Коментарі адмінів до анкет персонажів.

| Поле | Тип | Опис |
|------|-----|------|
| `id` | uuid | Унікальний ідентифікатор (PK) |
| `character_id` | uuid | Посилання на персонажа (FK characters) |
| `admin_username` | text | Username адміна |
| `comment` | text | Текст коментаря |
| `created_at` | timestamptz | Дата створення |

**RLS:**
- Читати можуть всі
- Додавати можуть тільки адміни

---

### 5. `rule_categories` - Категорії правил

**Призначення:** Категорії для організації правил сервера.

| Поле | Тип | Опис |
|------|-----|------|
| `id` | uuid | Унікальний ідентифікатор (PK) |
| `title` | text | Назва категорії |
| `slug` | text | URL-friendly ідентифікатор (унікальний) |
| `order_index` | integer | Порядок відображення |
| `created_at` | timestamptz | Дата створення |
| `updated_at` | timestamptz | Дата оновлення |

**RLS:**
- Читати можуть всі
- Керувати можуть тільки адміни

---

### 6. `rules` - Правила

**Призначення:** Правила сервера.

| Поле | Тип | Опис |
|------|-----|------|
| `id` | uuid | Унікальний ідентифікатор (PK) |
| `category_id` | uuid | Посилання на категорію (FK rule_categories) |
| `number` | text | Номер правила (унікальний, наприклад "1.1") |
| `title` | text | Назва правила |
| `content` | text | Текст правила |
| `order_index` | integer | Порядок в категорії |
| `created_at` | timestamptz | Дата створення |
| `updated_at` | timestamptz | Дата оновлення |

**RLS:**
- Читати можуть всі
- Керувати можуть тільки адміни

---

### 7. `rules_questions` - Питання для тесту

**Призначення:** Банк питань для тестування знання правил.

| Поле | Тип | Опис |
|------|-----|------|
| `id` | uuid | Унікальний ідентифікатор (PK) |
| `question` | text | Текст питання |
| `option_a` | text | Варіант A |
| `option_b` | text | Варіант B |
| `option_c` | text | Варіант C |
| `option_d` | text | Варіант D |
| `correct_answer` | text | Правильна відповідь (A, B, C, D) |
| `points` | integer | Кількість балів за питання |
| `is_active` | boolean | Чи активне питання |
| `created_at` | timestamptz | Дата створення |
| `updated_at` | timestamptz | Дата оновлення |

**RLS:**
- Активні питання можуть читати всі (без правильної відповіді!)
- Керувати можуть тільки адміни

---

### 8. `rules_test_attempts` - Спроби здачі тесту

**Призначення:** Лічильник спроб здачі тесту кожним користувачем.

| Поле | Тип | Опис |
|------|-----|------|
| `id` | uuid | Унікальний ідентифікатор (PK) |
| `user_id` | uuid | Посилання на користувача (FK users) |
| `steam_id` | text | Steam ID користувача |
| `attempt_count` | integer | Кількість спроб |
| `last_attempt` | timestamptz | Час останньої спроби |
| `created_at` | timestamptz | Дата створення |

**RLS:** Публічний доступ.

---

### 9. `rules_test_submissions` - Здані тести

**Призначення:** Збережені відповіді користувачів на тест.

| Поле | Тип | Опис |
|------|-----|------|
| `id` | uuid | Унікальний ідентифікатор (PK) |
| `user_id` | uuid | Посилання на користувача (FK users) |
| `steam_id` | text | Steam ID користувача |
| `answers` | jsonb | JSON з відповідями користувача |
| `question_grades` | jsonb | JSON з оцінками за кожне питання |
| `total_score` | integer | Загальна кількість балів |
| `max_score` | integer | Максимальна можлива кількість балів |
| `status` | text | Статус (pending, approved, rejected) |
| `approved` | boolean | Чи затверджено |
| `admin_comment` | text | Коментар адміна |
| `submitted_at` | timestamptz | Час здачі |
| `reviewed_at` | timestamptz | Час перевірки |
| `reviewed_by` | text | Хто перевірив |

**RLS:** Публічний доступ на читання/запис, адміни можуть змінювати статус.

---

### 10. `faq_categories` - Категорії FAQ

**Призначення:** Категорії для організації FAQ.

| Поле | Тип | Опис |
|------|-----|------|
| `id` | uuid | Унікальний ідентифікатор (PK) |
| `title` | text | Назва категорії |
| `slug` | text | URL-friendly ідентифікатор (унікальний) |
| `order_index` | integer | Порядок відображення |
| `created_at` | timestamptz | Дата створення |
| `updated_at` | timestamptz | Дата оновлення |

**RLS:**
- Читати можуть всі
- Керувати можуть тільки адміни

---

### 11. `faq_items` - FAQ питання

**Призначення:** Часті питання та відповіді.

| Поле | Тип | Опис |
|------|-----|------|
| `id` | uuid | Унікальний ідентифікатор (PK) |
| `category_id` | uuid | Посилання на категорію (FK faq_categories) |
| `question` | text | Питання |
| `answer` | text | Відповідь (підтримує Markdown) |
| `order_index` | integer | Порядок в категорії |
| `is_visible` | boolean | Чи відображається публічно |
| `created_at` | timestamptz | Дата створення |
| `updated_at` | timestamptz | Дата оновлення |

**RLS:**
- Публічні можуть читати всі
- Адміни можуть читати всі (включно з прихованими)
- Керувати можуть тільки адміни

---

### 12. `media_videos` - Медіа галерея

**Призначення:** Відео для медіа-секції на сайті.

| Поле | Тип | Опис |
|------|-----|------|
| `id` | uuid | Унікальний ідентифікатор (PK) |
| `title` | text | Назва відео |
| `description` | text | Опис |
| `video_url` | text | URL відео |
| `platform` | text | Платформа (youtube, twitch) |
| `order_index` | integer | Порядок відображення |
| `is_visible` | boolean | Чи відображається публічно |
| `created_at` | timestamptz | Дата створення |
| `updated_at` | timestamptz | Дата оновлення |

**RLS:**
- Видимі можуть читати всі
- Керувати можуть тільки адміни

---

### 13. `server_info` - Інформація про сервер

**Призначення:** Конфігураційні дані сервера (IP, Discord link тощо).

| Поле | Тип | Опис |
|------|-----|------|
| `id` | uuid | Унікальний ідентифікатор (PK) |
| `key` | text | Ключ налаштування (унікальний) |
| `value` | text | Значення |
| `created_at` | timestamptz | Дата створення |
| `updated_at` | timestamptz | Дата оновлення |

**RLS:**
- Читати можуть всі
- Керувати можуть тільки адміни

---

## Індекси

Для оптимізації запитів створені наступні індекси:

- `characters_user_id_idx` - на `characters(user_id)`
- `characters_steam_id_idx` - на `characters(steam_id)`
- `characters_status_idx` - на `characters(status)`
- `characters_nickname_idx` - на `characters(nickname)` де `is_dead = false`
- `character_comments_character_id_idx` - на `character_comments(character_id)`
- `rule_categories_order_idx` - на `rule_categories(order_index)`
- `rules_category_idx` - на `rules(category_id)`
- `rules_order_idx` - на `rules(order_index)`
- `faq_categories_order_idx` - на `faq_categories(order_index)`
- `faq_items_category_idx` - на `faq_items(category_id)`
- `faq_items_order_idx` - на `faq_items(order_index)`
- `faq_items_visible_idx` - на `faq_items(is_visible)`
- `media_videos_order_idx` - на `media_videos(order_index)`
- `media_videos_visible_idx` - на `media_videos(is_visible)`
- `rules_test_submissions_user_id_idx` - на `rules_test_submissions(user_id)`
- `rules_test_submissions_steam_id_idx` - на `rules_test_submissions(steam_id)`

---

## Row Level Security (RLS)

RLS використовується для контролю доступу на рівні рядків:

### Публічний доступ:
- `users` - читання/запис (Steam auth)
- `characters` - читання/запис
- `character_comments` - тільки читання
- `rules`, `rule_categories` - тільки читання
- `faq_categories`, `faq_items` (visible) - тільки читання
- `media_videos` (visible) - тільки читання
- `rules_questions` (active) - тільки читання
- `rules_test_*` - читання/запис

### Тільки адміни:
- `admins` - керування (тільки super_admin)
- Управління контентом: rules, faq, media, characters (approve/reject)
- `server_info` - керування

### Перевірка адміна:
```sql
EXISTS (
  SELECT 1 FROM admins
  WHERE admins.username = current_user
)
```

---

## Зв'язки (Foreign Keys)

```
users
  ├── characters (user_id)
  ├── rules_test_attempts (user_id)
  ├── rules_test_submissions (user_id)
  └── admins (user_id)

rule_categories
  └── rules (category_id)

faq_categories
  └── faq_items (category_id)

characters
  └── character_comments (character_id)
```

---

## Тригери і обмеження

1. **Унікальність nickname:** Тільки для живих персонажів
   ```sql
   CREATE UNIQUE INDEX characters_nickname_alive_unique
     ON characters (LOWER(nickname))
     WHERE is_dead = false;
   ```

2. **CHECK constraints:**
   - `characters.status` - тільки: draft, pending, approved, rejected
   - `admins.role` - тільки: super_admin, admin, moderator
   - `rules_questions.correct_answer` - тільки: A, B, C, D
   - `rules_test_submissions.status` - тільки: pending, approved, rejected
   - `media_videos.platform` - тільки: youtube, twitch

---

## Версії міграцій

Всі зміни схеми зберігаються в `/supabase/migrations/`:

1. `20251126230819_initial_schema.sql` - Початкова схема
2. `20251126230846_add_character_extended_fields.sql` - Додаткові поля персонажів
3. `20251126233353_add_rules_test_submissions.sql` - Система тестування
4. `20251126235016_fix_admin_login_access.sql` - Виправлення доступу адмінів
5. ... (всього 30+ міграцій)

Останні міграції:
- `20251130154233_add_faq_system.sql` - Система FAQ
- `20251130163246_fix_faq_admin_policies.sql` - Виправлення RLS для FAQ

---

## Рекомендації з безпеки

1. **Зміна пароля адміна:** Обов'язково змініть дефолтний пароль `admin123`
2. **Backup:** Регулярно робіть резервні копії бази даних
3. **RLS:** Перевіряйте політики перед продакшеном
4. **Passwords:** Використовуйте bcrypt для хешування паролів (зараз пароль зберігається у відкритому вигляді - для розробки!)
5. **SSL:** Використовуйте SSL з'єднання до бази даних

---

## Troubleshooting

### Проблема: Не працюють RLS політики
**Рішення:** Перевірте, що `current_user` співпадає з `username` в таблиці `admins`

### Проблема: Duplicate key error для nickname
**Рішення:** Перевірте, чи не існує вже живий персонаж з таким nickname

### Проблема: Не можна додати FAQ/правила
**Рішення:** Переконайтесь, що ви залогінені як адмін і RLS політики працюють

---

## Додаткові файли

- `database_backup.sql` - Повний бекап структури та даних
- `DEPLOYMENT.md` - Інструкція з розгортання
- `.env.example` - Приклад змінних оточення
