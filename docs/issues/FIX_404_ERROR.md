# 🔧 Fix 404 Error - Arcade Games

## 🚨 Problem

You're seeing: **"HTTP error loading game: 404"**

## 🎯 Root Cause

Your database has **HTML5 games** (Hextris, Clumsy Bird, Space Invaders, Pac-Man) that try to load from your backend server, but those files aren't deployed to Railway yet.

**The 3 React Native games (Snake, 2048, Tetris) don't need the backend** - they work immediately!

---

## ✅ Quick Fix (2 Steps)

### **Step 1: Clean Your Database**

Run this SQL in Supabase to **remove HTML5 games** and keep only working React Native games:

```sql
-- Remove any HTML5 games causing 404 errors
DELETE FROM arcade_games WHERE game_url LIKE 'games/%';

-- Remove any duplicate 2048 entries (you might have 2)
DELETE FROM arcade_games WHERE name = '2048' AND game_url = 'games/2048/index.html';

-- Verify only React Native games remain
SELECT name, game_url FROM arcade_games;
```

### **Step 2: Add ONLY React Native Games**

Run this SQL (it's safe to run multiple times):

```sql
-- Add Snake (if not already there)
INSERT INTO arcade_games (name, description, game_url, xp_cost, category, difficulty, is_active)
SELECT 'Snake', 'Guide the snake to eat food and grow longer! Avoid hitting walls or yourself.', 'snake', 0, 'classic', 'easy', true
WHERE NOT EXISTS (SELECT 1 FROM arcade_games WHERE game_url = 'snake');

-- Add 2048 (if not already there)
INSERT INTO arcade_games (name, description, game_url, xp_cost, category, difficulty, is_active)
SELECT '2048', 'Swipe to move tiles. When two tiles with the same number touch, they merge into one!', '2048', 0, 'puzzle', 'medium', true
WHERE NOT EXISTS (SELECT 1 FROM arcade_games WHERE game_url = '2048');

-- Add Tetris (if not already there)
INSERT INTO arcade_games (name, description, game_url, xp_cost, category, difficulty, is_active)
SELECT 'Tetris', 'Stack falling blocks to clear lines! Rotate and move pieces to create complete rows.', 'tetris', 0, 'puzzle', 'medium', true
WHERE NOT EXISTS (SELECT 1 FROM arcade_games WHERE game_url = 'tetris');

-- Final verification - Should show exactly 3 games
SELECT name, game_url, is_active FROM arcade_games ORDER BY name;
```

---

## 🎮 Expected Result

After running the fix, you should have **exactly 3 games**:

| Name | game_url | Type | Works? |
|------|----------|------|--------|
| Snake | `snake` | React Native | ✅ YES |
| 2048 | `2048` | React Native | ✅ YES |
| Tetris | `tetris` | React Native | ✅ YES |

**NO games with:**
- ❌ `games/hextris/index.html`
- ❌ `games/2048/index.html`
- ❌ `games/clumsy-bird/index.html`
- ❌ `games/space-invaders/index.html`
- ❌ `games/pacman/index.html`

---

## 🧪 Test After Fix

1. **Restart your app** (kill and restart)
2. Navigate to **Arcade**
3. You should see **3 games**:
   - Snake
   - 2048
   - Tetris
4. Tap each one - **should work immediately!**

---

## 🤔 Why This Happened

You probably ran the old `populate_arcade_games.sql` which included:
- ✅ 3 React Native games (work immediately)
- ❌ 4 HTML5 games (need backend deployment)

The HTML5 games try to load from:
```
https://unilingov1-production.up.railway.app/games/hextris/index.html
```

But those files aren't on your Railway backend yet, causing 404 errors.

---

## 💡 Solution Summary

**Use the React Native games ONLY:**
- These are built into your app
- No backend needed
- Work offline
- No 404 errors

**If you want HTML5 games later:**
- Deploy the `backend/public/games/` folder to Railway
- They'll work via WebView
- But the 3 React Native games are better anyway!

---

## 🚀 Quick Fix Commands

### **Option A: Use the New Clean Script**
```sql
-- Run this file in Supabase:
-- arcade_games_react_native_only.sql
```

### **Option B: Manual Cleanup**
```sql
-- 1. Delete HTML5 games
DELETE FROM arcade_games WHERE game_url LIKE 'games/%';

-- 2. Keep only React Native games
-- (The 3 React Native games should already be there)

-- 3. Verify
SELECT * FROM arcade_games;
```

---

## ✅ After Fix

You'll have:
- ✅ 3 working arcade games
- ✅ No 404 errors
- ✅ Instant loading
- ✅ Beautiful gameplay

---

## 🎊 Run the Fix Now!

**Just run the cleanup SQL above, restart your app, and all 3 games will work!** 🎮✨

