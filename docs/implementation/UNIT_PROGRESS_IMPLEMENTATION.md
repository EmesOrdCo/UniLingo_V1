# Unit Progress Tracking Implementation Guide

## Overview
This guide explains how to implement comprehensive unit progress tracking for UniLingo. The system tracks progress at three levels:
1. **Unit Level** - Overall unit completion
2. **Lesson Level** - Individual lesson completion (Words, Listen, Write, etc.)
3. **Exercise Level** - Individual exercise completion within lessons

## Database Setup

### 1. Run the Schema
Execute the `unit_progress_schema.sql` file in your Supabase database:

```sql
-- Run this in your Supabase SQL editor
\i unit_progress_schema.sql
```

This creates:
- `user_activities` table (was missing from original schema)
- `unit_progress` table
- `lesson_progress` table  
- `exercise_progress` table
- Proper indexes, triggers, and RLS policies

### 2. Verify Tables Created
Check that all tables exist:
```sql
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('user_activities', 'unit_progress', 'lesson_progress', 'exercise_progress');
```

## Integration Steps

### 1. Update Unit Screens
Modify the Unit screens to record progress when completed:

**In `UnitWordsScreen.tsx`:**
```typescript
import { UnitProgressService } from '../lib/unitProgressService';

// After lesson completion
const handleLessonComplete = async () => {
  await UnitProgressService.recordLessonCompletion(
    user.id,
    unitId,
    'words',
    {
      score: totalScore,
      maxScore: maxPossibleScore,
      accuracy: averageAccuracy,
      timeSpentSeconds: totalTimeSpent,
      exercisesCompleted: completedExercises,
      totalExercises: totalExercises
    }
  );
};
```

**In `UnitListenScreen.tsx`:**
```typescript
// After lesson completion
await UnitProgressService.recordLessonCompletion(
  user.id,
  unitId,
  'listen',
  {
    score: score,
    maxScore: vocabulary.length * 10, // Example scoring
    accuracy: (score / (vocabulary.length * 10)) * 100,
    timeSpentSeconds: totalTimeSpent,
    exercisesCompleted: currentIndex + 1,
    totalExercises: vocabulary.length
  }
);
```

**In `UnitWriteScreen.tsx`:**
```typescript
// After lesson completion
await UnitProgressService.recordLessonCompletion(
  user.id,
  unitId,
  'write',
  {
    score: score,
    maxScore: totalQuestions * 10,
    accuracy: (score / (totalQuestions * 10)) * 100,
    timeSpentSeconds: totalTimeSpent,
    exercisesCompleted: completedExercises,
    totalExercises: totalQuestions
  }
);
```

### 2. Update Dashboard Progress Display
Replace hardcoded progress with real data:

**In `DashboardContent.tsx`:**
```typescript
import { UnitProgressService } from '../lib/unitProgressService';

// Add state for unit progress
const [unitProgress, setUnitProgress] = useState<UnitProgressData[]>([]);

// Load unit progress
useEffect(() => {
  const loadUnitProgress = async () => {
    if (user) {
      const progress = await UnitProgressService.getAllUnitProgress(user.id);
      setUnitProgress(progress);
    }
  };
  loadUnitProgress();
}, [user]);

// Update progress bar calculation
const getUnitProgressPercentage = (unitId: number) => {
  const unit = unitProgress.find(u => u.unitId === unitId);
  return unit ? unit.progressPercentage : 0;
};

// In the render:
<View style={[styles.unitProgressFill, { 
  width: `${getUnitProgressPercentage(unit.id)}%` 
}]} />
```

### 3. Initialize Progress for New Users
Add progress initialization to the onboarding flow:

**In `ProfileSetupScreen.tsx` or similar:**
```typescript
import { UnitProgressService } from '../lib/unitProgressService';

// After profile creation
const handleProfileComplete = async () => {
  // ... existing profile creation code ...
  
  // Initialize unit progress
  await UnitProgressService.initializeUserProgress(user.id);
  
  // ... rest of onboarding ...
};
```

### 4. Update Progress Page
Show real unit progress on the progress page:

**In `ProgressPageScreen.tsx`:**
```typescript
import { UnitProgressService } from '../lib/unitProgressService';

// Add unit progress to the progress data
const [unitProgress, setUnitProgress] = useState<UnitProgressData[]>([]);

useEffect(() => {
  const loadProgress = async () => {
    if (user) {
      const progress = await UnitProgressService.getAllUnitProgress(user.id);
      setUnitProgress(progress);
    }
  };
  loadProgress();
}, [user]);

// Display unit progress in the UI
{unitProgress.map(unit => (
  <View key={unit.unitId} style={styles.unitProgressItem}>
    <Text>{unit.unitTitle}</Text>
    <View style={styles.progressBar}>
      <View style={[styles.progressFill, { 
        width: `${unit.progressPercentage}%` 
      }]} />
    </View>
    <Text>{unit.completedLessons}/{unit.totalLessons} lessons</Text>
  </View>
))}
```

## Progress Tracking Flow

### 1. User Completes Exercise
```
User completes exercise → Record in exercise_progress → Update lesson_progress → Update unit_progress
```

### 2. Progress Calculation
- **Exercise Level**: Individual exercise completion
- **Lesson Level**: Aggregated from exercises within lesson
- **Unit Level**: Aggregated from lessons within unit

### 3. Status Progression
- `not_started` → `in_progress` → `completed`
- Lessons unlock based on previous lesson completion
- Units unlock based on previous unit completion

## Benefits

### 1. Real Progress Tracking
- No more hardcoded progress percentages
- Accurate completion tracking
- Detailed performance metrics

### 2. User Experience
- Clear progress indicators
- Unlock system based on completion
- Achievement tracking

### 3. Analytics
- Detailed user behavior data
- Performance metrics
- Learning path optimization

### 4. Gamification
- Progress bars that actually work
- Achievement unlocks
- Streak tracking

## Testing

### 1. Test Progress Recording
1. Complete a lesson in Unit 1
2. Check `lesson_progress` table for new record
3. Check `unit_progress` table for updated percentages
4. Verify dashboard shows correct progress

### 2. Test Progress Display
1. Check dashboard progress bars
2. Verify progress page shows unit completion
3. Test unlock system works correctly

### 3. Test Data Integrity
1. Verify RLS policies work
2. Check triggers update timestamps
3. Test unique constraints prevent duplicates

## Next Steps

1. **Run the schema** in Supabase
2. **Update Unit screens** to record progress
3. **Update Dashboard** to show real progress
4. **Test the implementation**
5. **Add more units** as needed

This system provides a solid foundation for comprehensive progress tracking that will scale as you add more units and lessons.
