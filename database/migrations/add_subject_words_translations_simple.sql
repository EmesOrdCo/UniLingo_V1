-- Add translation columns to subject_words table
ALTER TABLE subject_words
ADD COLUMN IF NOT EXISTS french_translation TEXT,
ADD COLUMN IF NOT EXISTS spanish_translation TEXT,
ADD COLUMN IF NOT EXISTS german_translation TEXT,
ADD COLUMN IF NOT EXISTS chinese_simplified_translation TEXT,
ADD COLUMN IF NOT EXISTS hindi_translation TEXT;

-- Add example sentence columns for all languages
ALTER TABLE subject_words
ADD COLUMN IF NOT EXISTS example_sentence_english TEXT,
ADD COLUMN IF NOT EXISTS example_sentence_french TEXT,
ADD COLUMN IF NOT EXISTS example_sentence_spanish TEXT,
ADD COLUMN IF NOT EXISTS example_sentence_german TEXT,
ADD COLUMN IF NOT EXISTS example_sentence_chinese_simplified TEXT,
ADD COLUMN IF NOT EXISTS example_sentence_hindi TEXT;

