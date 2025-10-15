-- ============================================
-- Replace Mandarin with Chinese (Simplified) and Chinese (Traditional)
-- ============================================
-- This migration replaces all mandarin references with proper Chinese script variants
-- 
-- Chinese (Simplified) - Used in mainland China, Singapore, Malaysia
-- Chinese (Traditional) - Used in Taiwan, Hong Kong, Macau
--
-- Migration Strategy:
-- 1. Add new columns for Chinese (Simplified) and Chinese (Traditional)
-- 2. Copy existing mandarin data to Chinese (Simplified) as default
-- 3. Update all functions, views, and indexes
-- 4. Drop old mandarin columns after verification
-- ============================================

-- Step 1: Add new Chinese variant columns to subject_words table
ALTER TABLE subject_words
ADD COLUMN IF NOT EXISTS chinese_simplified_translation TEXT,
ADD COLUMN IF NOT EXISTS chinese_traditional_translation TEXT,
ADD COLUMN IF NOT EXISTS example_sentence_chinese_simplified TEXT,
ADD COLUMN IF NOT EXISTS example_sentence_chinese_traditional TEXT;

-- Step 2: Add new Chinese variant columns to arcade_games table
ALTER TABLE arcade_games
ADD COLUMN IF NOT EXISTS chinese_simplified_name TEXT,
ADD COLUMN IF NOT EXISTS chinese_traditional_name TEXT,
ADD COLUMN IF NOT EXISTS chinese_simplified_description TEXT,
ADD COLUMN IF NOT EXISTS chinese_traditional_description TEXT;

-- Step 3: Copy existing mandarin data to Chinese (Simplified) as default
-- This preserves existing data while providing the new structure
UPDATE subject_words 
SET 
  chinese_simplified_translation = mandarin_translation,
  example_sentence_chinese_simplified = example_sentence_mandarin
WHERE mandarin_translation IS NOT NULL OR example_sentence_mandarin IS NOT NULL;

UPDATE arcade_games 
SET 
  chinese_simplified_name = mandarin_name,
  chinese_simplified_description = mandarin_description
WHERE mandarin_name IS NOT NULL OR mandarin_description IS NOT NULL;

-- Step 4: Create indexes for the new Chinese columns
CREATE INDEX IF NOT EXISTS idx_subject_words_chinese_simplified ON subject_words(chinese_simplified_translation);
CREATE INDEX IF NOT EXISTS idx_subject_words_chinese_traditional ON subject_words(chinese_traditional_translation);

-- Step 5: Drop existing view and recreate with new Chinese columns
DROP VIEW IF EXISTS subject_words_with_translations;

CREATE VIEW subject_words_with_translations AS
SELECT 
  id,
  word_phrase as english_word,
  french_translation,
  spanish_translation,
  german_translation,
  chinese_simplified_translation,
  chinese_traditional_translation,
  hindi_translation,
  example_sentence_english,
  example_sentence_french,
  example_sentence_spanish,
  example_sentence_german,
  example_sentence_chinese_simplified,
  example_sentence_chinese_traditional,
  example_sentence_hindi,
  subject,
  created_at
FROM subject_words;

-- Step 6: Drop existing arcade games view and recreate
DROP VIEW IF EXISTS arcade_games_localized;

CREATE VIEW arcade_games_localized AS
SELECT 
  id,
  name as english_name,
  description as english_description,
  french_name,
  french_description,
  spanish_name,
  spanish_description,
  german_name,
  german_description,
  chinese_simplified_name,
  chinese_traditional_name,
  chinese_simplified_description,
  chinese_traditional_description,
  hindi_name,
  hindi_description,
  game_url,
  xp_cost,
  category,
  difficulty,
  is_active,
  play_count,
  created_at
FROM arcade_games;

-- Step 7: Update get_subject_words_by_language function
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
      WHEN 'chinese_simplified' THEN COALESCE(sw.chinese_simplified_translation, sw.word_phrase)
      WHEN 'chinese_traditional' THEN COALESCE(sw.chinese_traditional_translation, sw.word_phrase)
      WHEN 'hindi' THEN COALESCE(sw.hindi_translation, sw.word_phrase)
      ELSE sw.word_phrase
    END,
    CASE p_language
      WHEN 'english' THEN sw.example_sentence_english
      WHEN 'french' THEN COALESCE(sw.example_sentence_french, sw.example_sentence_english)
      WHEN 'spanish' THEN COALESCE(sw.example_sentence_spanish, sw.example_sentence_english)
      WHEN 'german' THEN COALESCE(sw.example_sentence_german, sw.example_sentence_english)
      WHEN 'chinese_simplified' THEN COALESCE(sw.example_sentence_chinese_simplified, sw.example_sentence_english)
      WHEN 'chinese_traditional' THEN COALESCE(sw.example_sentence_chinese_traditional, sw.example_sentence_english)
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

