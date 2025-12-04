-- MySQL Database Schema for Stalker RP
-- Converted from Supabase PostgreSQL schema

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  steam_id VARCHAR(255) UNIQUE NOT NULL,
  steam_nickname VARCHAR(255) NOT NULL,
  discord_id VARCHAR(255) DEFAULT NULL,
  discord_username VARCHAR(255) DEFAULT NULL,
  is_banned BOOLEAN DEFAULT FALSE,
  ban_reason TEXT DEFAULT NULL,
  rules_passed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_login TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_users_steam_id (steam_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Face models table
CREATE TABLE IF NOT EXISTS face_models (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  name VARCHAR(255) UNIQUE NOT NULL,
  gender ENUM('male', 'female') NOT NULL,
  image_url TEXT,
  is_unique BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Characters table
CREATE TABLE IF NOT EXISTS characters (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  user_id VARCHAR(36) NOT NULL,
  steam_id VARCHAR(255) NOT NULL,
  status ENUM('draft', 'pending', 'approved', 'rejected', 'active', 'dead') DEFAULT 'draft',
  name VARCHAR(255) NOT NULL,
  surname VARCHAR(255) NOT NULL,
  patronymic VARCHAR(255) DEFAULT NULL,
  nickname VARCHAR(255) DEFAULT NULL,
  age INT CHECK (age >= 18 AND age <= 80),
  gender ENUM('male', 'female'),
  face_model VARCHAR(255),
  origin_country VARCHAR(255),
  citizenship VARCHAR(255),
  faction VARCHAR(255),
  biography TEXT,
  appearance TEXT,
  psychological_portrait TEXT,
  character_traits JSON DEFAULT NULL,
  skills JSON DEFAULT NULL,
  inventory JSON DEFAULT NULL,
  rejection_reason TEXT DEFAULT NULL,
  admin_notes TEXT DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  submitted_at TIMESTAMP DEFAULT NULL,
  approved_at TIMESTAMP DEFAULT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_characters_user_id (user_id),
  INDEX idx_characters_steam_id (steam_id),
  INDEX idx_characters_status (status),
  CONSTRAINT unique_nickname_active UNIQUE (nickname, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Admins table
CREATE TABLE IF NOT EXISTS admins (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  user_id VARCHAR(36) DEFAULT NULL,
  username VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('super_admin', 'moderator', 'content_manager') DEFAULT 'moderator',
  permissions JSON DEFAULT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_login TIMESTAMP DEFAULT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Rules categories table
CREATE TABLE IF NOT EXISTS rules_categories (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  name VARCHAR(255) NOT NULL,
  order_index INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Rules table
CREATE TABLE IF NOT EXISTS rules (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  category_id VARCHAR(36) NOT NULL,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  order_index INT DEFAULT 0,
  is_published BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES rules_categories(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Rules questions table
CREATE TABLE IF NOT EXISTS rules_questions (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  question_text TEXT NOT NULL,
  correct_answer TEXT NOT NULL,
  incorrect_answers JSON DEFAULT NULL,
  category VARCHAR(255) DEFAULT NULL,
  difficulty ENUM('easy', 'medium', 'hard') DEFAULT 'medium',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Rules test submissions table
CREATE TABLE IF NOT EXISTS rules_test_submissions (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  user_id VARCHAR(36) DEFAULT NULL,
  steam_id VARCHAR(255) NOT NULL,
  answers JSON DEFAULT NULL,
  question_grades JSON DEFAULT NULL,
  score INT DEFAULT NULL,
  approved BOOLEAN DEFAULT NULL,
  feedback TEXT DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  reviewed_at TIMESTAMP DEFAULT NULL,
  INDEX idx_test_submissions_user_id (user_id),
  INDEX idx_test_submissions_steam_id (steam_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- FAQ categories table
CREATE TABLE IF NOT EXISTS faq_categories (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  name VARCHAR(255) NOT NULL,
  order_index INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- FAQ items table
CREATE TABLE IF NOT EXISTS faq_items (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  category_id VARCHAR(36) NOT NULL,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  order_index INT DEFAULT 0,
  is_published BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES faq_categories(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Media videos table
CREATE TABLE IF NOT EXISTS media_videos (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  title VARCHAR(255) NOT NULL,
  url TEXT NOT NULL,
  thumbnail_url TEXT DEFAULT NULL,
  order_index INT DEFAULT 0,
  is_published BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Character comments table
CREATE TABLE IF NOT EXISTS character_comments (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  character_id VARCHAR(36) NOT NULL,
  admin_id VARCHAR(36) DEFAULT NULL,
  comment_text TEXT NOT NULL,
  is_internal BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_comments_character_id (character_id),
  FOREIGN KEY (character_id) REFERENCES characters(id) ON DELETE CASCADE,
  FOREIGN KEY (admin_id) REFERENCES admins(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Request logs table
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
