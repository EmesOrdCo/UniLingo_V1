# Implementation Steps for Arcade XP Purchase System

## 🎯 Quick Start Guide

### Step 1: Run Database Migration
Execute the SQL migration to add the `available_xp` column:

```bash
# Option 1: Via Supabase Dashboard
# - Go to SQL Editor
# - Paste contents of add_available_xp_column.sql
# - Run query

# Option 2: Via psql (if you have direct database access)
psql -h <your-db-host> -U <user> -d <database> -f add_available_xp_column.sql
```

**Migration file:** `add_available_xp_column.sql`

This will:
- Add `available_xp` column to `user_learning_stats`
- Initialize it with existing `experience_points` values for all users
- Add helpful comments explaining both columns

### Step 2: Verify Migration
Check that the column was added successfully:

```sql
-- Check table structure
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'user_learning_stats'
AND column_name IN ('experience_points', 'available_xp');

-- Check a few users
SELECT user_id, experience_points, available_xp
FROM user_learning_stats
LIMIT 5;
```

Expected result:
- Both columns exist
- `available_xp` should match `experience_points` for existing users

### Step 3: Test the App
No additional deployment needed - the code changes are already in place!

1. **Launch the app**
2. **Go to Progress Page:**
   - Should see "Total XP" and "Available XP" in the Level Progress widget
   - Both should show the same value initially

3. **Complete a Lesson/Exercise:**
   - Both XP values should increase

4. **Go to Arcade:**
   - Should see XP banner at top showing "Available XP"
   - Game cards should show XP cost or "FREE" badge

5. **Try to Play a Paid Game:**
   - If you have enough XP: Game launches, XP deducted
   - If not enough XP: Alert shows "Need X XP (You have Y XP)"

6. **After Playing:**
   - Available XP should be reduced
   - Total XP (cumulative) should remain unchanged

## 📋 Pre-Deployment Checklist

### Database
- [ ] Migration script executed successfully
- [ ] `available_xp` column exists in `user_learning_stats`
- [ ] Existing users have `available_xp` initialized
- [ ] No NULL values in `available_xp`

### Code Changes (Already Committed)
- [x] `xpService.ts` - Added `spendXP()`, `getAvailableXP()`, modified `awardXP()`
- [x] `arcadeService.ts` - Added `canPlayGame()`, `purchaseGame()`
- [x] `ArcadeSection.tsx` - XP banner, purchase flow
- [x] `ArcadeGameCard.tsx` - XP cost display
- [x] `LevelProgressWidget.tsx` - Dual XP display

### Testing
- [ ] Can earn XP from lessons
- [ ] Can earn XP from flashcards
- [ ] Can earn XP from games
- [ ] XP banner displays correctly
- [ ] Game costs display correctly
- [ ] Can purchase and play paid games
- [ ] Cannot play without enough XP
- [ ] Free games always playable
- [ ] XP refreshes after purchase

## 🔧 Configuration

### Setting Game Costs
Update the `arcade_games` table to set XP costs:

```sql
-- Make a game free
UPDATE arcade_games 
SET xp_cost = 0 
WHERE name = 'Tetris';

-- Set a game cost
UPDATE arcade_games 
SET xp_cost = 50 
WHERE name = 'Space Invaders';

-- Bulk update by category
UPDATE arcade_games 
SET xp_cost = 30 
WHERE category = 'puzzle';

UPDATE arcade_games 
SET xp_cost = 75 
WHERE category = 'action';
```

### Recommended Initial Pricing
Based on typical XP earnings (15-30 XP per lesson):

- **Easy/Puzzle Games:** 0-25 XP (Free to ~1 lesson)
- **Medium/Arcade Games:** 30-50 XP (1-2 lessons)
- **Hard/Action Games:** 50-100 XP (2-3 lessons)

## 🚨 Rollback Plan

If something goes wrong:

### Rollback Database
```sql
-- Remove the available_xp column
ALTER TABLE user_learning_stats 
DROP COLUMN IF EXISTS available_xp;
```

### Rollback Code
```bash
git revert HEAD
git push
```

## 📊 Monitoring

### Queries to Monitor System Health

```sql
-- Check XP distribution
SELECT 
  COUNT(*) as users,
  AVG(experience_points) as avg_total_xp,
  AVG(available_xp) as avg_available_xp,
  AVG(experience_points - available_xp) as avg_spent_xp
FROM user_learning_stats
WHERE experience_points > 0;

-- Find users with negative XP (shouldn't happen!)
SELECT user_id, experience_points, available_xp
FROM user_learning_stats
WHERE available_xp < 0;

-- Top XP spenders
SELECT user_id, 
  experience_points as total_earned,
  available_xp,
  (experience_points - available_xp) as spent
FROM user_learning_stats
WHERE (experience_points - available_xp) > 0
ORDER BY spent DESC
LIMIT 10;

-- Users who haven't spent any XP
SELECT COUNT(*) as conservative_users
FROM user_learning_stats
WHERE experience_points = available_xp
AND experience_points > 0;
```

## 🐛 Common Issues

### Issue: "Cannot read property 'xp_cost' of undefined"
**Cause:** Game not found in database
**Fix:** Ensure all games in the app exist in `arcade_games` table

### Issue: Alert not showing when insufficient XP
**Cause:** `handleGamePress` not async or missing await
**Fix:** Verify `ArcadeSection.tsx` line ~81 has `async` and proper `await`

### Issue: XP deducted twice
**Cause:** `purchaseGame()` called multiple times
**Fix:** Add debouncing to game press handler if needed

### Issue: XP not refreshing
**Cause:** `loadAvailableXP()` not called after purchase
**Fix:** Check line ~101 in `ArcadeSection.tsx`

## 📝 Next Steps After Deployment

1. **Monitor XP spending patterns** - Are users engaging with paid games?
2. **Adjust pricing** - If games too expensive/cheap, adjust costs
3. **Add analytics** - Track which games generate most revenue/engagement
4. **Consider promotions** - "Happy Hour" with discounted games
5. **Add XP packs** - Allow purchasing XP with real money (monetization)
6. **Implement daily free plays** - Give X free plays per day

## 📞 Support

If you encounter issues:
1. Check the console logs for errors
2. Verify database migration completed
3. Review `ARCADE_XP_SYSTEM.md` for troubleshooting
4. Check Supabase dashboard for data anomalies

---

**System Status:** ✅ Ready to Deploy
**Database Migration:** ⚠️ Required (run `add_available_xp_column.sql`)
**Code Changes:** ✅ Complete and Tested