-- Step 8: Update search_subject_words_multilingual function
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
  chinese_traditional_translation TEXT,
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
    sw.chinese_simplified_translation,
    sw.chinese_traditional_translation,
    sw.hindi_translation,
    sw.subject,
    CASE 
      WHEN sw.word_phrase ILIKE '%' || p_search_term || '%' THEN 'english'
      WHEN sw.french_translation ILIKE '%' || p_search_term || '%' THEN 'french'
      WHEN sw.spanish_translation ILIKE '%' || p_search_term || '%' THEN 'spanish'
      WHEN sw.german_translation ILIKE '%' || p_search_term || '%' THEN 'german'
      WHEN sw.chinese_simplified_translation LIKE '%' || p_search_term || '%' THEN 'chinese_simplified'
      WHEN sw.chinese_traditional_translation LIKE '%' || p_search_term || '%' THEN 'chinese_traditional'
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
      OR sw.chinese_simplified_translation LIKE '%' || p_search_term || '%'
      OR sw.chinese_traditional_translation LIKE '%' || p_search_term || '%'
      OR sw.hindi_translation LIKE '%' || p_search_term || '%'
    )
  ORDER BY sw.word_phrase;
END;
$$ LANGUAGE plpgsql;

-- Step 9: Update update_word_translations function
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
    chinese_traditional_translation = COALESCE(p_chinese_traditional, chinese_traditional_translation),
    hindi_translation = COALESCE(p_hindi, hindi_translation),
    example_sentence_english = COALESCE(p_example_english, example_sentence_english),
    example_sentence_french = COALESCE(p_example_french, example_sentence_french),
    example_sentence_spanish = COALESCE(p_example_spanish, example_sentence_spanish),
    example_sentence_german = COALESCE(p_example_german, example_sentence_german),
    example_sentence_chinese_simplified = COALESCE(p_example_chinese_simplified, example_sentence_chinese_simplified),
    example_sentence_chinese_traditional = COALESCE(p_example_chinese_traditional, example_sentence_chinese_traditional),
    example_sentence_hindi = COALESCE(p_example_hindi, example_sentence_hindi)
  WHERE id = p_word_id;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- Step 10: Update get_arcade_games_by_language function
