# Швидке налаштування логування

## Крок 1: Створення таблиці

Виконайте SQL команду у вашій MySQL базі даних:

```bash
mysql -u your_username -p your_database < server/database/add_request_logs.sql
```

Або виконайте SQL безпосередньо:

```sql
CREATE TABLE IF NOT EXISTS request_logs (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  method VARCHAR(10) NOT NULL,
  endpoint VARCHAR(500) NOT NULL,
  ip_address VARCHAR(45) DEFAULT NULL,
  user_agent TEXT DEFAULT NULL,
  user_id VARCHAR(36) DEFAULT NULL,
  admin_id VARCHAR(36) DEFAULT NULL,
  status_code INT DEFAULT NULL,
  response_time INT DEFAULT NULL,
  request_body TEXT DEFAULT NULL,
  error_message TEXT DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_logs_created_at (created_at),
  INDEX idx_logs_endpoint (endpoint(255)),
  INDEX idx_logs_user_id (user_id),
  INDEX idx_logs_admin_id (admin_id),
  INDEX idx_logs_status_code (status_code),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (admin_id) REFERENCES admins(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

## Крок 2: Перезапустіть сервер

```bash
cd server
npm run start
```

або для development:

```bash
npm run dev
```

## Крок 3: Перевірка

Middleware автоматично активований і буде логувати всі запити.

Перевірте через адмін панель:
```
GET /api/admin/logs
Authorization: Bearer {your_admin_token}
```

## Готово!

Логування працює автоматично. Детальніше читайте в `server/LOGGING.md`.
