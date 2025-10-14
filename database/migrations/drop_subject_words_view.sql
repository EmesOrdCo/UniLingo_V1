-- Drop the redundant subject_words_with_translations view
-- This view was created for convenience but is not being used in the application

DROP VIEW IF EXISTS subject_words_with_translations;

-- Verify it's been dropped
SELECT 'View subject_words_with_translations has been dropped successfully' AS status;

