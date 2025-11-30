# Інструкція з розгортання Eternal ZONE

Цей гайд допоможе вам розгорнути проєкт на власному хості з власною базою даних.

---

## Вимоги

### Backend
- **PostgreSQL** 14+ з розширеннями:
  - `uuid-ossp`
  - `pgcrypto`
- **Node.js** 18+ (для Edge Functions, якщо використовуєте)

### Frontend
- **Node.js** 18+
- **npm** або **yarn**

### Hosting
- Будь-який статичний хостинг для фронтенду (Netlify, Vercel, Cloudflare Pages, тощо)
- Postgres хостинг (Supabase, Railway, Render, тощо)

---

## Крок 1: Налаштування бази даних

### 1.1 Створення бази даних

1. Створіть нову PostgreSQL базу даних на вашому хості
2. Підключіться до бази даних через psql або GUI клієнт

### 1.2 Імпорт схеми

Використайте файл `database_backup.sql`:

```bash
psql -h YOUR_HOST -U YOUR_USER -d YOUR_DATABASE -f database_backup.sql
```

Або через GUI клієнт виконайте весь SQL з файлу `database_backup.sql`.

### 1.3 Перевірка встановлення

Перевірте, що всі таблиці створено:

```sql
SELECT tablename FROM pg_tables WHERE schemaname = 'public';
```

Повинно бути 13 таблиць:
- admins
- users
- characters
- character_comments
- rule_categories
- rules
- rules_questions
- rules_test_attempts
- rules_test_submissions
- faq_categories
- faq_items
- media_videos
- server_info

### 1.4 Зміна дефолтного пароля адміна

**ВАЖЛИВО!** Змініть пароль дефолтного адміна:

```sql
UPDATE admins
SET password_hash = 'YOUR_NEW_PASSWORD'
WHERE username = 'admin';
```

> **Примітка:** В продакшені використовуйте bcrypt для хешування паролів!

---

## Крок 2: Налаштування Edge Functions (опціонально)

Якщо ви використовуєте Supabase Edge Functions для Steam авторизації:

### 2.1 Встановлення Supabase CLI

```bash
npm install -g supabase
```

### 2.2 Логін до Supabase

```bash
supabase login
```

### 2.3 Деплой функції

```bash
supabase functions deploy steam-auth --project-ref YOUR_PROJECT_REF
```

---

## Крок 3: Налаштування фронтенду

### 3.1 Клонування і встановлення залежностей

```bash
cd eternal-zone-frontend
npm install
```

### 3.2 Налаштування змінних оточення

