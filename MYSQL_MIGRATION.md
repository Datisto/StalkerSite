# Міграція з Supabase на MySQL

## Що зроблено

### Backend (Node.js + Express + MySQL)

✅ **База даних:**
- Створено MySQL схему (`server/database/schema.sql`) з усіма таблицями
- Конвертовано всі PostgreSQL специфічні типи в MySQL еквіваленти
- UUID → VARCHAR(36) з UUID()
- JSONB → JSON
- timestamptz → TIMESTAMP

✅ **API Server:**
- Express сервер (`server/src/index.js`)
- MySQL підключення (`server/src/config/database.js`)
- JWT автентифікація (`server/src/utils/jwt.js`)
- Middleware для автентифікації (`server/src/middleware/auth.js`)

✅ **API Endpoints (Routes):**
- `/api/steam-auth` - Steam OpenID автентифікація
- `/api/users` - Управління користувачами
- `/api/characters` - CRUD для персонажів
- `/api/admin` - Адмін панель
- `/api/rules` - Правила сервера
- `/api/questions` - Тестові питання
- `/api/test-submissions` - Submissions тестів
- `/api/faq` - FAQ система
- `/api/face-models` - Моделі обличь
- `/api/media-videos` - Медіа відео

✅ **Безпека:**
- JWT токени замість Supabase Auth
- Middleware для перевірки користувачів та адмінів
- bcrypt для паролів адмінів
- Перевірка прав доступу на рівні API

### Frontend (React + TypeScript)

✅ **API Клієнт:**
- Створено `src/lib/api-client.ts` - універсальний клієнт для API
- Підтримка JWT токенів
- Автоматичні headers з Authorization

✅ **Оновлені Context:**
- `AuthContext.tsx` - використовує JWT замість Supabase Auth
- `AdminAuthContext.tsx` - JWT токени для адмінів

✅ **Оновлені сторінки:**
- `SteamAuth.tsx` - Steam callback через API
- `LandingPage.tsx` - завантаження відео через API

## Що потрібно зробити вручну

### 1. Налаштування Backend

```bash
cd server
npm install
```

Створити `.env` файл:
```
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=stalker_rp

PORT=3000
FRONTEND_URL=http://localhost:5173

JWT_SECRET=your-secret-key-change-in-production
STEAM_API_KEY=your_steam_api_key
```

Створити MySQL базу даних:
```sql
CREATE DATABASE stalker_rp CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

Імпортувати схему:
```bash
mysql -u root -p stalker_rp < database/schema.sql
```

Запустити сервер:
```bash
npm run dev
```

### 2. Налаштування Frontend

Оновити `.env` файл:
```
VITE_API_URL=http://localhost:3000/api
```

Видалити старі змінні:
```
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
```

### 3. Оновити наступні файли (замінити supabase на apiClient)

**Потрібно оновити:**
- `src/components/FaceModelSelector.tsx`
- `src/components/FAQManager.tsx`
- `src/components/QuestionsManager.tsx`
- `src/components/RulesManager.tsx`
- `src/pages/AdminPanel.tsx`
- `src/pages/CharacterCreate.tsx`
- `src/pages/CharacterView.tsx`
- `src/pages/EditCharacterStory.tsx`
- `src/pages/FAQ.tsx`
- `src/pages/PlayerCabinet.tsx`
- `src/pages/Rules.tsx`
- `src/pages/RulesTest.tsx`

**Патерн заміни:**

Замінити imports:
```typescript
// Було:
import { supabase } from '../lib/supabase';

// Стало:
import { apiClient } from '../lib/api-client';
```

Замінити виклики:
```typescript
// Було:
const { data } = await supabase
  .from('table_name')
  .select('*');

// Стало:
const data = await apiClient.get('/endpoint');

// Було:
await supabase.from('table_name').insert(data);

// Стало:
await apiClient.post('/endpoint', data);

// Було:
await supabase.from('table_name').update(data).eq('id', id);

// Стало:
await apiClient.patch(`/endpoint/${id}`, data);

// Було:
await supabase.from('table_name').delete().eq('id', id);

// Стало:
await apiClient.delete(`/endpoint/${id}`);
```

### 4. Видалити Supabase

```bash
npm uninstall @supabase/supabase-js
rm -rf supabase/
rm src/lib/supabase.ts
```

### 5. Тестування

- Запустити backend: `cd server && npm run dev`
- Запустити frontend: `npm run dev`
- Перевірити всі функції:
  - Steam авторизацію
  - Створення персонажів
  - Адмін панель
  - Правила та FAQ
  - Тести

### 6. Production Build

```bash
npm run build
```

## Відмінності від Supabase

### Row Level Security (RLS)
**Було:** PostgreSQL RLS policies
**Стало:** Express middleware для перевірки доступу

### Real-time
**Було:** Supabase real-time subscriptions
**Стало:** Polling або WebSockets (треба додати окремо)

### Storage
**Було:** Supabase Storage для файлів
**Стало:** Треба додати власне рішення (Cloudinary, AWS S3, тощо)

### Edge Functions
**Було:** Supabase Edge Functions (Deno)
**Стало:** Express routes (Node.js)

## Переваги нової архітектури

- Повний контроль над базою даних
- Можливість використання будь-якого хостингу
- Немає vendor lock-in
- Швидші запити (пряме підключення до MySQL)
- Гнучкіша авторизація

## Недоліки

- Потрібно підтримувати власний backend
- Немає вбудованого real-time
- Потрібно окремо налаштовувати storage для файлів
