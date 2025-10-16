-- Add Chinese Traditional translation columns to subject_words table
-- This migration adds support for Chinese Traditional translations

-- Add Chinese Traditional translation columns
ALTER TABLE subject_words
ADD COLUMN IF NOT EXISTS "chinese(traditional)_translation" TEXT,
ADD COLUMN IF NOT EXISTS "example_sentence_chinese(traditional)" TEXT;

-- Create indexes for the new translation columns for faster searches
CREATE INDEX IF NOT EXISTS idx_subject_words_chinese_traditional ON subject_words("chinese(traditional)_translation");

-- Update the existing view to include the new columns
DROP VIEW IF EXISTS subject_words_with_translations;

CREATE VIEW subject_words_with_translations AS
SELECT 
  id,
  english_translation as english_word,
  english_translation,
  french_translation,
  spanish_translation,
  german_translation,
  chinese_simplified_translation,
  "chinese(traditional)_translation",
  hindi_translation,
  example_sentence_english,
  example_sentence_french,
  example_sentence_spanish,
  example_sentence_german,
  example_sentence_chinese_simplified,
  "example_sentence_chinese(traditional)",
  example_sentence_hindi,
  subject,
  cefr_level,
  created_at
FROM subject_words;

-- Update the function to get words by language to include Chinese Traditional
CREATE OR REPLACE FUNCTION get_subject_words_by_language(
  p_language TEXT DEFAULT 'english',
  p_subject TEXT DEFAULT NULL
)
RETURNS TABLE (
  id INTEGER,
  word TEXT,
  example_sentence TEXT,
  subject TEXT,
  created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    sw.id,
    CASE p_language
      WHEN 'french' THEN COALESCE(sw.french_translation, sw.english_translation)
      WHEN 'spanish' THEN COALESCE(sw.spanish_translation, sw.english_translation)
      WHEN 'german' THEN COALESCE(sw.german_translation, sw.english_translation)
      WHEN 'chinese_simplified' THEN COALESCE(sw.chinese_simplified_translation, sw.english_translation)
      WHEN 'chinese_traditional' THEN COALESCE(sw."chinese(traditional)_translation", sw.english_translation)
      WHEN 'hindi' THEN COALESCE(sw.hindi_translation, sw.english_translation)
      ELSE sw.english_translation
    END,
    CASE p_language
      WHEN 'english' THEN sw.example_sentence_english
      WHEN 'french' THEN COALESCE(sw.example_sentence_french, sw.example_sentence_english)
      WHEN 'spanish' THEN COALESCE(sw.example_sentence_spanish, sw.example_sentence_english)
      WHEN 'german' THEN COALESCE(sw.example_sentence_german, sw.example_sentence_english)
      WHEN 'chinese_simplified' THEN COALESCE(sw.example_sentence_chinese_simplified, sw.example_sentence_english)
      WHEN 'chinese_traditional' THEN COALESCE(sw."example_sentence_chinese(traditional)", sw.example_sentence_english)
      WHEN 'hindi' THEN COALESCE(sw.example_sentence_hindi, sw.example_sentence_english)
      ELSE sw.example_sentence_english
    END,
    sw.subject,
    sw.created_at
  FROM subject_words sw
  WHERE p_subject IS NULL OR sw.subject = p_subject
  ORDER BY sw.english_translation;
END;
$$ LANGUAGE plpgsql;

-- Update the multilingual search function to include Chinese Traditional
CREATE OR REPLACE FUNCTION search_subject_words_multilingual(
  p_search_term TEXT,
  p_subject TEXT DEFAULT NULL
)
RETURNS TABLE (
  id INTEGER,
  english_word TEXT,
  french_translation TEXT,
  spanish_translation TEXT,
  german_translation TEXT,
  chinese_simplified_translation TEXT,
  "chinese(traditional)_translation" TEXT,
  hindi_translation TEXT,
  subject TEXT,
  matched_language TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    sw.id,
    sw.english_translation,
    sw.french_translation,
    sw.spanish_translation,
    sw.german_translation,
    sw.chinese_simplified_translation,
    sw."chinese(traditional)_translation",
    sw.hindi_translation,
    sw.subject,
    CASE 
      WHEN sw.english_translation ILIKE '%' || p_search_term || '%' THEN 'english'
      WHEN sw.french_translation ILIKE '%' || p_search_term || '%' THEN 'french'
      WHEN sw.spanish_translation ILIKE '%' || p_search_term || '%' THEN 'spanish'
      WHEN sw.german_translation ILIKE '%' || p_search_term || '%' THEN 'german'
      WHEN sw.chinese_simplified_translation LIKE '%' || p_search_term || '%' THEN 'chinese_simplified'
      WHEN sw."chinese(traditional)_translation" LIKE '%' || p_search_term || '%' THEN 'chinese_traditional'
      WHEN sw.hindi_translation LIKE '%' || p_search_term || '%' THEN 'hindi'
      ELSE 'unknown'
    END as matched_language
  FROM subject_words sw
  WHERE 
    (p_subject IS NULL OR sw.subject = p_subject)
    AND (
      sw.english_translation ILIKE '%' || p_search_term || '%'
      OR sw.french_translation ILIKE '%' || p_search_term || '%'
      OR sw.spanish_translation ILIKE '%' || p_search_term || '%'
      OR sw.german_translation ILIKE '%' || p_search_term || '%'
      OR sw.chinese_simplified_translation LIKE '%' || p_search_term || '%'
      OR sw."chinese(traditional)_translation" LIKE '%' || p_search_term || '%'
      OR sw.hindi_translation LIKE '%' || p_search_term || '%'
    )
  ORDER BY sw.english_translation;
END;
$$ LANGUAGE plpgsql;

-- Update the batch update function to include Chinese Traditional
CREATE OR REPLACE FUNCTION update_word_translations(
  p_word_id INTEGER,
  p_french TEXT DEFAULT NULL,
  p_spanish TEXT DEFAULT NULL,
  p_german TEXT DEFAULT NULL,
  p_chinese_simplified TEXT DEFAULT NULL,
  p_chinese_traditional TEXT DEFAULT NULL,
  p_hindi TEXT DEFAULT NULL,
  p_example_english TEXT DEFAULT NULL,
  p_example_french TEXT DEFAULT NULL,
  p_example_spanish TEXT DEFAULT NULL,
  p_example_german TEXT DEFAULT NULL,
  p_example_chinese_simplified TEXT DEFAULT NULL,
  p_example_chinese_traditional TEXT DEFAULT NULL,
  p_example_hindi TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE subject_words
  SET 
    french_translation = COALESCE(p_french, french_translation),
    spanish_translation = COALESCE(p_spanish, spanish_translation),
    german_translation = COALESCE(p_german, german_translation),
    chinese_simplified_translation = COALESCE(p_chinese_simplified, chinese_simplified_translation),
    "chinese(traditional)_translation" = COALESCE(p_chinese_traditional, "chinese(traditional)_translation"),
    hindi_translation = COALESCE(p_hindi, hindi_translation),
    example_sentence_english = COALESCE(p_example_english, example_sentence_english),
    example_sentence_french = COALESCE(p_example_french, example_sentence_french),
    example_sentence_spanish = COALESCE(p_example_spanish, example_sentence_spanish),
    example_sentence_german = COALESCE(p_example_german, example_sentence_german),
    example_sentence_chinese_simplified = COALESCE(p_example_chinese_simplified, example_sentence_chinese_simplified),
    "example_sentence_chinese(traditional)" = COALESCE(p_example_chinese_traditional, "example_sentence_chinese(traditional)"),
    example_sentence_hindi = COALESCE(p_example_hindi, example_sentence_hindi)
  WHERE id = p_word_id;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- Example usage for the new Chinese Traditional columns:
-- SELECT * FROM get_subject_words_by_language('chinese_traditional');
-- SELECT * FROM search_subject_words_multilingual('你好');
-- SELECT update_word_translations(1, NULL, NULL, NULL, NULL, '你好', NULL, NULL, NULL, NULL, NULL, NULL, '你好，你好吗？', NULL);
