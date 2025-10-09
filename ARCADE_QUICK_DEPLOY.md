# 🚀 Quick Deploy Guide - Arcade Games

## 3 Simple Steps to Get Games Working

### 1️⃣ Run SQL Script in Supabase

1. Open **Supabase SQL Editor**
2. Copy contents from `populate_arcade_games.sql`
3. Click **Run**
4. Verify: You should see 5 new rows in `arcade_games` table

### 2️⃣ Deploy Backend to Railway

```bash
cd backend
git add .
git commit -m "Add arcade games to public directory"
git push
```

Wait ~2 minutes for Railway to deploy.

### 3️⃣ Test in Your App

1. **Restart your app** (to refresh backend config if needed)
2. Navigate to: **Progress Page → Arcade**
3. Tap any game → Should load and play!

---

## ✅ Verification

Test that games load by opening these URLs in your browser:

- https://your-backend-url.railway.app/games/hextris/index.html
- https://your-backend-url.railway.app/games/2048/index.html
- https://your-backend-url.railway.app/games/clumsy-bird/index.html
- https://your-backend-url.railway.app/games/space-invaders/index.html
- https://your-backend-url.railway.app/games/pacman/index.html

If all 5 URLs load games in your browser, they'll work in your app! 🎉

---

## 🐛 Quick Fixes

**Games won't load?**
```bash
# Check if games are in backend
ls backend/public/games/

# Should show:
# 2048  clumsy-bird  hextris  pacman  space-invaders
```

**Database empty?**
```sql
-- Check games exist
SELECT name FROM arcade_games;
```

**Backend not serving files?**
```javascript
// Verify in backend/server.js (line 279)
app.use(express.static('public')); // ✅ Should exist
```

---

## 🎮 That's It!

Your arcade is ready with 5 classic games, all free to play!

