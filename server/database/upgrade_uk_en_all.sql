-- MariaDB 11.8.x: захищене оновлення UA / EN для dayzstal_eternalzone.
-- Імпортуйте ВЕСЬ файл одним запуском (HeidiSQL або phpMyAdmin); підтримка DELIMITER обов’язкова.
-- Перед запуском потрібен повний експорт СТРУКТУРИ ТА ДАНИХ. Дамп лише структури не є копією записів.
-- Скрипт додає 11 полів. Наявні дані, ключі та визначення колонок не змінюються.
-- Всі перевірки виконуються до першої зміни. Несумісні наявні EN-поля спричиняють помилку.
-- Кожне додавання: тільки INSTANT, без перебудови таблиці, з очікуванням metadata lock до 5 секунд.
-- При помилці решта блоку не виконується. Попередні успішні DDL-зміни вже залишаються у базі.
-- Повторний запуск пропускає сумісні наявні поля та зберігає їхні переклади.
-- DDL не має загального відкату через ROLLBACK. Не запускайте одночасно інші міграції.
-- Цей файл тепер призначений саме для MariaDB 11.8.x, а не для MySQL.

USE `dayzstal_eternalzone`;
SET NAMES utf8mb4;

DELIMITER $$
BEGIN NOT ATOMIC
  DECLARE v_problem VARCHAR(128) DEFAULT NULL;
  DECLARE v_table_count INT DEFAULT 0;
  DECLARE v_applied INT DEFAULT 0;
  DECLARE v_saved_lock_wait_timeout BIGINT UNSIGNED DEFAULT @@SESSION.lock_wait_timeout;
  DECLARE v_timeout_changed BOOLEAN DEFAULT FALSE;
  DECLARE EXIT HANDLER FOR SQLEXCEPTION
  BEGIN
    IF v_timeout_changed THEN
      SET SESSION lock_wait_timeout = v_saved_lock_wait_timeout;
    END IF;
    RESIGNAL;
  END;

  IF DATABASE() IS NULL OR BINARY DATABASE() <> BINARY 'dayzstal_eternalzone' THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Wrong database: expected dayzstal_eternalzone';
  END IF;
  IF VERSION() NOT LIKE '11.8.%MariaDB%' THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'This migration requires MariaDB 11.8.x';
  END IF;
  IF @@autocommit <> 1 OR @@in_transaction <> 0 THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Run in a separate autocommit session, outside any transaction';
  END IF;

  -- Перевіряємо всі 8 таблиць, рушій та кодування з надісланого дампа.
  SET SESSION lock_wait_timeout = 5;
  SET v_timeout_changed = TRUE;

  SELECT COUNT(*) INTO v_table_count FROM INFORMATION_SCHEMA.TABLES
    WHERE TABLE_SCHEMA = 'dayzstal_eternalzone' AND TABLE_TYPE = 'BASE TABLE'
      AND ENGINE = 'InnoDB' AND TABLE_COLLATION = 'utf8mb4_unicode_ci'
      AND TABLE_NAME IN ('rules_categories', 'rules', 'rules_questions', 'rules_test_submissions', 'faq_categories', 'faq_items', 'media_videos', 'face_models');
  IF v_table_count <> 8 THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Missing table or unexpected engine/collation; no columns added';
  END IF;

  -- Базові колонки: назва, тип і NULL мають збігатися з надісланою структурою.
  SELECT MIN(CONCAT('Unexpected base column: ', r.table_name, '.', r.column_name)) INTO v_problem
  FROM (
      SELECT 'face_models' AS table_name, 'id' AS column_name, 'varchar(36)' AS column_type, 'NO' AS nullable
      UNION ALL
      SELECT 'face_models', 'name', 'varchar(255)', 'NO'
      UNION ALL
      SELECT 'face_models', 'gender', 'enum(''male'',''female'')', 'NO'
      UNION ALL
      SELECT 'face_models', 'image_url', 'text', 'YES'
      UNION ALL
      SELECT 'face_models', 'is_unique', 'tinyint(1)', 'YES'
      UNION ALL
      SELECT 'face_models', 'is_active', 'tinyint(1)', 'YES'
      UNION ALL
      SELECT 'face_models', 'created_at', 'timestamp', 'YES'
      UNION ALL
      SELECT 'faq_categories', 'id', 'varchar(36)', 'NO'
      UNION ALL
      SELECT 'faq_categories', 'name', 'varchar(255)', 'NO'
      UNION ALL
      SELECT 'faq_categories', 'order_index', 'int(11)', 'YES'
      UNION ALL
      SELECT 'faq_categories', 'created_at', 'timestamp', 'YES'
      UNION ALL
      SELECT 'faq_items', 'id', 'varchar(36)', 'NO'
      UNION ALL
      SELECT 'faq_items', 'category_id', 'varchar(36)', 'NO'
      UNION ALL
      SELECT 'faq_items', 'question', 'text', 'NO'
      UNION ALL
      SELECT 'faq_items', 'answer', 'text', 'NO'
      UNION ALL
      SELECT 'faq_items', 'order_index', 'int(11)', 'YES'
      UNION ALL
      SELECT 'faq_items', 'is_published', 'tinyint(1)', 'YES'
      UNION ALL
      SELECT 'faq_items', 'created_at', 'timestamp', 'YES'
      UNION ALL
      SELECT 'faq_items', 'updated_at', 'timestamp', 'YES'
      UNION ALL
      SELECT 'media_videos', 'id', 'varchar(36)', 'NO'
      UNION ALL
      SELECT 'media_videos', 'title', 'varchar(255)', 'NO'
      UNION ALL
      SELECT 'media_videos', 'url', 'text', 'NO'
      UNION ALL
      SELECT 'media_videos', 'thumbnail_url', 'text', 'YES'
      UNION ALL
      SELECT 'media_videos', 'order_index', 'int(11)', 'YES'
      UNION ALL
      SELECT 'media_videos', 'is_published', 'tinyint(1)', 'YES'
      UNION ALL
      SELECT 'media_videos', 'created_at', 'timestamp', 'YES'
      UNION ALL
      SELECT 'rules', 'id', 'varchar(36)', 'NO'
      UNION ALL
      SELECT 'rules', 'number', 'varchar(50)', 'YES'
      UNION ALL
      SELECT 'rules', 'category_id', 'varchar(36)', 'NO'
      UNION ALL
      SELECT 'rules', 'parent_id', 'varchar(36)', 'YES'
      UNION ALL
      SELECT 'rules', 'title', 'varchar(255)', 'NO'
      UNION ALL
      SELECT 'rules', 'content', 'text', 'NO'
      UNION ALL
      SELECT 'rules', 'order_index', 'int(11)', 'YES'
      UNION ALL
      SELECT 'rules', 'is_published', 'tinyint(1)', 'YES'
      UNION ALL
      SELECT 'rules', 'created_at', 'timestamp', 'YES'
      UNION ALL
      SELECT 'rules', 'updated_at', 'timestamp', 'YES'
      UNION ALL
      SELECT 'rules_categories', 'id', 'varchar(36)', 'NO'
      UNION ALL
      SELECT 'rules_categories', 'name', 'varchar(255)', 'NO'
      UNION ALL
      SELECT 'rules_categories', 'order_index', 'int(11)', 'YES'
      UNION ALL
      SELECT 'rules_categories', 'created_at', 'timestamp', 'YES'
      UNION ALL
      SELECT 'rules_questions', 'id', 'varchar(36)', 'NO'
      UNION ALL
      SELECT 'rules_questions', 'question_text', 'text', 'NO'
      UNION ALL
      SELECT 'rules_questions', 'correct_answer', 'text', 'YES'
      UNION ALL
      SELECT 'rules_questions', 'incorrect_answers', 'longtext', 'YES'
      UNION ALL
      SELECT 'rules_questions', 'category', 'varchar(255)', 'YES'
      UNION ALL
      SELECT 'rules_questions', 'difficulty', 'enum(''easy'',''medium'',''hard'')', 'YES'
      UNION ALL
      SELECT 'rules_questions', 'is_active', 'tinyint(1)', 'YES'
      UNION ALL
      SELECT 'rules_questions', 'created_at', 'timestamp', 'YES'
      UNION ALL
      SELECT 'rules_questions', 'updated_at', 'timestamp', 'YES'
      UNION ALL
      SELECT 'rules_test_submissions', 'id', 'varchar(36)', 'NO'
      UNION ALL
      SELECT 'rules_test_submissions', 'user_id', 'varchar(36)', 'YES'
      UNION ALL
      SELECT 'rules_test_submissions', 'steam_id', 'varchar(255)', 'NO'
      UNION ALL
      SELECT 'rules_test_submissions', 'discord_id', 'varchar(255)', 'YES'
      UNION ALL
      SELECT 'rules_test_submissions', 'answers', 'longtext', 'YES'
      UNION ALL
      SELECT 'rules_test_submissions', 'question_grades', 'longtext', 'YES'
      UNION ALL
      SELECT 'rules_test_submissions', 'score', 'int(11)', 'YES'
      UNION ALL
      SELECT 'rules_test_submissions', 'approved', 'tinyint(1)', 'YES'
      UNION ALL
      SELECT 'rules_test_submissions', 'feedback', 'text', 'YES'
      UNION ALL
      SELECT 'rules_test_submissions', 'created_at', 'timestamp', 'YES'
      UNION ALL
      SELECT 'rules_test_submissions', 'reviewed_at', 'timestamp', 'YES'
  ) AS r
  LEFT JOIN INFORMATION_SCHEMA.COLUMNS AS c
    ON c.TABLE_SCHEMA = 'dayzstal_eternalzone' AND c.TABLE_NAME = r.table_name AND c.COLUMN_NAME = r.column_name
  WHERE c.COLUMN_NAME IS NULL OR NOT (BINARY c.COLUMN_TYPE <=> BINARY r.column_type)
    OR NOT (c.IS_NULLABLE <=> r.nullable);
  IF v_problem IS NOT NULL THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = v_problem;
  END IF;

  -- Якщо частина EN-полів вже є, перевіряємо їх до внесення будь-яких змін.
  SELECT MIN(CONCAT('Incompatible translation column: ', e.table_name, '.', e.column_name)) INTO v_problem
  FROM (
      SELECT 'rules_categories' AS table_name, 'name_en' AS column_name, 'varchar' AS data_type, '255' AS max_length, 'YES' AS nullable
      UNION ALL
      SELECT 'rules', 'title_en', 'varchar', '255', 'YES'
      UNION ALL
      SELECT 'rules', 'content_en', 'text', NULL, 'YES'
      UNION ALL
      SELECT 'rules_questions', 'question_text_en', 'text', NULL, 'YES'
      UNION ALL
      SELECT 'rules_questions', 'category_en', 'varchar', '255', 'YES'
      UNION ALL
      SELECT 'rules_test_submissions', 'language', 'varchar', '2', 'NO'
      UNION ALL
      SELECT 'faq_categories', 'name_en', 'varchar', '255', 'YES'
      UNION ALL
      SELECT 'faq_items', 'question_en', 'text', NULL, 'YES'
      UNION ALL
      SELECT 'faq_items', 'answer_en', 'text', NULL, 'YES'
      UNION ALL
      SELECT 'media_videos', 'title_en', 'varchar', '255', 'YES'
      UNION ALL
      SELECT 'face_models', 'name_en', 'varchar', '255', 'YES'
  ) AS e
  JOIN INFORMATION_SCHEMA.COLUMNS AS c
    ON c.TABLE_SCHEMA = 'dayzstal_eternalzone' AND c.TABLE_NAME = e.table_name AND c.COLUMN_NAME = e.column_name
  WHERE NOT (c.DATA_TYPE <=> e.data_type)
    OR (e.data_type = 'varchar' AND NOT (c.CHARACTER_MAXIMUM_LENGTH <=> e.max_length))
    OR NOT (c.IS_NULLABLE <=> e.nullable)
    OR NOT (c.CHARACTER_SET_NAME <=> 'utf8mb4')
    OR NOT (c.COLLATION_NAME <=> 'utf8mb4_unicode_ci')
    OR NOT (c.IS_GENERATED <=> 'NEVER') OR COALESCE(c.EXTRA, '') <> ''
    OR (e.column_name <> 'language' AND NOT (c.COLUMN_DEFAULT IS NULL OR BINARY c.COLUMN_DEFAULT = BINARY 'NULL'))
    OR (e.column_name = 'language' AND NOT (BINARY c.COLUMN_DEFAULT <=> BINARY CONCAT(CHAR(39), 'uk', CHAR(39))));
  IF v_problem IS NOT NULL THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = v_problem;
  END IF;

  -- rules_categories.name_en
  IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = 'dayzstal_eternalzone' AND TABLE_NAME = 'rules_categories' AND COLUMN_NAME = 'name_en') THEN
    ALTER TABLE `dayzstal_eternalzone`.`rules_categories`
      ADD COLUMN `name_en` VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL, ALGORITHM=INSTANT, LOCK=NONE;
    SET v_applied = v_applied + 1;
  END IF;

  -- rules.title_en
  IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = 'dayzstal_eternalzone' AND TABLE_NAME = 'rules' AND COLUMN_NAME = 'title_en') THEN
    ALTER TABLE `dayzstal_eternalzone`.`rules`
      ADD COLUMN `title_en` VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL, ALGORITHM=INSTANT, LOCK=NONE;
    SET v_applied = v_applied + 1;
  END IF;

  -- rules.content_en
  IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = 'dayzstal_eternalzone' AND TABLE_NAME = 'rules' AND COLUMN_NAME = 'content_en') THEN
    ALTER TABLE `dayzstal_eternalzone`.`rules`
      ADD COLUMN `content_en` TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL, ALGORITHM=INSTANT, LOCK=NONE;
    SET v_applied = v_applied + 1;
  END IF;

  -- rules_questions.question_text_en
  IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = 'dayzstal_eternalzone' AND TABLE_NAME = 'rules_questions' AND COLUMN_NAME = 'question_text_en') THEN
    ALTER TABLE `dayzstal_eternalzone`.`rules_questions`
      ADD COLUMN `question_text_en` TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL, ALGORITHM=INSTANT, LOCK=NONE;
    SET v_applied = v_applied + 1;
  END IF;

  -- rules_questions.category_en
  IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = 'dayzstal_eternalzone' AND TABLE_NAME = 'rules_questions' AND COLUMN_NAME = 'category_en') THEN
    ALTER TABLE `dayzstal_eternalzone`.`rules_questions`
      ADD COLUMN `category_en` VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL, ALGORITHM=INSTANT, LOCK=NONE;
    SET v_applied = v_applied + 1;
  END IF;

  -- rules_test_submissions.language
  IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = 'dayzstal_eternalzone' AND TABLE_NAME = 'rules_test_submissions' AND COLUMN_NAME = 'language') THEN
    ALTER TABLE `dayzstal_eternalzone`.`rules_test_submissions`
      ADD COLUMN `language` VARCHAR(2) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'uk', ALGORITHM=INSTANT, LOCK=NONE;
    SET v_applied = v_applied + 1;
  END IF;

  -- faq_categories.name_en
  IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = 'dayzstal_eternalzone' AND TABLE_NAME = 'faq_categories' AND COLUMN_NAME = 'name_en') THEN
    ALTER TABLE `dayzstal_eternalzone`.`faq_categories`
      ADD COLUMN `name_en` VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL, ALGORITHM=INSTANT, LOCK=NONE;
    SET v_applied = v_applied + 1;
  END IF;

  -- faq_items.question_en
  IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = 'dayzstal_eternalzone' AND TABLE_NAME = 'faq_items' AND COLUMN_NAME = 'question_en') THEN
    ALTER TABLE `dayzstal_eternalzone`.`faq_items`
      ADD COLUMN `question_en` TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL, ALGORITHM=INSTANT, LOCK=NONE;
    SET v_applied = v_applied + 1;
  END IF;

  -- faq_items.answer_en
  IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = 'dayzstal_eternalzone' AND TABLE_NAME = 'faq_items' AND COLUMN_NAME = 'answer_en') THEN
    ALTER TABLE `dayzstal_eternalzone`.`faq_items`
      ADD COLUMN `answer_en` TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL, ALGORITHM=INSTANT, LOCK=NONE;
    SET v_applied = v_applied + 1;
  END IF;

  -- media_videos.title_en
  IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = 'dayzstal_eternalzone' AND TABLE_NAME = 'media_videos' AND COLUMN_NAME = 'title_en') THEN
    ALTER TABLE `dayzstal_eternalzone`.`media_videos`
      ADD COLUMN `title_en` VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL, ALGORITHM=INSTANT, LOCK=NONE;
    SET v_applied = v_applied + 1;
  END IF;

  -- face_models.name_en
  IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = 'dayzstal_eternalzone' AND TABLE_NAME = 'face_models' AND COLUMN_NAME = 'name_en') THEN
    ALTER TABLE `dayzstal_eternalzone`.`face_models`
      ADD COLUMN `name_en` VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL, ALGORITHM=INSTANT, LOCK=NONE;
    SET v_applied = v_applied + 1;
  END IF;

  SET SESSION lock_wait_timeout = v_saved_lock_wait_timeout;
  SET v_timeout_changed = FALSE;

  SELECT 'OK' AS migration_status, DATABASE() AS database_name, v_applied AS columns_added, 11 - v_applied AS columns_already_present;
  SELECT TABLE_NAME, COLUMN_NAME, COLUMN_TYPE, IS_NULLABLE, COLUMN_DEFAULT
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = 'dayzstal_eternalzone' AND (
    (TABLE_NAME = 'rules_categories' AND COLUMN_NAME = 'name_en') OR
    (TABLE_NAME = 'rules' AND COLUMN_NAME = 'title_en') OR
    (TABLE_NAME = 'rules' AND COLUMN_NAME = 'content_en') OR
    (TABLE_NAME = 'rules_questions' AND COLUMN_NAME = 'question_text_en') OR
    (TABLE_NAME = 'rules_questions' AND COLUMN_NAME = 'category_en') OR
    (TABLE_NAME = 'rules_test_submissions' AND COLUMN_NAME = 'language') OR
    (TABLE_NAME = 'faq_categories' AND COLUMN_NAME = 'name_en') OR
    (TABLE_NAME = 'faq_items' AND COLUMN_NAME = 'question_en') OR
    (TABLE_NAME = 'faq_items' AND COLUMN_NAME = 'answer_en') OR
    (TABLE_NAME = 'media_videos' AND COLUMN_NAME = 'title_en') OR
    (TABLE_NAME = 'face_models' AND COLUMN_NAME = 'name_en')
  ) ORDER BY TABLE_NAME, ORDINAL_POSITION;
END$$
DELIMITER ;
