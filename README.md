# Eternal ZONE - S.T.A.L.K.E.R. RP Server Management

Веб-додаток для управління рольовим сервером S.T.A.L.K.E.R.

## Функціонал

### Для гравців:
- Авторизація через Steam
- Створення та управління анкетами персонажів
- Перегляд правил сервера
- Здача тесту на знання правил
- FAQ з відповідями на питання
- Медіа галерея
- Особистий кабінет

### Для адміністрації:
- Управління персонажами (схвалення/відхилення)
- Система коментарів до анкет
- Управління правилами та категоріями
- Управління банком питань для тесту
- Перевірка здачі тестів
- Управління медіа галереєю
- Управління FAQ
- Система банів користувачів
- Моніторинг заявок

## Технології

- **Frontend:** React 18 + TypeScript + Vite
- **Styling:** Tailwind CSS
- **Backend:** Supabase (PostgreSQL)
- **Authentication:** Steam OpenID
- **Routing:** React Router v7
- **Icons:** Lucide React

## Швидкий старт

### 1. Встановлення

```bash
npm install
```

### 2. Налаштування

Створіть `.env` файл:
```bash
cp .env.example .env
```

Додайте Supabase credentials у `.env`:
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
```

### 3. База даних

Виконайте `database_backup.sql` у вашій Supabase БД через SQL Editor.

### 4. Запуск

```bash
npm run dev        # Локальна розробка
npm run build      # Білд для продакшену
npm run preview    # Перевірка білду
```

## Розгортання на cPanel

1. Зберіть проект: `npm run build`
2. Завантажте всі файли з папки `dist/` в `public_html/` через File Manager
3. Налаштуйте Node.js App для `/api` маршруту (якщо використовуєте)

## Дефолтний адмін

**Username:** `admin`
**Password:** `admin123`

⚠️ Змініть пароль після першого входу!

## Scripts

```bash
npm run dev          # Запуск dev сервера
npm run build        # Білд для продакшену
npm run preview      # Перевірка білду
npm run lint         # Перевірка коду
npm run typecheck    # Перевірка TypeScript типів
```

---

**Гарної гри в Зоні!**
