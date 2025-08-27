-- Update flashcards table to support bilingual learning
ALTER TABLE flashcards 
ADD COLUMN IF NOT EXISTS front_language TEXT DEFAULT 'english' CHECK (front_language IN ('english', 'native')),
ADD COLUMN IF NOT EXISTS native_language TEXT DEFAULT 'english',
ADD COLUMN IF NOT EXISTS pinyin TEXT,
ADD COLUMN IF NOT EXISTS example TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS pronunciation TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'manual' CHECK (source IN ('manual', 'ai_extraction', 'ai_generated'));

-- Update existing records to have default values
UPDATE flashcards 
SET 
  front_language = 'english',
  native_language = 'english',
  example = COALESCE(example, ''),
  pronunciation = COALESCE(pronunciation, ''),
  source = 'manual'
WHERE front_language IS NULL;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_flashcards_front_language ON flashcards(front_language);
CREATE INDEX IF NOT EXISTS idx_flashcards_native_language ON flashcards(native_language);
CREATE INDEX IF NOT EXISTS idx_flashcards_source ON flashcards(source);

-- Update RLS policies if needed
-- (Your existing RLS policies should still work with the new columns)