Створіть файл `.env` в корені проєкту:

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# Steam Authentication (optional)
VITE_STEAM_API_KEY=your-steam-api-key
VITE_STEAM_CALLBACK_URL=https://your-domain.com/steam-callback
```

### Отримання Supabase credentials:

1. Відкрийте ваш проєкт на [supabase.com](https://supabase.com)
2. Перейдіть до Settings → API
3. Скопіюйте:
   - **Project URL** → `VITE_SUPABASE_URL`
   - **anon public** ключ → `VITE_SUPABASE_ANON_KEY`

### Налаштування SteamAuth (опціонально):

1. Отримайте Steam API Key: https://steamcommunity.com/dev/apikey
2. Налаштуйте callback URL у вашому додатку

---

## Крок 4: Збірка проєкту

### 4.1 Білд для продакшену

```bash
npm run build
```

Це створить папку `dist/` з готовими файлами.

### 4.2 Перевірка білду локально

```bash
npm run preview
```

---

## Крок 5: Розгортання на хостингу

### Варіант A: Netlify

1. Підключіть ваш Git репозиторій
2. Налаштуйте Build settings:
   - Build command: `npm run build`
   - Publish directory: `dist`
3. Додайте Environment Variables в Netlify Dashboard
4. Deploy!

### Варіант B: Vercel

1. Імпортуйте проєкт з Git
2. Framework Preset: **Vite**
3. Додайте Environment Variables
4. Deploy!

### Варіант C: Cloudflare Pages

1. Підключіть GitHub/GitLab
2. Build settings:
   - Build command: `npm run build`
   - Build output directory: `dist`
3. Додайте Environment Variables
4. Deploy!

### Варіант D: Власний VPS

```bash
# Копіюємо файли
scp -r dist/* user@your-server:/var/www/eternal-zone/

# Налаштовуємо nginx
sudo nano /etc/nginx/sites-available/eternal-zone
```

Приклад конфігурації nginx:

```nginx
server {
    listen 80;
    server_name your-domain.com;

    root /var/www/eternal-zone;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Кешування статичних файлів
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|webp)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

---

## Крок 6: Налаштування SSL (HTTPS)

### Для nginx з Let's Encrypt:

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

---

## Крок 7: Післязапускова конфігурація

### 7.1 Додайте дефолтні дані

Через адмін панель додайте:
- Категорії правил та правила
- Питання для тесту
- FAQ категорії та питання
- Медіа відео
- Server info (IP, Discord link)

### 7.2 Створіть додаткових адмінів (опціонально)

```sql
INSERT INTO admins (username, password_hash, role, permissions, is_active)
VALUES (
  'moderator1',
  'secure_password_here',
  'moderator',
  ARRAY['manage_characters', 'manage_rules'],
  true
);
```

---

## Крок 8: Перевірка роботи

### Checklist:

- [ ] Головна сторінка відкривається
- [ ] Можна створити персонажа (без Steam auth спочатку протестуйте manual login)
- [ ] Адмін панель доступна на `/admin`
- [ ] Можна залогінитись як адмін (`admin` / `admin123` або ваш пароль)
- [ ] В адмінці можна:
  - [ ] Керувати персонажами
  - [ ] Додавати правила
  - [ ] Додавати питання для тесту
  - [ ] Додавати FAQ
  - [ ] Додавати медіа
  - [ ] Банити користувачів
- [ ] Сторінка правил `/rules` працює
- [ ] Сторінка FAQ `/faq` працює
- [ ] Тест на знання правил `/rules-test` працює
- [ ] Steam авторизація працює (якщо налаштовано)

---

## Крок 9: Моніторинг і Backup

### 9.1 Налаштуйте автоматичний backup БД

Приклад cron job:

```bash
# Щоденний backup о 3:00
0 3 * * * pg_dump -h YOUR_HOST -U YOUR_USER YOUR_DATABASE > /backups/eternal_zone_$(date +\%Y\%m\%d).sql
```

### 9.2 Моніторинг логів

Для nginx:
```bash
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log
```

Для Supabase - використовуйте Dashboard → Logs

---

## Troubleshooting

### Проблема: "Failed to connect to database"

**Рішення:**
- Перевірте `VITE_SUPABASE_URL` та `VITE_SUPABASE_ANON_KEY`
- Перевірте, що база даних запущена і доступна
- Перевірте firewall rules

### Проблема: "Access denied" в адмін панелі

**Рішення:**
- Перевірте, що RLS політики працюють коректно
- Перевірте, що `current_user` співпадає з `username` в таблиці `admins`
- В Supabase переконайтесь, що використовується правильна роль

### Проблема: Build fails

**Рішення:**
```bash
rm -rf node_modules package-lock.json
npm install
npm run build
```

### Проблема: Steam auth не працює

**Рішення:**
- Перевірте `VITE_STEAM_API_KEY`
- Перевірте callback URL в Steam Developer settings
- Перевірте Edge Function деплой

### Проблема: 404 на routes

**Рішення:**
- Для nginx додайте `try_files $uri $uri/ /index.html;`
- Для Netlify додайте файл `_redirects`:
  ```
  /*    /index.html   200
  ```
- Для Vercel додайте `vercel.json`:
  ```json
  {
    "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
  }
  ```

---

## Додаткові ресурси

- **Документація Supabase:** https://supabase.com/docs
- **Документація Vite:** https://vitejs.dev/
- **Документація React Router:** https://reactrouter.com/
- **PostgreSQL документація:** https://www.postgresql.org/docs/

---

## Структура проєкту

```
eternal-zone/
├── src/
│   ├── components/       # React компоненти
│   ├── contexts/         # React contexts (Auth)
│   ├── pages/           # Сторінки
│   ├── lib/             # Supabase client
│   ├── utils/           # Утиліти
│   └── data/            # Константи
├── supabase/
│   ├── migrations/      # SQL міграції
│   └── functions/       # Edge Functions
├── dist/                # Білд (після npm run build)
├── database_backup.sql  # Бекап БД
├── DATABASE_STRUCTURE.md # Документація БД
└── DEPLOYMENT.md        # Цей файл
```

---

## Контакти і підтримка

Якщо виникли питання:
1. Перевірте документацію
2. Перегляньте існуючі issues на GitHub
3. Створіть новий issue з детальним описом проблеми

---

##Ліцензія

Проєкт розроблений для Eternal ZONE S.T.A.L.K.E.R. RP сервера.

---

**Успішного деплою! Гарної гри в Зоні!** 🎮
