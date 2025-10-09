-- Add translation columns to subject_words table
-- This allows words/phrases to be stored in multiple languages

-- Add translation columns
ALTER TABLE subject_words
ADD COLUMN IF NOT EXISTS french_translation TEXT,
ADD COLUMN IF NOT EXISTS spanish_translation TEXT,
ADD COLUMN IF NOT EXISTS german_translation TEXT,
ADD COLUMN IF NOT EXISTS mandarin_translation TEXT,
ADD COLUMN IF NOT EXISTS hindi_translation TEXT;

-- Add example sentence columns for all languages
ALTER TABLE subject_words
ADD COLUMN IF NOT EXISTS example_sentence_english TEXT,
ADD COLUMN IF NOT EXISTS example_sentence_french TEXT,
ADD COLUMN IF NOT EXISTS example_sentence_spanish TEXT,
ADD COLUMN IF NOT EXISTS example_sentence_german TEXT,
ADD COLUMN IF NOT EXISTS example_sentence_mandarin TEXT,
ADD COLUMN IF NOT EXISTS example_sentence_hindi TEXT;

-- Create indexes for the translation columns for faster searches
CREATE INDEX IF NOT EXISTS idx_subject_words_french ON subject_words(french_translation);
CREATE INDEX IF NOT EXISTS idx_subject_words_spanish ON subject_words(spanish_translation);
CREATE INDEX IF NOT EXISTS idx_subject_words_german ON subject_words(german_translation);
CREATE INDEX IF NOT EXISTS idx_subject_words_mandarin ON subject_words(mandarin_translation);
CREATE INDEX IF NOT EXISTS idx_subject_words_hindi ON subject_words(hindi_translation);

-- Drop existing view if it exists
DROP VIEW IF EXISTS subject_words_with_translations;

-- Create a view to see all translations and example sentences
CREATE VIEW subject_words_with_translations AS
SELECT 
  id,
  word_phrase as english_word,
  french_translation,
  spanish_translation,
  german_translation,
  mandarin_translation,
  hindi_translation,
  example_sentence_english,
  example_sentence_french,
  example_sentence_spanish,
  example_sentence_german,
  example_sentence_mandarin,
  example_sentence_hindi,
  subject,
  created_at
FROM subject_words;

-- Function to get words by language with example sentences
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
      WHEN 'french' THEN COALESCE(sw.french_translation, sw.word_phrase)
      WHEN 'spanish' THEN COALESCE(sw.spanish_translation, sw.word_phrase)
      WHEN 'german' THEN COALESCE(sw.german_translation, sw.word_phrase)
      WHEN 'mandarin' THEN COALESCE(sw.mandarin_translation, sw.word_phrase)
      WHEN 'hindi' THEN COALESCE(sw.hindi_translation, sw.word_phrase)
      ELSE sw.word_phrase
    END,
    CASE p_language
      WHEN 'english' THEN sw.example_sentence_english
      WHEN 'french' THEN COALESCE(sw.example_sentence_french, sw.example_sentence_english)
      WHEN 'spanish' THEN COALESCE(sw.example_sentence_spanish, sw.example_sentence_english)
      WHEN 'german' THEN COALESCE(sw.example_sentence_german, sw.example_sentence_english)
      WHEN 'mandarin' THEN COALESCE(sw.example_sentence_mandarin, sw.example_sentence_english)
      WHEN 'hindi' THEN COALESCE(sw.example_sentence_hindi, sw.example_sentence_english)
      ELSE sw.example_sentence_english
    END,
    sw.subject,
    sw.created_at
  FROM subject_words sw
  WHERE p_subject IS NULL OR sw.subject = p_subject
  ORDER BY sw.word_phrase;
END;
$$ LANGUAGE plpgsql;

-- Function to search words in any language
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
  mandarin_translation TEXT,
  hindi_translation TEXT,
  subject TEXT,
  matched_language TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    sw.id,
    sw.word_phrase,
    sw.french_translation,
    sw.spanish_translation,
    sw.german_translation,
    sw.mandarin_translation,
    sw.hindi_translation,
    sw.subject,
    CASE 
      WHEN sw.word_phrase ILIKE '%' || p_search_term || '%' THEN 'english'
      WHEN sw.french_translation ILIKE '%' || p_search_term || '%' THEN 'french'
      WHEN sw.spanish_translation ILIKE '%' || p_search_term || '%' THEN 'spanish'
      WHEN sw.german_translation ILIKE '%' || p_search_term || '%' THEN 'german'
      WHEN sw.mandarin_translation LIKE '%' || p_search_term || '%' THEN 'mandarin'
      WHEN sw.hindi_translation LIKE '%' || p_search_term || '%' THEN 'hindi'
      ELSE 'unknown'
    END as matched_language
  FROM subject_words sw
  WHERE 
    (p_subject IS NULL OR sw.subject = p_subject)
    AND (
      sw.word_phrase ILIKE '%' || p_search_term || '%'
      OR sw.french_translation ILIKE '%' || p_search_term || '%'
      OR sw.spanish_translation ILIKE '%' || p_search_term || '%'
      OR sw.german_translation ILIKE '%' || p_search_term || '%'
      OR sw.mandarin_translation LIKE '%' || p_search_term || '%'
      OR sw.hindi_translation LIKE '%' || p_search_term || '%'
    )
  ORDER BY sw.word_phrase;
