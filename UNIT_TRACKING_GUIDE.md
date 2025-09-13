# Unit Progress Tracking Implementation

## Overview
This creates a focused unit progress tracking system that works with your existing `user_activities` table.

## Database Setup

### 1. Run the Schema
Execute `unit_tracking_schema.sql` in your Supabase SQL editor:

```sql
-- This creates:
-- - unit_progress table (overall unit completion)
-- - lesson_progress table (individual lesson completion)
-- - Proper indexes, triggers, and RLS policies
-- - Initial data for Unit 1
```

## Integration Steps

### 1. Update Unit Screens to Record Progress

**In `UnitWordsScreen.tsx`:**
```typescript
import { UnitProgressService } from '../lib/unitProgressService';

// Add this when lesson is completed
const handleLessonComplete = async () => {
  if (user) {
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
  }
};
```

**In `UnitListenScreen.tsx`:**
```typescript
// Add this when lesson is completed
const handleLessonComplete = async () => {
  if (user) {
    await UnitProgressService.recordLessonCompletion(
      user.id,
      unitId,
      'listen',
      {
        score: score,
        maxScore: vocabulary.length * 10,
        accuracy: (score / (vocabulary.length * 10)) * 100,
        timeSpentSeconds: totalTimeSpent,
        exercisesCompleted: currentIndex + 1,
        totalExercises: vocabulary.length
      }
    );
  }
};
```

**In `UnitWriteScreen.tsx`:**
```typescript
// Add this when lesson is completed
const handleLessonComplete = async () => {
  if (user) {
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
  }
};
```

### 2. Update Dashboard to Show Real Progress

**In `DashboardContent.tsx`:**
```typescript
import { UnitProgressService } from '../lib/unitProgressService';

// Add state for unit progress
const [unitProgress, setUnitProgress] = useState<UnitProgressData[]>([]);

// Load unit progress
useEffect(() => {
  const loadUnitProgress = async () => {
    if (user) {
      try {
        const progress = await UnitProgressService.getAllUnitProgress(user.id);
        setUnitProgress(progress);
      } catch (error) {
        console.error('Error loading unit progress:', error);
      }
    }
  };
  loadUnitProgress();
}, [user]);

// Helper function to get progress percentage
const getUnitProgressPercentage = (unitId: number) => {
  const unit = unitProgress.find(u => u.unitId === unitId);
  return unit ? unit.progressPercentage : 0;
};

// Update the progress bar in the render:
<View style={[styles.unitProgressFill, { 
  width: `${getUnitProgressPercentage(unit.id)}%` 
}]} />
```

### 3. Initialize Progress for New Users

**In your onboarding flow (e.g., `ProfileSetupScreen.tsx`):**
```typescript
import { UnitProgressService } from '../lib/unitProgressService';

// After profile creation
const handleProfileComplete = async () => {
  // ... existing profile creation code ...
  
  // Initialize unit progress
  if (user) {
    await UnitProgressService.initializeUserProgress(user.id);
  }
  
  // ... rest of onboarding ...
};
```

## What This Gives You

### 1. Real Progress Tracking
- ✅ No more hardcoded 25% progress
- ✅ Accurate completion tracking
- ✅ Real progress percentages

### 2. Detailed Tracking
- ✅ Unit-level progress
- ✅ Lesson-level progress (Words, Listen, Write)
- ✅ Scores and accuracy tracking
- ✅ Time spent tracking

### 3. Easy Integration
- ✅ Works with existing `user_activities` table
- ✅ Simple service methods
- ✅ Minimal code changes required

## Testing

1. **Run the schema** in Supabase
2. **Complete a lesson** in Unit 1
3. **Check the dashboard** - progress should update from hardcoded to real
4. **Check the database** - should see records in `unit_progress` and `lesson_progress`

## Next Steps

1. Run `unit_tracking_schema.sql` in Supabase
2. Update Unit screens to call `recordLessonCompletion`
3. Update Dashboard to use `getAllUnitProgress`
4. Test with actual lesson completions

This focused approach gives you real unit progress tracking without overcomplicating the system!
