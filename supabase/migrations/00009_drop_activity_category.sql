-- Migration: Drop category column from activities
-- The category field is no longer used - activities now use custom fields instead

ALTER TABLE activities DROP COLUMN IF EXISTS category;
