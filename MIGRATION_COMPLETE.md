# Міграція на MySQL - Завершено

## Статус: Backend готовий, Frontend частково мігрований

### ✅ Повністю завершено:

**Backend (100%):**
- ✅ MySQL схема бази даних створена
- ✅ Express сервер налаштований
- ✅ JWT автентифікація реалізована
- ✅ Steam OpenID authentication
- ✅ Всі API endpoints створені
- ✅ Authorization middleware
- ✅ Безпека та валідація

**Frontend Core (100%):**
- ✅ API клієнт створений (`src/lib/api-client.ts`)
- ✅ AuthContext оновлений (JWT)
- ✅ AdminAuthContext оновлений (JWT)
- ✅ SteamAuth.tsx - повністю мігрований
- ✅ LandingPage.tsx - завантаження відео через API
- ✅ Package.json - видалено @supabase/supabase-js
- ✅ .env.example оновлений

### ⚠️ Потрібно завершити міграцію (13 файлів):

Наступні файли ще використовують `supabase` і потрібно оновити їх на `apiClient`:

1. **src/components/FaceModelSelector.tsx**
2. **src/components/FAQManager.tsx**
3. **src/components/QuestionsManager.tsx**
4. **src/components/RulesManager.tsx**
5. **src/pages/AdminPanel.tsx**
6. **src/pages/CharacterCreate.tsx**
7. **src/pages/CharacterView.tsx**
8. **src/pages/EditCharacterStory.tsx**
9. **src/pages/FAQ.tsx**
10. **src/pages/PlayerCabinet.tsx**
11. **src/pages/Rules.tsx**
12. **src/pages/RulesTest.tsx**
13. **src/lib/supabase.ts** - видалити цей файл

## Як завершити міграцію:

### Патерн заміни для кожного файлу:

#### 1. Імпорти
```typescript
// Замінити:
import { supabase } from '../lib/supabase';

// На:
import { apiClient } from '../lib/api-client';
```

#### 2. SELECT запити
```typescript
// Було:
const { data, error } = await supabase
  .from('characters')
  .select('*')
  .eq('user_id', userId);

// Стало:
const data = await apiClient.characters.list({ user_id: userId });
```

#### 3. INSERT
```typescript
// Було:
const { data, error } = await supabase
  .from('characters')
  .insert(characterData)
  .select()
  .single();

// Стало:
const data = await apiClient.characters.create(characterData);
```

#### 4. UPDATE
```typescript
// Було:
await supabase
  .from('characters')
  .update({ status: 'approved' })
  .eq('id', characterId);

// Стало:
await apiClient.characters.update(characterId, { status: 'approved' });
```

#### 5. DELETE
```typescript
// Було:
await supabase
  .from('characters')
  .delete()
  .eq('id', characterId);

// Стало:
await apiClient.characters.delete(characterId);
```

#### 6. Error handling
```typescript
// Було:
const { data, error } = await supabase.from('table').select('*');
if (error) throw error;

// Стало:
try {
  const data = await apiClient.get('/endpoint');
} catch (error) {
  console.error('Error:', error.message);
}
```

### API Endpoints mapping:

```typescript
// Characters
apiClient.characters.list({ steam_id, status })
apiClient.characters.get(id)
apiClient.characters.create(data)
apiClient.characters.update(id, data)
apiClient.characters.delete(id)

// Admin - Characters
apiClient.admin.characters.list(status)
apiClient.admin.characters.update(id, data)

// Admin - Users
apiClient.admin.users.list()
apiClient.admin.users.update(id, data)

// Admin - Test Submissions
apiClient.admin.testSubmissions.list()
apiClient.admin.testSubmissions.update(id, data)

// Rules
apiClient.rules.categories.list()
apiClient.rules.categories.create(data)
apiClient.rules.list()
apiClient.rules.create(data)
apiClient.rules.update(id, data)
apiClient.rules.delete(id)

// Questions
apiClient.questions.list()
apiClient.questions.create(data)
apiClient.questions.update(id, data)
apiClient.questions.delete(id)

// Test Submissions
apiClient.testSubmissions.list(steamId)
apiClient.testSubmissions.create(data)
apiClient.testSubmissions.delete(id)

// FAQ
apiClient.faq.categories.list()
apiClient.faq.categories.create(data)
apiClient.faq.list()
apiClient.faq.create(data)
apiClient.faq.update(id, data)
apiClient.faq.delete(id)

// Face Models
apiClient.faceModels.list(gender)
apiClient.faceModels.create(data)
apiClient.faceModels.update(id, data)
apiClient.faceModels.delete(id)

// Users
apiClient.users.get(steamId)
apiClient.users.update(data)

// Auth
apiClient.auth.steamLogin(returnUrl)
apiClient.auth.verify(queryParams)
apiClient.auth.signOut()
apiClient.auth.getCurrentUser()
```

## Запуск проекту:

### 1. Backend:
```bash
cd server
npm install
# Створити .env з конфігурацією MySQL
# Створити базу даних: mysql -u root -p stalker_rp < database/schema.sql
npm run dev
```

### 2. Frontend:
```bash
npm install
# Оновити .env: VITE_API_URL=http://localhost:3000/api
npm run dev
```

## Наступні кроки:

1. ✅ Backend запущений і працює
2. ⚠️ Завершити міграцію 13 файлів frontend
3. ⚠️ Видалити `supabase/` папку
4. ⚠️ Видалити `src/lib/supabase.ts`
5. ⚠️ Запустити `npm run build`
6. ⚠️ Протестувати всі функції

## Готово до production після:

- Завершення міграції всіх frontend файлів
- Тестування всіх функцій
- Налаштування production MySQL бази
- Налаштування production backend hosting
- Оновлення VITE_API_URL на production URL
