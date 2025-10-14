# Arcade XP Purchase System

## Overview
The arcade now features a dual XP system:
1. **Cumulative XP** (`experience_points`) - Never decreases, used for level progression and display
2. **Available XP** (`available_xp`) - Spendable reserve that can be used to purchase arcade games

## Database Changes

### Migration File
Run `add_available_xp_column.sql` to add the new column to the `user_learning_stats` table:

```sql
-- Add available_xp column to user_learning_stats table
ALTER TABLE user_learning_stats 
ADD COLUMN IF NOT EXISTS available_xp INTEGER DEFAULT 0;

-- Initialize available_xp to match current experience_points for existing users
UPDATE user_learning_stats 
SET available_xp = experience_points 
WHERE available_xp IS NULL OR available_xp = 0;
```

## How It Works

### 1. Earning XP
When users complete activities (lessons, flashcards, games, exercises), they earn XP which is added to BOTH:
- `experience_points` (cumulative, for level tracking)
- `available_xp` (spendable, for arcade games)

**Modified in:** `src/lib/xpService.ts` - `awardXP()` method

```typescript
const newExperiencePoints = (currentStats?.experience_points || 0) + xpCalculation.totalXP;
const newAvailableXP = (currentStats?.available_xp || 0) + xpCalculation.totalXP;
```

### 2. Spending XP on Games
When users want to play a paid arcade game:
1. Check if user has enough `available_xp`
2. Deduct the game cost from `available_xp` ONLY
3. `experience_points` remains unchanged

**New Methods in `XPService`:**
- `spendXP(userId, amount, reason)` - Deducts XP from available_xp
- `getAvailableXP(userId)` - Fetches user's spendable XP

### 3. Game Purchase Flow
**Modified in:** `src/lib/arcadeService.ts`

**New Methods:**
- `canPlayGame(userId, gameId)` - Checks if user can afford the game
- `purchaseGame(userId, gameId)` - Handles XP deduction and validates purchase

**Flow:**
```typescript
// 1. User taps game card
handleGamePress(game)

// 2. Check if paid game
if (game.xp_cost > 0) {
  // 3. Verify user has enough XP
  const playCheck = await ArcadeService.canPlayGame(userId, gameId);
  
  if (!playCheck.canPlay) {
    alert(playCheck.message); // "Need 50 XP (You have 30 XP)"
    return;
  }

  // 4. Purchase (spend XP)
  const purchase = await ArcadeService.purchaseGame(userId, gameId);
  
  // 5. Reload available XP display
  await loadAvailableXP();
}

// 6. Launch game
setShowGameModal(true);
```

## UI Components

### 1. Arcade Screen XP Banner
**File:** `src/components/arcade/ArcadeSection.tsx`

Displays user's available XP at the top of the arcade:
```
┌─────────────────────────────────┐
│ ⭐ Available XP                 │
│    1,250                        │
│    Spend XP to unlock games     │
└─────────────────────────────────┘
```

### 2. Game Card Cost Display
**File:** `src/components/arcade/ArcadeGameCard.tsx`

Each game card shows either:
- **FREE** badge (green) for free games
- **⭐ 50** badge (gold on dark) for paid games

### 3. Level Progress Widget
**File:** `src/components/LevelProgressWidget.tsx`

Shows both XP values:
```
Total XP:    1,250
Available:   ⭐ 950
```

## Game Configuration

Games in the `arcade_games` table have an `xp_cost` field:
- `xp_cost: 0` = Free game (no XP required)
- `xp_cost: 50` = Costs 50 XP to play
- etc.

## Testing

### Test the XP System
1. **Check Initial State:**
   ```sql
   SELECT user_id, experience_points, available_xp 
   FROM user_learning_stats 
   WHERE user_id = 'your-user-id';
   ```

2. **Complete a Lesson/Exercise:**
   - Verify both `experience_points` and `available_xp` increase equally

3. **Purchase a Game:**
   - Before: `available_xp = 100`
   - Purchase game costing 50 XP
   - After: `available_xp = 50`, `experience_points` unchanged

4. **Try to Play Without Enough XP:**
   - Set `available_xp < game.xp_cost`
   - Attempt to play game
   - Should see alert: "Need X XP (You have Y XP)"

### Manual Testing Checklist
- [ ] XP earned from lessons adds to both cumulative and available
- [ ] XP earned from flashcards adds to both cumulative and available
- [ ] XP earned from games adds to both cumulative and available
- [ ] Arcade screen displays correct available XP
- [ ] Game cards show correct XP cost or FREE badge
- [ ] Purchasing a game deducts only from available_xp
- [ ] Can't play game without enough available XP
- [ ] Free games can always be played
- [ ] Level progress widget shows both XP values correctly
- [ ] XP refreshes after purchase

## Files Modified

### Core Logic
- ✅ `src/lib/xpService.ts` - Added `spendXP()`, `getAvailableXP()`, modified `awardXP()`
- ✅ `src/lib/arcadeService.ts` - Added `canPlayGame()`, `purchaseGame()`

### UI Components
- ✅ `src/components/arcade/ArcadeSection.tsx` - XP banner, purchase flow in `handleGamePress()`
- ✅ `src/components/arcade/ArcadeGameCard.tsx` - XP cost badge display
- ✅ `src/components/LevelProgressWidget.tsx` - Dual XP display

### Database
- ✅ `add_available_xp_column.sql` - Migration script

## Future Enhancements

### Potential Features
1. **XP Bundles** - Allow users to "purchase" XP with real money
2. **Daily Free Plays** - Give X free plays per day without XP cost
3. **XP Rewards** - Reward XP for high scores or achievements
4. **Discounts** - Reduce XP cost based on level or achievements
5. **Subscription** - Premium users get all games free
6. **Refund System** - Refund XP if game crashes or user quits early
7. **XP History** - Show transaction log of earned/spent XP

### Analytics to Track
- Average XP earned per day
- Most popular paid games
- XP spending patterns
- Conversion rate (users who spend XP vs those who don't)
- Games that generate most XP (through completion rewards)

## Troubleshooting

### Issue: available_xp is NULL
**Solution:** Run the migration script or manually update:
```sql
UPDATE user_learning_stats 
SET available_xp = COALESCE(available_xp, experience_points);
```

### Issue: XP not updating after purchase
**Solution:** Check that `loadAvailableXP()` is called after purchase in `ArcadeSection.tsx`

### Issue: Users can play without XP
**Solution:** Verify `handleGamePress()` checks `game.xp_cost > 0` before calling `purchaseGame()`

### Issue: Negative XP
**Solution:** Check that `canPlayGame()` is called BEFORE `purchaseGame()` to validate balance

## Summary

This system provides a balanced economy where:
- **Users earn XP** through learning activities
- **XP shows progression** (cumulative total never decreases)
- **Users can spend XP** on arcade games (creating meaningful choices)
- **The system is extensible** for future monetization or gamification features

The dual XP approach ensures users always feel they're making progress (cumulative XP) while also having a resource to manage (available XP).

