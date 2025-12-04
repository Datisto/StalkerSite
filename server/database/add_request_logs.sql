-- Скрипт для додавання таблиці логування запитів
-- Виконайте цей SQL в вашій MySQL базі даних

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