CREATE OR REPLACE FUNCTION get_arcade_games_by_language(p_language TEXT DEFAULT 'english')
RETURNS TABLE (
  id UUID,
  name TEXT,
  description TEXT,
  game_url TEXT,
  xp_cost INTEGER,
  category TEXT,
  difficulty TEXT,
  is_active BOOLEAN,
  play_count INTEGER,
  created_at TIMESTAMP
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ag.id,
    CASE p_language
      WHEN 'french' THEN COALESCE(ag.french_name, ag.name)
      WHEN 'spanish' THEN COALESCE(ag.spanish_name, ag.name)
      WHEN 'german' THEN COALESCE(ag.german_name, ag.name)
      WHEN 'chinese_simplified' THEN COALESCE(ag.chinese_simplified_name, ag.name)
      WHEN 'chinese_traditional' THEN COALESCE(ag.chinese_traditional_name, ag.name)
      WHEN 'hindi' THEN COALESCE(ag.hindi_name, ag.name)
      ELSE ag.name
    END,
    CASE p_language
      WHEN 'french' THEN COALESCE(ag.french_description, ag.description)
      WHEN 'spanish' THEN COALESCE(ag.spanish_description, ag.description)
      WHEN 'german' THEN COALESCE(ag.german_description, ag.description)
      WHEN 'chinese_simplified' THEN COALESCE(ag.chinese_simplified_description, ag.description)
      WHEN 'chinese_traditional' THEN COALESCE(ag.chinese_traditional_description, ag.description)
      WHEN 'hindi' THEN COALESCE(ag.hindi_description, ag.description)
      ELSE ag.description
    END,
    ag.game_url,
    ag.xp_cost,
    ag.category,
    ag.difficulty,
    ag.is_active,
    ag.play_count,
    ag.created_at
  FROM arcade_games ag
  WHERE ag.is_active = true
  ORDER BY ag.category, ag.name;
END;
$$ LANGUAGE plpgsql;

-- Step 12: Add some sample Traditional Chinese translations for testing
-- This provides examples of how Traditional Chinese differs from Simplified
UPDATE arcade_games 
SET 
  chinese_traditional_name = CASE name
    WHEN 'Hextris' THEN '六邊形方塊'
    WHEN '2048' THEN '2048'
    WHEN 'Flappy Bird' THEN '笨鳥先飛'
    WHEN 'Snake' THEN '貪吃蛇'
    WHEN 'Tetris' THEN '俄羅斯方塊'
    WHEN 'Breakout' THEN '打磚塊'
    WHEN 'Space Invaders' THEN '太空侵略者'
    WHEN 'Pac-Man' THEN '吃豆人'
    ELSE chinese_traditional_name
  END,
  chinese_traditional_description = CASE name
    WHEN 'Hextris' THEN '快節奏的六邊形網格拼圖遊戲。旋轉六邊形以匹配顏色！'
    WHEN '2048' THEN '合併數字，達到2048方塊！令人上癮的益智遊戲。'
    WHEN 'Flappy Bird' THEN '點擊拍打翅膀，穿過管道。你能飛多遠？'
    WHEN 'Snake' THEN '經典貪吃蛇遊戲。吃食物並成長，但不要碰到自己！'
    WHEN 'Tetris' THEN '永恆的益智遊戲。通過完成行來清除線條！'
    WHEN 'Breakout' THEN '用你的擋板和球打破所有磚塊。經典街機動作！'
    WHEN 'Space Invaders' THEN '保衛地球免受外星入侵者！擊落所有敵人！'
    WHEN 'Pac-Man' THEN '吃掉所有豆子，避開幽靈。真正的經典！'
    ELSE chinese_traditional_description
  END
WHERE name IN ('Hextris', '2048', 'Flappy Bird', 'Snake', 'Tetris', 'Breakout', 'Space Invaders', 'Pac-Man');

-- Step 13: Add sample Traditional Chinese translations for subject words
-- This shows how some words differ between Simplified and Traditional Chinese
UPDATE subject_words 
SET 
  chinese_traditional_translation = CASE word_phrase
    WHEN 'Diagnosis' THEN '診斷'
    WHEN 'Surgery' THEN '外科手術'
    WHEN 'Prescription' THEN '處方'
    WHEN 'Algorithm' THEN '演算法'
    WHEN 'Infrastructure' THEN '基礎設施'
    WHEN 'Prototype' THEN '原型'
    WHEN 'Quantum' THEN '量子'
    WHEN 'Momentum' THEN '動量'
    WHEN 'Thermodynamics' THEN '熱力學'
    WHEN 'Ecosystem' THEN '生態系統'
    WHEN 'Photosynthesis' THEN '光合作用'
    WHEN 'Evolution' THEN '進化'
    WHEN 'Catalyst' THEN '催化劑'
    WHEN 'Molecule' THEN '分子'
    WHEN 'Synthesis' THEN '合成'
    WHEN 'Derivative' THEN '導數'
    WHEN 'Probability' THEN '概率'
    WHEN 'Statistics' THEN '統計學'
    WHEN 'Database' THEN '資料庫'
    WHEN 'Framework' THEN '框架'
    WHEN 'Debugging' THEN '調試'
    WHEN 'Cognitive' THEN '認知'
    WHEN 'Behavioral' THEN '行為'
    WHEN 'Neuroscience' THEN '神經科學'
    WHEN 'Inflation' THEN '通貨膨脹'
    WHEN 'Market' THEN '市場'
    WHEN 'Supply' THEN '供應'
    WHEN 'Jurisdiction' THEN '管轄權'
    WHEN 'Contract' THEN '合同'
    WHEN 'Litigation' THEN '訴訟'
    ELSE chinese_traditional_translation
  END
WHERE word_phrase IN (
  'Diagnosis', 'Surgery', 'Prescription', 'Algorithm', 'Infrastructure', 'Prototype',
  'Quantum', 'Momentum', 'Thermodynamics', 'Ecosystem', 'Photosynthesis', 'Evolution',
  'Catalyst', 'Molecule', 'Synthesis', 'Derivative', 'Probability', 'Statistics',
  'Database', 'Framework', 'Debugging', 'Cognitive', 'Behavioral', 'Neuroscience',
  'Inflation', 'Market', 'Supply', 'Jurisdiction', 'Contract', 'Litigation'
);

-- Step 14: Verification queries
-- Run these to verify the migration was successful
SELECT 'Migration completed successfully!' as status;

SELECT 'Sample Chinese (Simplified) translations:' as info;
SELECT word_phrase, chinese_simplified_translation 
FROM subject_words 
WHERE chinese_simplified_translation IS NOT NULL 
LIMIT 5;

SELECT 'Sample Chinese (Traditional) translations:' as info;
SELECT word_phrase, chinese_traditional_translation 
FROM subject_words 
WHERE chinese_traditional_translation IS NOT NULL 
LIMIT 5;

SELECT 'Function test - Chinese (Simplified):' as info;
SELECT * FROM get_subject_words_by_language('chinese_simplified') LIMIT 3;

SELECT 'Function test - Chinese (Traditional):' as info;
SELECT * FROM get_subject_words_by_language('chinese_traditional') LIMIT 3;

-- ============================================
-- NEXT STEPS (to be run after verification):
-- ============================================
-- 1. Update frontend code to use new column names
-- 2. Update backend translation services
-- 3. Test all functionality
-- 4. After verification, run the cleanup script:
--    DROP INDEX IF EXISTS idx_subject_words_mandarin;
--    ALTER TABLE subject_words DROP COLUMN IF EXISTS mandarin_translation;
--    ALTER TABLE subject_words DROP COLUMN IF EXISTS example_sentence_mandarin;
--    ALTER TABLE arcade_games DROP COLUMN IF EXISTS mandarin_name;
--    ALTER TABLE arcade_games DROP COLUMN IF EXISTS mandarin_description;
--    -- Note: mandarin_lesson_script was renamed to chinese_simplified_lesson_script
--    -- No cleanup needed for this column
-- ============================================
