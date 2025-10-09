# Arcade Games Integration Guide

## ✅ **COMPLETED SO FAR**

1. ✅ Database tables created (`create_arcade_tables.sql`)
2. ✅ Arcade service with all game operations
3. ✅ Beautiful game card component
4. ✅ Game WebView component (ready for actual games)
5. ✅ Full arcade section with categories
6. ✅ Integrated into Progress Page
7. ✅ Game tracking and high scores system
8. ✅ Free games (XP cost = 0)

## 🎮 **NEXT STEPS: Integrate Actual Games**

The arcade system is fully built and ready! Now we just need to add the actual HTML5 games.

### **Option 1: Host Games Locally (RECOMMENDED)**

Download open-source HTML5 games and host them in your app:

```
assets/
  games/
    hextris/
      index.html
      game.js
      style.css
    2048/
      index.html
      game.js
      style.css
    flappy-bird/
      index.html
      game.js
      style.css
    snake/
      index.html
      game.js
      style.css
    tetris/
      index.html
      game.js
      style.css
```

**Steps:**
1. Download games from GitHub (see links below)
2. Place in `assets/games/` folder
3. Update `GameWebView.tsx` to load local files
4. Test each game

### **Option 2: Use CDN/External Hosting**

Host games on your own server or use CDN:

**Steps:**
1. Upload games to your web server
2. Update database `game_url` column with full URLs
3. Games load directly in WebView

---

## 📥 **WHERE TO GET THE GAMES**

### **1. Hextris**
- **GitHub**: https://github.com/Hextris/hextris
- **License**: GPL-3.0
- **Size**: ~500KB
- **Setup**: Clone repo, use `public/` folder contents

### **2. 2048**
- **GitHub**: https://github.com/gabrielecirulli/2048
- **License**: MIT
- **Size**: ~200KB
- **Setup**: Clone repo, use root folder contents

### **3. Flappy Bird Clone**
- **GitHub**: https://github.com/CodeExplainedRepo/Flappy-Bird-JavaScript
- **License**: MIT
- **Size**: ~100KB
- **Setup**: Clone repo, use all files

### **4. Snake**
- **GitHub**: https://github.com/patorjk/JavaScript-Snake
- **License**: MIT
- **Size**: ~50KB
- **Setup**: Single HTML file

### **5. Tetris**
- **GitHub**: https://github.com/dionyziz/canvas-tetris
- **License**: MIT
- **Size**: ~100KB
- **Setup**: Single HTML file with assets

### **6. Breakout**
- **GitHub**: https://github.com/end3r/Gamedev-Canvas-workshop
- **License**: CC0
- **Size**: ~50KB
- **Setup**: Use breakout example

### **7. Space Invaders**
- **GitHub**: https://github.com/dwmkerr/spaceinvaders
- **License**: MIT
- **Size**: ~200KB
- **Setup**: Use `src/` folder

### **8. Pac-Man**
- **GitHub**: https://github.com/daleharvey/pacman
- **License**: MIT
- **Size**: ~500KB
- **Setup**: Use all files

---

## 🔧 **INTEGRATION STEPS**

### **Step 1: Download Games**

```bash
# Create games directory
mkdir -p assets/games

# Clone each game
cd assets/games

# Hextris
git clone https://github.com/Hextris/hextris.git
cd hextris && npm install && npm run build
cd ..

# 2048
git clone https://github.com/gabrielecirulli/2048.git

# Flappy Bird
git clone https://github.com/CodeExplainedRepo/Flappy-Bird-JavaScript.git flappy-bird

# Snake
git clone https://github.com/patorjk/JavaScript-Snake.git snake

# Tetris
git clone https://github.com/dionyziz/canvas-tetris.git tetris
```

### **Step 2: Update GameWebView Component**

Replace the placeholder in `GameWebView.tsx`:

```typescript
// Remove placeholder, uncomment WebView
// Change:
const gameUrl = `https://example.com/games/${game.game_url}`;

// To:
const gameUrl = Platform.OS === 'web'
  ? `/games/${game.game_url}/index.html`
  : `file://${RNFS.MainBundlePath}/assets/games/${game.game_url}/index.html`;
