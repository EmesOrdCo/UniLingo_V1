-- Add Chinese Traditional translation columns to subject_words table
-- Simple migration to add just the 2 new columns

ALTER TABLE subject_words
ADD COLUMN IF NOT EXISTS "chinese(traditional)_translation" TEXT,
ADD COLUMN IF NOT EXISTS "example_sentence_chinese(traditional)" TEXT;
