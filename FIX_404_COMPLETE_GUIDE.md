# 🔧 Fix 404 Error - Complete Guide

## 🚨 The Error You're Seeing

```
ERROR HTTP error loading game: 404 https://unilingov1-production.up.railway.app/tetris
LOG Game loaded successfully: Tetris
```

---

## 🎯 Root Cause

**Two possible issues:**

1. **Old HTML5 game entries in database** - Trying to load from backend
2. **Duplicate game entries** - Both HTML5 and React Native versions

---

## ✅ Complete Fix (3 Steps)

### **Step 1: Clean Database**

Run this SQL in Supabase to **completely reset** your arcade games:

```sql
-- Remove ALL arcade game entries
DELETE FROM arcade_games;
```

### **Step 2: Add ONLY React Native Games**

```sql
-- Add the 3 working React Native games
INSERT INTO arcade_games (
  name, description, game_url, xp_cost, category, difficulty, is_active
) VALUES 
  ('Snake', 'Guide the snake to eat food and grow longer!', 'snake', 0, 'classic', 'easy', true),
  ('2048', 'Swipe to move tiles to merge them!', '2048', 0, 'puzzle', 'medium', true),
  ('Tetris', 'Stack blocks to clear lines!', 'tetris', 0, 'puzzle', 'medium', true);

-- Verify exactly 3 games exist
SELECT name, game_url FROM arcade_games;
```

**Expected result: 3 rows with game_url = 'snake', '2048', 'tetris'**

### **Step 3: Restart App**

```bash
# Kill the app completely
# Then restart
npm start
```

---

## 🧪 Test After Fix

1. Navigate to **Arcade**
2. You should see **exactly 3 games**
3. Tap **Snake** → Should open immediately (no 404)
4. Tap **2048** → Should open immediately (no 404)
5. Tap **Tetris** → Should open immediately (no 404)

---

## ❓ Quick Diagnosis

**Check your database now:**

```sql
-- Run this to see what's in your database
SELECT name, game_url, is_active FROM arcade_games ORDER BY name;
```

**If you see:**
- ✅ **ONLY 3 games** with game_url = 'snake', '2048', 'tetris' → **GOOD!**
- ❌ **Games with** game_url like 'games/something.html' → **BAD - Run cleanup**
- ❌ **More than 3 games** → **BAD - Run cleanup**
- ❌ **Duplicate 2048 entries** → **BAD - Run cleanup**

---

## 🎮 Expected Database State

**CORRECT:**
```
name    | game_url | is_active
--------|----------|----------
2048    | 2048     | true
Snake   | snake    | true
Tetris  | tetris   | true
```

**INCORRECT (if you see these, delete them):**
```
name           | game_url                        | PROBLEM
---------------|--------------------------------|----------------
Hextris        | games/hextris/index.html       | ❌ Causes 404
Clumsy Bird    | games/clumsy-bird/index.html   | ❌ Causes 404
Space Invaders | games/space-invaders/index.html| ❌ Causes 404
Pac-Man        | games/pacman/index.html        | ❌ Causes 404
2048 (duplicate)| games/2048/index.html         | ❌ Causes 404
```

---

## 🔍 Why This Happens

**You might have:**
1. Run the old `populate_arcade_games.sql` which had HTML5 games
2. HTML5 games try to load from backend (404 error)
3. React Native games are routing correctly but error still appears

---

## 💡 Files to Use

**Use THIS clean script:**
- ✅ `CLEANUP_ARCADE_DATABASE.sql` - Removes everything and adds only 3 React Native games

**DON'T use:**
- ❌ `populate_arcade_games.sql` - Old file with HTML5 games

---

## 🚀 Quick Fix Command

**Copy and paste this into Supabase SQL Editor:**

```sql
-- Clean slate
DELETE FROM arcade_games;

-- Add only working games
INSERT INTO arcade_games (name, description, game_url, xp_cost, category, difficulty, is_active) VALUES 
  ('Snake', 'Guide the snake to eat food and grow longer!', 'snake', 0, 'classic', 'easy', true),
  ('2048', 'Swipe to move tiles to merge them!', '2048', 0, 'puzzle', 'medium', true),
  ('Tetris', 'Stack blocks to clear lines!', 'tetris', 0, 'puzzle', 'medium', true);

-- Verify
SELECT name, game_url FROM arcade_games;
```

---

## ✅ After Running This

1. **Restart your app** (important!)
2. Go to Arcade
3. **No more 404 errors**
4. All 3 games work perfectly

---

## 📊 What Each game_url Does

| game_url | What Happens | Works? |
|----------|--------------|--------|
| `snake` | Opens SnakeGame.tsx | ✅ YES |
| `2048` | Opens 2048Game.tsx | ✅ YES |
| `tetris` | Opens TetrisGame.tsx | ✅ YES |
| `games/anything.html` | Tries to load from backend → 404 | ❌ NO |

---

## 🎊 Run the Cleanup!

**Execute `CLEANUP_ARCADE_DATABASE.sql` in Supabase and the 404 errors will disappear!** 🎮✨