END;
$$ LANGUAGE plpgsql;

-- Function to batch update translations and example sentences (useful for importing)
CREATE OR REPLACE FUNCTION update_word_translations(
  p_word_id INTEGER,
  p_french TEXT DEFAULT NULL,
  p_spanish TEXT DEFAULT NULL,
  p_german TEXT DEFAULT NULL,
  p_mandarin TEXT DEFAULT NULL,
  p_hindi TEXT DEFAULT NULL,
  p_example_english TEXT DEFAULT NULL,
  p_example_french TEXT DEFAULT NULL,
  p_example_spanish TEXT DEFAULT NULL,
  p_example_german TEXT DEFAULT NULL,
  p_example_mandarin TEXT DEFAULT NULL,
  p_example_hindi TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE subject_words
  SET 
    french_translation = COALESCE(p_french, french_translation),
    spanish_translation = COALESCE(p_spanish, spanish_translation),
    german_translation = COALESCE(p_german, german_translation),
    mandarin_translation = COALESCE(p_mandarin, mandarin_translation),
    hindi_translation = COALESCE(p_hindi, hindi_translation),
    example_sentence_english = COALESCE(p_example_english, example_sentence_english),
    example_sentence_french = COALESCE(p_example_french, example_sentence_french),
    example_sentence_spanish = COALESCE(p_example_spanish, example_sentence_spanish),
    example_sentence_german = COALESCE(p_example_german, example_sentence_german),
    example_sentence_mandarin = COALESCE(p_example_mandarin, example_sentence_mandarin),
    example_sentence_hindi = COALESCE(p_example_hindi, example_sentence_hindi)
  WHERE id = p_word_id;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- Example usage:

-- 1. Get all words in French
-- SELECT * FROM get_subject_words_by_language('french');

-- 2. Get words for a specific subject in Spanish
-- SELECT * FROM get_subject_words_by_language('spanish', 'Computer Science');

-- 3. Search for a word in any language
-- SELECT * FROM search_subject_words_multilingual('hello');

-- 4. Update translations and example sentences for a specific word
-- SELECT update_word_translations(
--   1, 
--   'bonjour',                                    -- French translation
--   'hola',                                       -- Spanish translation
--   'hallo',                                      -- German translation
--   '你好',                                        -- Mandarin translation
--   'नमस्ते',                                      -- Hindi translation
--   'Hello, how are you?',                       -- English example
--   'Bonjour, comment allez-vous?',              -- French example
--   'Hola, ¿cómo estás?',                        -- Spanish example
--   'Hallo, wie geht es dir?',                   -- German example
--   '你好，你好吗？',                               -- Mandarin example
--   'नमस्ते, आप कैसे हैं?'                        -- Hindi example
-- );

-- 5. Bulk insert with translations and example sentences:
-- INSERT INTO subject_words (
--   word_phrase, 
--   french_translation, 
--   spanish_translation, 
--   german_translation, 
--   mandarin_translation, 
--   hindi_translation,
--   example_sentence_english,
--   example_sentence_french,
--   example_sentence_spanish,
--   example_sentence_german,
--   example_sentence_mandarin,
--   example_sentence_hindi,
--   subject
-- ) VALUES (
--   'hello',
--   'bonjour',
--   'hola',
--   'hallo',
--   '你好',
--   'नमस्ते',
--   'Hello, how are you today?',
--   'Bonjour, comment allez-vous aujourd''hui?',
--   'Hola, ¿cómo estás hoy?',
--   'Hallo, wie geht es dir heute?',
--   '你好，你今天好吗？',
--   'नमस्ते, आज आप कैसे हैं?',
--   'Greetings'
-- );

-- 6. Get words with example sentences in a specific language
-- SELECT id, word, example_sentence FROM get_subject_words_by_language('french');
-- SELECT id, word, example_sentence FROM get_subject_words_by_language('spanish', 'Computer Science');

