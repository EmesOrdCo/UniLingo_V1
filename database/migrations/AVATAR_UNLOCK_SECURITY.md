# Avatar Unlock System - User Security Explanation

## 🔒 User-Specific Unlocks - How It Works

### **Database Structure:**

1. **`avatar_items` table** (Global):
   - Contains ALL available avatar items
   - Same items for all users
   - Items have XP costs (0 = free, 5/10/15 = paid)

2. **`user_avatar_unlocks` table** (User-specific):
   - Tracks what EACH user has unlocked
   - One row per user per unlocked item
   - Contains `user_id`, `item_id`, `xp_spent`, `unlocked_at`

### **Security Flow:**

```sql
-- When User A unlocks "Big Hair" (10 XP):
INSERT INTO user_avatar_unlocks (user_id, item_id, xp_spent)
VALUES ('user-a-123', 'big-hair-item-id', 10);

-- When User B unlocks "Big Hair" (10 XP):
INSERT INTO user_avatar_unlocks (user_id, item_id, xp_spent)
VALUES ('user-b-456', 'big-hair-item-id', 10);

-- When checking if User A has "Big Hair":
SELECT EXISTS(
  SELECT 1 FROM user_avatar_unlocks 
  WHERE user_id = 'user-a-123' AND item_id = 'big-hair-item-id'
);
-- Returns: true (User A has it)

-- When checking if User B has "Big Hair":
SELECT EXISTS(
  SELECT 1 FROM user_avatar_unlocks 
  WHERE user_id = 'user-b-456' AND item_id = 'big-hair-item-id'
);
-- Returns: false (User B doesn't have it yet)
```

### **RLS (Row Level Security) Policies:**

```sql
-- Users can only see their own unlocks
CREATE POLICY "Users can view their own unlocks"
  ON user_avatar_unlocks FOR SELECT
  USING (auth.uid() = user_id);

-- Users can only unlock items for themselves
CREATE POLICY "Users can insert their own unlocks"
  ON user_avatar_unlocks FOR INSERT
  WITH CHECK (auth.uid() = user_id);
```

### **Real-World Example:**

- **User Alice** completes lessons, earns 50 XP
- **User Alice** unlocks "Big Hair" for 10 XP
- **User Bob** completes lessons, earns 30 XP  
- **User Bob** tries to unlock "Big Hair" for 10 XP ✅ (has enough XP)
- **User Charlie** completes lessons, earns 5 XP
- **User Charlie** tries to unlock "Big Hair" for 10 XP ❌ (not enough XP)

### **Key Points:**

✅ **Each user's unlocks are completely separate**
✅ **Users must earn their own XP to unlock items**
✅ **RLS policies prevent users from seeing other users' unlocks**
✅ **Database functions ensure proper user isolation**
✅ **Same item can be unlocked by multiple users independently**

### **No Cross-User Access:**

- User A cannot see User B's unlocked items
- User A cannot unlock items for User B
- User A cannot spend User B's XP
- Each user builds their own avatar collection

This system is **100% user-specific** and follows the same security patterns as your existing arcade games system.
