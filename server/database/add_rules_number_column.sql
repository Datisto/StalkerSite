-- Add number column to rules table
ALTER TABLE rules ADD COLUMN number VARCHAR(50) DEFAULT NULL AFTER id;
