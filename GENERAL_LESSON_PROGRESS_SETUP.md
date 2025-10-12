# General Lesson Progress Tracking Setup

## Overview
This document outlines the implementation of progress tracking for general subject lessons (accessible via the Dashboard page).

## SQL Migration Required

**Run this SQL in your Supabase SQL Editor:**

Location: `add_general_lesson_progress.sql`

This migration:
1. ✅ Adds `lesson_type` column ('cefr' or 'general')
2. ✅ Adds `subject_name` column for general lessons
3. ✅ Adds `exercises_completed` and `total_exercises` columns
4. ✅ Creates indexes for fast queries
5. ✅ Updates unique constraints to handle both lesson types
6. ✅ Maintains backward compatibility with existing CEFR progress

## Features Implemented

### 1. **Progress Tracking**
- ✅ Tracks each exercise completion (7 exercises total)
- ✅ Records scores, accuracy, and time spent
- ✅ Calculates overall lesson completion status
- ✅ Stores in `unit_progress` table with `lesson_type = 'general'`

### 2. **Streak System Integration**
- ✅ Records activity in `user_activities` table
- ✅ Each exercise completion counts toward daily streak
- ✅ Activity type: `'general_lesson'`
- ✅ Includes score, accuracy, and duration

### 3. **Visual Indicators**
- ✅ Completion badge (green checkmark) on completed subjects
- ✅ Progress bar showing X/7 exercises completed
- ✅ Status indicator (hourglass for in-progress, checkmark for completed)
- ✅ Exercise count displayed on subject cards

### 4. **Database Structure**

#### General Lesson Progress Record:
```typescript
{
  user_id: string,
  lesson_type: 'general',
  subject_name: 'After the Accident',
  cefr_level: 'A1',
  exercises_completed: 5,
  total_exercises: 7,
  completed_lessons: ['flashcards', 'flashcard-quiz', 'word-scramble', 'sentence-scramble', 'fill-in-blank'],
  status: 'in_progress',
  total_score: 425,
  max_possible_score: 500,
  average_accuracy: 85.0,
  total_time_spent_seconds: 1200,
  ...
}
```

#### User Activity Record:
```typescript
{
  user_id: string,
  activity_type: 'general_lesson',
  activity_name: 'After the Accident - flashcards',
  duration_seconds: 180,
  score: 85,
  max_score: 100,
  accuracy_percentage: 85.0,
  completed_at: '2025-10-12T...'
}
```

## Services Created

### `GeneralLessonProgressService`

**Methods:**
- `getSubjectProgress(userId, subjectName, cefrLevel)` - Get progress for one subject
- `getAllSubjectProgress(userId)` - Get all general lesson progress
- `getSubjectProgressByCefrLevel(userId, cefrLevel)` - Get progress for CEFR level
- `recordExerciseCompletion(userId, subjectName, cefrLevel, exerciseData)` - Record completion
- `getCompletionStats(userId)` - Get aggregate statistics
- `isSubjectCompleted(userId, subjectName, cefrLevel)` - Check if completed
- `getSubjectCompletionPercentage(userId, subjectName, cefrLevel)` - Get % complete

## How It Works

### Exercise Flow:
1. **User selects subject** from dashboard (e.g., "After the Accident")
2. **Completes exercise** (e.g., Flashcards)
3. **Progress is recorded:**
   - ✅ Updates `unit_progress` table (exercise count, scores, time)
   - ✅ Adds record to `user_activities` table (for streaks)
   - ✅ Awards XP (existing functionality)
4. **UI updates:**
   - ✅ Shows progress bar on subject card
   - ✅ Updates exercise count (e.g., "3/7 exercises")
   - ✅ Shows completion badge when all 7 done
5. **Contributes to streak:**
   - ✅ Activity recorded with timestamp
   - ✅ Counts toward daily activity goal
   - ✅ Maintains streak continuity

### 7 Exercises Per Subject:
1. Flashcards
2. Flashcard Quiz
3. Word Scramble
4. Sentence Scramble
5. Fill in the Blank
6. Listen
7. Speak

## Integration Points

### 1. **SubjectLessonScreen.tsx**
- Calls `GeneralLessonProgressService.recordExerciseCompletion()` after each exercise
- Passes: subject name, CEFR level, scores, time

### 2. **SubjectBoxes.tsx**
- Fetches progress data when component mounts/focuses
- Displays completion indicators on subject cards
- Shows progress bars for in-progress subjects
- Refreshes on navigation back

### 3. **Streak System**
- Uses existing `user_activities` table
- Activity type: `'general_lesson'`
- Works with current streak calculation logic

## Query Examples

### Get all completed general lessons:
```sql
SELECT * FROM unit_progress 
WHERE user_id = 'xxx' 
  AND lesson_type = 'general' 
  AND status = 'completed';
```

### Get progress for specific subject:
```sql
SELECT * FROM unit_progress 
WHERE user_id = 'xxx' 
  AND lesson_type = 'general' 
  AND subject_name = 'After the Accident'
  AND cefr_level = 'A1';
```

### Get all activities for streaks:
```sql
SELECT * FROM user_activities 
WHERE user_id = 'xxx'
  AND activity_type IN ('general_lesson', 'unit_exercise')
ORDER BY completed_at DESC;
```

## Benefits

1. ✅ **Unified Progress System** - Both CEFR and general lessons tracked in same table
2. ✅ **Streak Integration** - All lessons contribute to streaks
3. ✅ **Visual Feedback** - Users see completion status
4. ✅ **Motivation** - Clear progress indicators encourage completion
5. ✅ **Analytics Ready** - Rich data for insights and reports
6. ✅ **Backward Compatible** - Existing CEFR progress unaffected

## Testing Checklist

- [ ] Run SQL migration in Supabase
- [ ] Complete a general lesson exercise
- [ ] Check `unit_progress` table has new record with `lesson_type = 'general'`
- [ ] Check `user_activities` table has activity record
- [ ] Verify completion badge appears on dashboard
- [ ] Verify progress bar shows correct percentage
- [ ] Complete all 7 exercises and verify "completed" status
- [ ] Check streak updates in progress page
- [ ] Test multiple subjects in same CEFR level
- [ ] Test subjects across different CEFR levels

## Next Steps (Optional Enhancements)

1. **Progress Page Integration**
   - Add "General Lessons" section to progress page
   - Show completed subjects count
   - Display stats (total score, average accuracy, time spent)

2. **Dashboard Filtering**
   - Filter subjects by: All, In Progress, Completed, Not Started
   - Sort by: Progress, Alphabetical, Word Count

3. **Badges & Achievements**
   - "Subject Master" - Complete all subjects in a CEFR level
   - "Quick Learner" - Complete subject in under X minutes
   - "Perfect Score" - Get 100% on all exercises

4. **Recommendations**
   - Suggest next subject based on progress
   - Recommend review for partially completed subjects

## Files Modified

1. `src/lib/generalLessonProgressService.ts` - NEW service
2. `src/screens/SubjectLessonScreen.tsx` - Added progress recording
3. `src/components/SubjectBoxes.tsx` - Added progress display
4. `src/lib/subjectDataService.ts` - Added orderIndex support
5. `add_general_lesson_progress.sql` - Database migration

## Support

All progress data is automatically synced and available for:
- Progress Page displays
- Streak calculations
- XP awards
- Analytics and insights

