# Логування запитів

Система автоматичного логування всіх HTTP запитів до API.

## Що логується

Кожен запит до API (крім `/health`) автоматично зберігається в базі даних з наступною інформацією:

- **method** - HTTP метод (GET, POST, PUT, DELETE, тощо)
- **endpoint** - URL шлях запиту з query параметрами
- **ip_address** - IP адреса клієнта
- **user_agent** - User Agent браузера/клієнта
- **user_id** - ID користувача (якщо авторизований)
- **admin_id** - ID адміністратора (якщо авторизований як адмін)
- **status_code** - HTTP статус код відповіді
- **response_time** - Час виконання запиту в мілісекундах
- **request_body** - Тіло запиту (паролі та токени автоматично приховуються)
- **error_message** - Повідомлення про помилку (якщо виникла)
- **created_at** - Час створення логу

## Безпека

Middleware автоматично приховує чутливі дані:
- Паролі (`password`, `password_hash`)
- Токени (`token`)
- Секретні ключі (`secret`)

Замість реальних значень зберігається `[REDACTED]`.

## API для перегляду логів

### Отримання списку логів

```http
GET /api/admin/logs
Authorization: Bearer {admin_token}
```

**Query параметри:**
- `page` - Номер сторінки (за замовчуванням: 1)
- `limit` - Кількість логів на сторінку (за замовчуванням: 50)
- `method` - Фільтр за HTTP методом (GET, POST, тощо)
- `status_code` - Фільтр за статус кодом (200, 404, 500, тощо)
- `endpoint` - Пошук за endpoint (підтримує часткові збіги)
- `user_id` - Фільтр за ID користувача
- `admin_id` - Фільтр за ID адміністратора
- `from_date` - Фільтр з дати (формат: YYYY-MM-DD HH:MM:SS)
- `to_date` - Фільтр до дати (формат: YYYY-MM-DD HH:MM:SS)

**Відповідь:**
```json
{
  "logs": [
    {
      "id": "uuid",
      "method": "POST",
      "endpoint": "/api/characters",
      "ip_address": "192.168.1.1",
      "user_agent": "Mozilla/5.0...",
      "user_id": "user-uuid",
      "user_nickname": "PlayerName",
      "admin_id": null,
      "admin_username": null,
      "status_code": 201,
      "response_time": 150,
      "request_body": "{\"name\":\"John\"}",
      "error_message": null,
      "created_at": "2024-12-04T10:00:00.000Z"
    }
  ],
  "pagination": {
    "total": 1000,
    "page": 1,
    "limit": 50,
    "pages": 20
  }
}
```

### Отримання статистики

```http
GET /api/admin/logs/stats
Authorization: Bearer {admin_token}
```

**Query параметри:**
- `from_date` - Статистика з дати
- `to_date` - Статистика до дати

**Відповідь:**
```json
{
  "total_requests": 5000,
  "methods": [
    { "method": "GET", "count": 3000 },
    { "method": "POST", "count": 1500 },
    { "method": "PUT", "count": 300 },
    { "method": "DELETE", "count": 200 }
  ],
  "status_codes": [
    { "status_group": "2xx", "count": 4500 },
    { "status_group": "4xx", "count": 400 },
    { "status_group": "5xx", "count": 100 }
  ],
  "avg_response_time": 85,
  "top_endpoints": [
    { "endpoint": "/api/characters", "count": 1200 },
    { "endpoint": "/api/users/me", "count": 800 }
  ],
  "slowest_endpoints": [
    { "endpoint": "/api/characters", "avg_time": 250, "count": 1200 },
    { "endpoint": "/api/admin/logs", "avg_time": 180, "count": 50 }
  ]
}
```

## Встановлення

1. Виконайте SQL скрипт для створення таблиці:
```bash
mysql -u your_user -p your_database < server/database/add_request_logs.sql
```

2. Middleware вже підключений в `server/src/index.js`

3. Логування працює автоматично для всіх запитів

## Налаштування

Виключені endpoints (без логування) налаштовуються в `server/src/middleware/logger.js`:

```javascript
const excludedEndpoints = [
  '/health',
  '/api/health'
];
```

Чутливі поля налаштовуються там же:

```javascript
const sensitiveFields = ['password', 'password_hash', 'token', 'secret'];
```

## Очистка старих логів

Рекомендується періодично очищувати старі логи. Приклад SQL запиту для видалення логів старше 90 днів:

```sql
DELETE FROM request_logs
WHERE created_at < DATE_SUB(NOW(), INTERVAL 90 DAY);
```

Можна налаштувати автоматичне видалення через MySQL Event Scheduler:

```sql
CREATE EVENT IF NOT EXISTS cleanup_old_logs
ON SCHEDULE EVERY 1 DAY
DO
  DELETE FROM request_logs
  WHERE created_at < DATE_SUB(NOW(), INTERVAL 90 DAY);
```

## Аналіз продуктивності

Використовуйте endpoint `/api/admin/logs/stats` для:
- Моніторингу навантаження на API
- Виявлення повільних endpoints
- Аналізу помилок
- Перевірки використання різних методів HTTP

## Приклади використання

### Знайти всі помилки за останню добу
```http
GET /api/admin/logs?status_code=500&from_date=2024-12-03
```

### Знайти всі запити конкретного користувача
```http
GET /api/admin/logs?user_id=user-uuid-here
```

### Знайти повільні запити (через SQL)
```sql
SELECT endpoint, AVG(response_time) as avg_time, COUNT(*) as count
FROM request_logs
WHERE created_at > DATE_SUB(NOW(), INTERVAL 1 DAY)
GROUP BY endpoint
HAVING avg_time > 1000
ORDER BY avg_time DESC;
```
