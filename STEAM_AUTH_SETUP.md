# Налаштування Steam OpenID авторизації

## Поточний стан

Зараз реалізована **MOCK-версія** Steam авторизації для тестування.

### Як працює (тимчасово):
1. Натискання кнопки "Увійти через Steam" на головній сторінці
2. Автоматичне створення тестового користувача з:
   - SteamID: `76561198123456789`
   - Ім'я: `TestPlayer`
3. Перенаправлення в кабінет

## Для продакшену потрібно

### 1. Backend для Steam OpenID

Steam OpenID вимагає серверну частину. Рекомендовані варіанти:

#### Варіант A: Supabase Edge Function

Створити Edge Function для обробки Steam OpenID:

```typescript
// supabase/functions/steam-auth/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const STEAM_API_KEY = Deno.env.get('STEAM_API_KEY')
const STEAM_OPENID_URL = 'https://steamcommunity.com/openid/login'

serve(async (req) => {
  const url = new URL(req.url)

  // Крок 1: Redirect на Steam
  if (url.pathname === '/auth/steam') {
    const params = new URLSearchParams({
      'openid.ns': 'http://specs.openid.net/auth/2.0',
      'openid.mode': 'checkid_setup',
      'openid.return_to': `${url.origin}/functions/v1/steam-auth/callback`,
      'openid.realm': url.origin,
      'openid.identity': 'http://specs.openid.net/auth/2.0/identifier_select',
      'openid.claimed_id': 'http://specs.openid.net/auth/2.0/identifier_select'
    })

    return new Response(null, {
      status: 302,
      headers: {
        'Location': `${STEAM_OPENID_URL}?${params.toString()}`
      }
    })
  }

  // Крок 2: Обробка callback від Steam
  if (url.pathname === '/callback') {
    // Валідація OpenID response
    // Отримання SteamID з claimed_id
    // Запит до Steam API для профілю
    // Створення/оновлення користувача в Supabase
    // Redirect на фронтенд з токеном
  }

  return new Response('Not found', { status: 404 })
})
```

#### Варіант B: Окремий Node.js сервер

```javascript
// server.js
const express = require('express');
const passport = require('passport');
const SteamStrategy = require('passport-steam').Strategy;

passport.use(new SteamStrategy({
    returnURL: 'http://localhost:3000/auth/steam/return',
    realm: 'http://localhost:3000/',
    apiKey: process.env.STEAM_API_KEY
  },
  function(identifier, profile, done) {
    // profile містить Steam дані
    return done(null, profile);
  }
));

app.get('/auth/steam',
  passport.authenticate('steam', { failureRedirect: '/' }),
  function(req, res) {
    res.redirect('/');
  }
);

app.get('/auth/steam/return',
  passport.authenticate('steam', { failureRedirect: '/' }),
  function(req, res) {
    // Успішна авторизація
    // Створити користувача в Supabase
    // Redirect на фронтенд
    res.redirect('/cabinet');
  }
);
```

### 2. Отримання Steam API Key

1. Зайдіть на https://steamcommunity.com/dev/apikey
2. Зареєструйте ваш домен
3. Отримайте API ключ
4. Додайте в змінні оточення:
```bash
STEAM_API_KEY=your_key_here
```

### 3. Оновлення фронтенду

Замінити mock логіку в `LandingPage.tsx`:

```typescript
// Замість:
const handleSteamLogin = () => {
  const mockSteamId = '76561198123456789';
  const mockSteamName = 'TestPlayer';
  window.location.href = `/steam-callback?steamid=${mockSteamId}&steamname=${encodeURIComponent(mockSteamName)}`;
};

// На:
const handleSteamLogin = () => {
  // Якщо використовуєте Edge Function
  window.location.href = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/steam-auth`;

  // Або якщо окремий сервер
  window.location.href = 'http://your-backend.com/auth/steam';
};
```

### 4. Безпека

- ✅ Завжди валідуйте OpenID response
- ✅ Перевіряйте SteamID на стороні сервера
- ✅ Не довіряйте даним від клієнта
- ✅ Використовуйте HTTPS в продакшені
- ✅ Зберігайте STEAM_API_KEY в змінних оточення

### 5. Отримання даних з Steam

Після успішної авторизації, можна отримати додаткові дані:

```typescript
const response = await fetch(
  `https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v2/?key=${STEAM_API_KEY}&steamids=${steamId}`
);

const data = await response.json();
const player = data.response.players[0];

// Доступні дані:
// - steamid (SteamID64)
// - personaname (ім'я профілю)
// - profileurl (URL профілю)
// - avatar (аватар)
// - realname (справжнє ім'я, якщо публічне)
```

## Поточна структура

### Файли для оновлення:

1. **src/pages/LandingPage.tsx** - кнопка входу
2. **src/pages/SteamAuth.tsx** - обробка callback
3. **src/contexts/AuthContext.tsx** - управління сесією

### База даних:

Таблиця `users` вже готова:
- `steam_id` (text) - SteamID64
- `steam_nickname` (text) - ім'я з Steam
- `is_banned` (boolean) - статус блокування

## Тестування mock-версії

1. Відкрийте головну сторінку
2. Натисніть "Увійти через Steam"
3. Автоматично створюється тестовий користувач
4. Перенаправлення в кабінет

Для тестування з різними користувачами, змініть значення в `LandingPage.tsx`:

```typescript
const mockSteamId = '76561198XXXXXXXXX'; // Ваш тестовий ID
const mockSteamName = 'YourTestName'; // Ваше тестове ім'я
```

## Рекомендації

1. **Для розробки:** використовуйте mock-версію (вже реалізована)
2. **Для staging:** налаштуйте Edge Function або тестовий backend
3. **Для production:** повноцінний Steam OpenID з валідацією

## Корисні посилання

- [Steam Web API Documentation](https://partner.steamgames.com/doc/webapi_overview)
- [OpenID 2.0 Specification](https://openid.net/specs/openid-authentication-2_0.html)
- [passport-steam NPM](https://www.npmjs.com/package/passport-steam)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
