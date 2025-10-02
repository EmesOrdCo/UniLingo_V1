# Conversation Lesson Feature

## Overview
The Conversation Lesson feature allows users to practice their uploaded personal lessons through interactive 2-way conversations. This feature generates natural conversation scripts based on the lesson vocabulary and presents them in a chat-like interface.

## Features
- **AI-Generated Conversations**: Uses OpenAI to create natural 2-way conversations incorporating lesson vocabulary
- **Chat Interface**: Presents conversations in a familiar messaging app style
- **Progressive Navigation**: Users can step through conversations with a "Next" button
- **XP Integration**: Awards XP and tracks progress like other lesson types
- **Multiple Lesson Types**: Integrates with existing lesson flow (Flashcards, Speak, Conversation)

## Implementation Details

### Database Changes
- Added `chat_content` TEXT column to `lesson_vocabulary` table
- Stores JSON conversation script in the first vocabulary item of each lesson

### AI Service Updates
- New `generateConversationScript()` method in `backend/aiService.js`
- Generates ~45-second conversations using lesson vocabulary
- Ensures 70%+ of key vocabulary terms are included
- Creates natural, casual but respectful dialogue

### New Components
- `ConversationLessonScreen.tsx`: Main conversation interface
- Chat bubble UI with alternating Person A and User messages
- Progress tracking and completion handling

### Integration Points
- Added to `YourLessonsScreen.tsx` with lesson type selection
- Integrated into navigation stack in `App.tsx`
- XP tracking via `XPService.awardXP()`

## Usage Flow
1. User uploads notes and creates a personal lesson
2. AI generates vocabulary and conversation script during lesson creation
3. User selects "Conversation" from lesson type options
4. Conversation displays in chat interface
5. User navigates through conversation with "Next" button
6. Lesson completion awards XP and tracks progress

## Conversation Generation Requirements
- Casual but respectful tone
- 45 seconds estimated reading time
- Alternating Person A and User responses
- Natural vocabulary integration
- Subject-matter relevance
- Logical conversation flow

## Technical Notes
- Conversation scripts are generated once during lesson creation
- Stored as JSON in `chat_content` column
- Fallback handling if conversation generation fails
- Compatible with existing lesson progress tracking

## Database Setup
Run the SQL script `add_chat_content_column.sql` to add the required database column:
```sql
ALTER TABLE lesson_vocabulary 
ADD COLUMN IF NOT EXISTS chat_content TEXT;
```

## Future Enhancements
- User response challenges and tasks
- Multiple conversation variations
- Conversation difficulty levels
- Voice integration for pronunciation practice
