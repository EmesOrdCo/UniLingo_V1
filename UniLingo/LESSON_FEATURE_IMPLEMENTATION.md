# Lesson Feature Implementation

This document outlines the implementation of the AI-powered lesson generation feature in UniLingo.

## Overview

The lesson feature allows users to upload PDF documents and automatically generate interactive English language lessons based on the content. The system uses AI to extract keywords, create vocabulary, and generate various types of exercises.

## Architecture

### Frontend Components

1. **CreateLessonScreen** - PDF upload interface
2. **NewLessonViewerScreen** - Interactive lesson viewer
3. **LessonsScreen** - Lesson management and listing

### Backend Services

1. **UploadService** - PDF file handling and text extraction
2. **LessonService** - AI lesson generation and database operations
3. **Backend Server** - PDF text extraction via Cloudmersive API

## Database Schema

### Tables

- `esp_lessons` - Main lesson records
- `lesson_vocabulary` - Vocabulary items for each lesson
- `lesson_exercises` - Exercise content and metadata
- `lesson_progress` - User progress tracking

### Key Fields

```sql
esp_lessons:
- id, user_id, title, subject, description
- estimated_duration, difficulty_level
- created_at, updated_at

lesson_vocabulary:
- id, lesson_id, term, definition, translation
- example_sentence, difficulty_level

lesson_exercises:
- id, lesson_id, exercise_type, content
- correct_answer, options, instructions

lesson_progress:
- id, user_id, lesson_id, current_exercise_index
- completed_exercises, total_exercises, is_completed
```

## AI Generation Process

### Progressive Generation

The system uses a 5-stage progressive generation process to prevent API timeouts:

1. **Keyword Extraction** (1 min timeout)
   - Extract relevant keywords from PDF text
   - Clean and validate keywords

2. **Lesson Metadata** (30 sec timeout)
   - Generate title, description, duration
   - Calculate difficulty level

3. **Lesson Creation** (Database save)
   - Save initial lesson record
   - Return lesson ID for subsequent operations

4. **Vocabulary Generation** (1 min timeout per batch)
   - Process keywords in batches of 10
   - Generate definitions, translations, examples
   - Save each batch immediately

5. **Exercise Generation** (1 min timeout per exercise)
   - Generate 8-12 exercises total
   - Use multiple terms per exercise
   - Save each exercise immediately

### Exercise Types

1. **Flashcard Matching** - Match terms with definitions
2. **Multiple Choice** - Choose correct definition/translation
3. **Fill in the Blank** - Complete sentences with vocabulary
4. **Typing Challenge** - Type correct translations
5. **Sentence Ordering** - Arrange words in correct order
6. **Memory Game** - Match pairs of related terms
7. **Word Scramble** - Unscramble vocabulary terms
8. **Speed Challenge** - Quick recognition exercises

## API Integration

### OpenAI GPT-4o-mini

- Model: `gpt-4o-mini`
- Max tokens: 6000 (main generation), 2000 (individual exercises)
- Timeout: 120 seconds (main), 60 seconds (individual)
- Rate limiting: Implemented via `OpenAIWithRateLimit`

### Cloudmersive PDF API

- Endpoint: `/convert/pdf/to/text`
- File size limit: 10MB
- Automatic cleanup after processing

## Error Handling

### JSON Parsing

- Robust cleaning of AI responses
- Multiple fallback extraction methods
- Markdown code block removal
- Trailing comma handling

### Timeout Management

- Progressive generation prevents long waits
- Individual exercise timeouts
- Graceful degradation on failures

### Database Operations

- Transaction safety for multi-step operations
- Rollback on failures
- Progress tracking for partial completions

## User Experience

### Upload Flow

1. User selects PDF file
2. Progress modal shows extraction status
3. AI generation with progress updates
4. Automatic navigation to lesson viewer

### Lesson Interaction

1. Exercise-by-exercise progression
2. Immediate feedback on answers
3. Progress tracking and persistence
4. Resume capability from last position

### Performance

- Estimated duration: 10 minutes per 25 terms
- All extracted keywords used (no artificial limits)
- Batch processing for large documents
- Immediate database saves prevent data loss

## Security

- File type validation (PDF only)
- File size limits (10MB)
- Automatic file cleanup
- User-specific data isolation
- API key protection

## Future Enhancements

- Offline lesson support
- Custom exercise templates
- Lesson sharing between users
- Advanced progress analytics
- Multi-language support
