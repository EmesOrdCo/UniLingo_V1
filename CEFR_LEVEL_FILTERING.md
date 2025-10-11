# CEFR Level Filtering Implementation

## Overview
Added CEFR (Common European Framework of Reference for Languages) level filtering to the subject selection system. Users can now filter subjects by language proficiency levels (A1, A2, B1, B2, C1, C2).

## What Changed

### 1. SubjectDataService (`src/lib/subjectDataService.ts`)
- Updated `getSubjectsWithMetadata()` to fetch and include CEFR levels from both `subject_words` and `lesson_scripts` tables
- CEFR levels from `lesson_scripts` take priority over `subject_words`
- Added CEFR level to the debug logging

### 2. SubjectBoxes Component (`src/components/SubjectBoxes.tsx`)
- Added dropdown selector for CEFR levels (All, A1, A2, B1, B2, C1, C2)
- Implemented filtering logic:
  - "All" shows top subjects by word count (limited by `maxSubjects` prop)
  - Specific levels (A1, A2, etc.) show ALL subjects at that level (no limit)
- Added CEFR badge display on each subject card
- Updated UI to show dropdown in header alongside title
- Added empty state messages for when no subjects match the selected level

## Features

### Dropdown Selector
- Located in the header next to "Available Subjects"
- Shows current selection (e.g., "All", "A1", "B2")
- Tap to expand and select different levels
- Visual feedback with checkmark for selected level

### Subject Display
- Each subject shows its CEFR level as a small badge next to the name
- Badge color: Indigo (#6366f1)
- Only displayed if CEFR level is available in database

### Filtering Behavior
- **All Levels**: Shows top 6 subjects by word count (default)
- **Specific Level**: Shows ALL subjects at that level, sorted by word count
- Subjects without CEFR levels are only shown in "All Levels" view

## Database Requirements

### Required Columns
1. `subject_words.cefr_level` (TEXT) - CEFR level for vocabulary
2. `lesson_scripts.cefr_level` (TEXT) - CEFR level for lesson scripts

### Valid CEFR Values
- A1 (Beginner)
- A2 (Elementary)
- B1 (Intermediate)
- B2 (Upper Intermediate)
- C1 (Advanced)
- C2 (Proficiency)

## Usage

### In Code
```typescript
import SubjectBoxes from './components/SubjectBoxes';

// Default usage - shows top 6 subjects with level filtering
<SubjectBoxes 
  onSubjectSelect={(subject) => console.log(subject)}
/>

// Custom max subjects (only applies to "All" filter)
<SubjectBoxes 
  maxSubjects={10}
  onSubjectSelect={(subject) => console.log(subject)}
/>
```

### For Users
1. Open the app and navigate to the subjects section
2. Click the dropdown button in the header (shows "All" by default)
3. Select a CEFR level (A1, A2, B1, B2, C1, C2) or "All Levels"
4. Subject list updates to show only subjects at that level
5. Each subject card displays its CEFR level badge

## Console Logs

The implementation includes helpful debug logs:
```
🔍 Fetching subjects with metadata...
✅ Found 431 subjects with metadata
🔍 Top 5 subjects by word count: [...]
🔍 Showing all subjects (top 6)
🔍 Filtered to 15 subjects at A1 level
```

## Next Steps

### Recommended Enhancements
1. Add counts to dropdown items (e.g., "Level A1 (15)")
2. Add color coding for difficulty levels
3. Persist selected level in user preferences
4. Add search functionality within selected level
5. Show progress indicators per level

### Data Population
To populate CEFR levels, run:
```sql
-- Update subject_words with CEFR levels
UPDATE subject_words 
SET cefr_level = 'A1' 
WHERE subject IN ('Basic Greetings', 'Numbers', 'Colors');

-- Update lesson_scripts with CEFR levels
UPDATE lesson_scripts 
SET cefr_level = 'B1' 
WHERE subject_name IN ('Business English', 'Travel Phrases');
```

## Testing

1. ✅ Dropdown displays all CEFR levels
2. ✅ "All" shows top subjects by word count
3. ✅ Level selection filters correctly
4. ✅ CEFR badges display on subject cards
5. ✅ Empty state shows when no subjects match level
6. ✅ Data loads from database with CEFR info
7. ✅ Fallback subjects work if database unavailable

## Files Modified
- `src/lib/subjectDataService.ts` - Added CEFR level fetching
- `src/components/SubjectBoxes.tsx` - Added dropdown UI and filtering logic

## Files Created
- `CEFR_LEVEL_FILTERING.md` - This documentation


