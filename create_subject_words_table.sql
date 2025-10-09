-- Create table for subject words
-- This table will store individual word/phrase entries with their associated subjects

CREATE TABLE IF NOT EXISTS subject_words (
  id SERIAL PRIMARY KEY,
  word_phrase TEXT NOT NULL,
  subject TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create an index on word_phrase for faster searches
CREATE INDEX IF NOT EXISTS idx_subject_words_word_phrase ON subject_words(word_phrase);

-- Create an index on subject for faster filtering
CREATE INDEX IF NOT EXISTS idx_subject_words_subject ON subject_words(subject);

-- Optional: Add a unique constraint to prevent duplicate entries
-- Uncomment the following line if you want to prevent duplicates
-- ALTER TABLE subject_words ADD CONSTRAINT unique_word_subject UNIQUE (word_phrase, subject);

