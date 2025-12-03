# 🚀 Швидкий старт MySQL Backend

## Крок 1: Створити MySQL базу даних

### Варіант А: Через командний рядок
```bash
mysql -u root -p < QUICK_SETUP.sql
```

### Варіант Б: Через MySQL Workbench / phpMyAdmin
1. Відкрити `QUICK_SETUP.sql`
2. Виконати весь скрипт

### Варіант В: Вручну
```bash
mysql -u root -p
```

```sql
CREATE DATABASE stalker_rp CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE stalker_rp;
source server/database/schema.sql;
```

## Крок 2: Налаштувати Backend

```bash
cd server
npm install
```

Створити `server/.env`:
```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=ваш_пароль
DB_NAME=stalker_rp

PORT=3000
FRONTEND_URL=http://localhost:5173

JWT_SECRET=your-secret-key-change-in-production
STEAM_API_KEY=your_steam_api_key_optional
```

## Крок 3: Створити адміна

```bash
cd server
node create-admin.js admin admin123
```

Або з власними даними:
```bash
node create-admin.js yourname yourpassword
```

## Крок 4: Запустити Backend

```bash
cd server
npm run dev
```

Повинно побачити:
```
Server running on port 3000
Frontend URL: http://localhost:5173
```

## Крок 5: Налаштувати Frontend

Створити `.env` в корені проекту:
```env
VITE_API_URL=http://localhost:3000/api
```

Встановити залежності:
```bash
npm install
```

## Крок 6: Запустити Frontend

```bash
npm run dev
```

## ✅ Перевірка

1. **Backend:** http://localhost:3000/health - повинен повернути `{"status":"ok"}`
2. **Frontend:** http://localhost:5173 - повинен відкритися сайт
3. **Адмін панель:** http://localhost:5173/admin-login
   - Логін: admin
   - Пароль: admin123

## 📊 Структура бази даних

**11 таблиць:**
- `users` - користувачі (Steam)
- `admins` - адміністратори
- `characters` - персонажі
- `face_models` - моделі обличь
- `rules_categories` - категорії правил
- `rules` - правила сервера
- `rules_questions` - тестові питання
- `rules_test_submissions` - відповіді на тест
- `faq_categories` - категорії FAQ
- `faq_items` - FAQ питання/відповіді
- `media_videos` - відео галерея
- `character_comments` - коментарі до персонажів

## 🔧 Корисні команди

### MySQL
```bash
# Показати таблиці
mysql -u root -p stalker_rp -e "SHOW TABLES;"

# Показати користувачів
mysql -u root -p stalker_rp -e "SELECT * FROM users;"

# Показати адмінів
mysql -u root -p stalker_rp -e "SELECT id, username, role FROM admins;"

# Очистити базу
mysql -u root -p stalker_rp -e "DROP DATABASE stalker_rp; CREATE DATABASE stalker_rp CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
```

### Створити backup
```bash
mysqldump -u root -p stalker_rp > backup.sql
```

### Відновити backup
```bash
mysql -u root -p stalker_rp < backup.sql
```

## 🐛 Troubleshooting

### Backend не стартує:
- Перевірити чи працює MySQL: `mysql -u root -p`
- Перевірити .env файл в `server/.env`
- Перевірити чи створена база: `SHOW DATABASES LIKE 'stalker_rp';`

### Frontend не підключається:
- Перевірити чи працює backend: http://localhost:3000/health
- Перевірити `.env` в корені: `VITE_API_URL=http://localhost:3000/api`
- Перезапустити frontend: `npm run dev`

### Помилка UUID():
MySQL 8.0+ підтримує UUID(). Для старіших версій замінити на:
```sql
id CHAR(36) PRIMARY KEY DEFAULT (UUID())
-- на
id CHAR(36) PRIMARY KEY
```

## 📝 Важливі нотатки

1. **Безпека:** Змінити JWT_SECRET в production!
2. **Паролі:** Змінити адмін пароль після першого входу!
3. **CORS:** Backend дозволяє запити тільки з FRONTEND_URL
4. **Steam API:** Опціонально - для отримання аватарів з Steam

## 🎯 Наступні кроки

1. ✅ База створена
2. ✅ Backend працює
3. ✅ Frontend підключений
4. ⚠️ Мігрувати 13 frontend файлів (див. MIGRATION_COMPLETE.md)
5. ⚠️ Протестувати всі функції
6. ⚠️ Задеплоїти на production

---

**Потрібна допомога?** Перевірте:
- `MYSQL_MIGRATION.md` - повний гайд міграції
- `MIGRATION_COMPLETE.md` - статус міграції
- `server/database/schema.sql` - структура БД
