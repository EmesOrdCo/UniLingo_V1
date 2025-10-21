-- Add cefr_sub_level column to lesson_scripts table
ALTER TABLE lesson_scripts ADD COLUMN cefr_sub_level VARCHAR(10);

-- Add comment to clarify the column purpose
COMMENT ON COLUMN lesson_scripts.cefr_sub_level IS 'CEFR sub-level (e.g., A1.1, A2.3, B1.4) for the lesson subject';
