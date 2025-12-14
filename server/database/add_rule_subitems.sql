-- Add parent_id column to rules table for subitems support
ALTER TABLE rules ADD COLUMN parent_id VARCHAR(36) DEFAULT NULL AFTER category_id;
ALTER TABLE rules ADD FOREIGN KEY (parent_id) REFERENCES rules(id) ON DELETE CASCADE;
ALTER TABLE rules ADD INDEX idx_rules_parent_id (parent_id);
