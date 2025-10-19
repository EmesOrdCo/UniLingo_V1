-- Add subject translation columns to subject_words table
-- These columns will store translations of the subject category (Medicine, Engineering, etc.)

ALTER TABLE subject_words
ADD COLUMN IF NOT EXISTS subject_french TEXT,
ADD COLUMN IF NOT EXISTS subject_spanish TEXT,
ADD COLUMN IF NOT EXISTS subject_german TEXT,
ADD COLUMN IF NOT EXISTS subject_chinese_simplified TEXT,
ADD COLUMN IF NOT EXISTS subject_hindi TEXT,
ADD COLUMN IF NOT EXISTS subject_italian TEXT,
ADD COLUMN IF NOT EXISTS subject_cantonese TEXT,
ADD COLUMN IF NOT EXISTS subject_chinese_traditional TEXT;
