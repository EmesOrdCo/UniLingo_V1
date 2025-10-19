-- Add Cantonese translation columns to subject_words table
ALTER TABLE subject_words
ADD COLUMN IF NOT EXISTS cantonese_translation TEXT,
ADD COLUMN IF NOT EXISTS example_sentence_cantonese TEXT;
