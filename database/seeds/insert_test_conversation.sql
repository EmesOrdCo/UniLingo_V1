-- Test script to insert a conversation script into the lesson_vocabulary table
-- This simulates what would happen during normal lesson creation

-- First, let's add the chat_content column if it doesn't exist
ALTER TABLE lesson_vocabulary ADD COLUMN IF NOT EXISTS chat_content TEXT;

-- Insert a test conversation script into an existing lesson vocabulary record
-- Replace 'YOUR_LESSON_ID' with an actual lesson_id from your database
-- Replace 'YOUR_VOCAB_ID' with an actual vocabulary item ID from that lesson

-- Option 1: Update an existing vocabulary item with conversation script
UPDATE lesson_vocabulary 
SET chat_content = '{"conversation":[{"speaker":"Person A","message":"Hey! I heard you''re studying computer science. What are you working on?"},{"speaker":"User","message":"Yes, I''m learning about algorithms and data structures. It''s really interesting!"},{"speaker":"Person A","message":"That''s great! Algorithms are the foundation of programming. Have you covered sorting algorithms yet?"},{"speaker":"User","message":"I''ve learned about quicksort and merge sort. The time complexity of quicksort is O(n log n) on average."},{"speaker":"Person A","message":"Excellent! And what about data structures? Arrays and linked lists are fundamental concepts."},{"speaker":"User","message":"I understand that arrays have constant time access, but linked lists require O(n) traversal time."},{"speaker":"Person A","message":"Perfect! You''re really getting the concepts. Have you worked with binary trees or hash tables?"},{"speaker":"User","message":"Binary trees are fascinating - I love how they enable efficient searching with O(log n) complexity."},{"speaker":"Person A","message":"That''s impressive understanding! These data structures and algorithms form the backbone of software engineering."},{"speaker":"User","message":"I''m excited to apply these concepts in my programming projects. Thanks for the great discussion!"}]}'
WHERE id = (
    SELECT id 
    FROM lesson_vocabulary 
    WHERE lesson_id IN (
        SELECT id 
        FROM esp_lessons 
        WHERE user_id = '8ce408c1-8ae5-4e91-96e6-8c1c8cccd7ef'  -- Your user ID
        LIMIT 1
    ) 
    LIMIT 1
);

-- Option 2: If you want to create a completely new test lesson with conversation
-- Uncomment the following if you want to create a test lesson from scratch:

/*
-- Create a test lesson
INSERT INTO esp_lessons (id, user_id, title, subject, source_pdf_name, native_language, created_at, updated_at)
VALUES (
    gen_random_uuid(),
    '8ce408c1-8ae5-4e91-96e6-8c1c8cccd7ef',  -- Your user ID
    'Test Computer Science Lesson',
    'Computer Science',
    'test-lesson.pdf',
    'English',
    NOW(),
    NOW()
);

-- Get the lesson ID (you'll need to replace this with the actual generated ID)
-- Then create vocabulary items
INSERT INTO lesson_vocabulary (id, lesson_id, keywords, definition, native_translation, example_sentence_target, example_sentence_native, chat_content, created_at)
VALUES 
(
    gen_random_uuid(),
    'LESSON_ID_HERE',  -- Replace with actual lesson ID from above
    'algorithm',
    'A step-by-step procedure for solving a problem',
    'algoritmo',
    'The sorting algorithm efficiently organizes the data.',
    'El algoritmo de ordenamiento organiza eficientemente los datos.',
    '{"conversation":[{"speaker":"Person A","message":"Hey! I heard you''re studying computer science. What are you working on?"},{"speaker":"User","message":"Yes, I''m learning about algorithms and data structures. It''s really interesting!"},{"speaker":"Person A","message":"That''s great! Algorithms are the foundation of programming. Have you covered sorting algorithms yet?"},{"speaker":"User","message":"I''ve learned about quicksort and merge sort. The time complexity of quicksort is O(n log n) on average."},{"speaker":"Person A","message":"Excellent! And what about data structures? Arrays and linked lists are fundamental concepts."},{"speaker":"User","message":"I understand that arrays have constant time access, but linked lists require O(n) traversal time."},{"speaker":"Person A","message":"Perfect! You''re really getting the concepts. Have you worked with binary trees or hash tables?"},{"speaker":"User","message":"Binary trees are fascinating - I love how they enable efficient searching with O(log n) complexity."},{"speaker":"Person A","message":"That''s impressive understanding! These data structures and algorithms form the backbone of software engineering."},{"speaker":"User","message":"I''m excited to apply these concepts in my programming projects. Thanks for the great discussion!"}]}',
    NOW()
),
(
    gen_random_uuid(),
    'LESSON_ID_HERE',  -- Replace with actual lesson ID from above
    'data structure',
    'A way of organizing and storing data in a computer',
    'estructura de datos',
    'Arrays and linked lists are common data structures.',
    'Los arrays y listas enlazadas son estructuras de datos comunes.',
    NULL,
    NOW()
),
(
    gen_random_uuid(),
    'LESSON_ID_HERE',  -- Replace with actual lesson ID from above
    'time complexity',
    'The computational complexity describing the time taken to execute an algorithm',
    'complejidad temporal',
    'The time complexity of this algorithm is O(n²).',
    'La complejidad temporal de este algoritmo es O(n²).',
    NULL,
    NOW()
);
*/

-- Check if the update worked
SELECT 
    lv.id,
    lv.keywords,
    lv.chat_content,
    l.title as lesson_title
FROM lesson_vocabulary lv
JOIN esp_lessons l ON lv.lesson_id = l.id
WHERE lv.chat_content IS NOT NULL
AND l.user_id = '8ce408c1-8ae5-4e91-96e6-8c1c8cccd7ef';  -- Your user ID