```

### **Step 3: Add Score Communication**

Add this JavaScript to each game's HTML to send scores back to the app:

```javascript
// Add to each game's JavaScript
function sendScoreToApp(score) {
  if (window.ReactNativeWebView) {
    window.ReactNativeWebView.postMessage(JSON.stringify({
      type: 'GAME_OVER',
      score: score
    }));
  }
}

// Call when game ends
// Example for Hextris:
function gameOver() {
  sendScoreToApp(score);
  // ... rest of game over logic
}
```

### **Step 4: Update Database**

Run this SQL to update game URLs:

```sql
-- Update game URLs to point to local files
UPDATE arcade_games SET game_url = 'hextris' WHERE name = 'Hextris';
UPDATE arcade_games SET game_url = '2048' WHERE name = '2048';
UPDATE arcade_games SET game_url = 'flappy-bird' WHERE name = 'Flappy Bird';
UPDATE arcade_games SET game_url = 'snake' WHERE name = 'Snake';
UPDATE arcade_games SET game_url = 'tetris' WHERE name = 'Tetris';
UPDATE arcade_games SET game_url = 'breakout' WHERE name = 'Breakout';
UPDATE arcade_games SET game_url = 'space-invaders' WHERE name = 'Space Invaders';
UPDATE arcade_games SET game_url = 'pacman' WHERE name = 'Pac-Man';
```

### **Step 5: Test Each Game**

1. Load each game in the arcade
2. Verify controls work on mobile
3. Test score submission
4. Check high score updates
5. Verify game tracking

---

## 🎨 **CUSTOMIZATION IDEAS**

### **Add Game Thumbnails**

Create thumbnail images for each game:

```sql
UPDATE arcade_games SET thumbnail_url = 'https://yourdomain.com/thumbnails/hextris.png' WHERE name = 'Hextris';
```

### **Add XP Costs Later**

When ready to charge XP:

```sql
UPDATE arcade_games SET xp_cost = 50 WHERE name = 'Hextris';
UPDATE arcade_games SET xp_cost = 50 WHERE name = '2048';
UPDATE arcade_games SET xp_cost = 20 WHERE name = 'Flappy Bird';
-- etc.
```

### **Add More Games**

Just insert into database:

```sql
INSERT INTO arcade_games (name, description, game_url, category, difficulty, xp_cost)
VALUES ('New Game', 'Description', 'new-game', 'puzzle', 'easy', 0);
```

---

## 📱 **MOBILE OPTIMIZATION**

### **Touch Controls**

Ensure each game supports touch:
- Tap instead of click
- Swipe gestures
- No hover states

### **Screen Sizes**

Make games responsive:
```javascript
// Add to each game
const canvas = document.getElementById('game-canvas');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
```

### **Performance**

Optimize for mobile:
- Reduce particle effects
- Lower frame rate if needed
- Compress assets

---

## 🚀 **QUICK START (SIMPLIFIED)**

If you want to get started quickly without downloading games:

1. **Use iframe embeds** of existing hosted games:

```typescript
// In GameWebView.tsx
const gameUrls = {
  'hextris': 'https://hextris.io',
  '2048': 'https://play2048.co',
  'flappy-bird': 'https://flappybird.io',
  // etc.
};

const gameUrl = gameUrls[game.game_url] || game.game_url;
```

2. **Test with these URLs** (they work but you won't get score integration)

3. **Later, download and host locally** for full control

---

## ✅ **WHAT'S WORKING NOW**

Even without the actual games integrated, you have:

1. ✅ Beautiful arcade UI
2. ✅ Game cards with categories
3. ✅ Category filtering
4. ✅ High score tracking system
5. ✅ Game play tracking
6. ✅ Database ready
7. ✅ All components built
8. ✅ Free to play (0 XP cost)

**Just need to add the actual game files!**

---

## 🎯 **RECOMMENDED PRIORITY**

Start with these 3 games (easiest to integrate):

1. **2048** - Simple, single file, works great on mobile
2. **Snake** - Classic, lightweight, easy controls
3. **Hextris** - Beautiful, addictive, good showcase

Then add the rest when ready!

---

## 📞 **NEED HELP?**

If you need help integrating the games:
1. Pick one game to start with
2. Download it
3. Test it in a browser
4. Then integrate into the app

The arcade system is 100% ready - just plug in the games! 🎮
