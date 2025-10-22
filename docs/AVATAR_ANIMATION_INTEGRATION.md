# Avatar Animation Integration Guide

## 🎯 Quick Start

### 1. Replace Static Avatar with Animated Version

**Before:**
```tsx
import Avatar from '../components/avatar/Avatar';

<Avatar size={200} />
```

**After:**
```tsx
import AnimatedAvatar from '../components/avatar/AnimatedAvatar';
import { useAvatarAnimation } from '../hooks/useAvatarAnimation';

const { currentAnimation, triggerCelebration, triggerEquip } = useAvatarAnimation();

<AnimatedAvatar 
  size={200} 
  animationType={currentAnimation}
  onAnimationComplete={() => console.log('Animation done!')}
/>
```

### 2. Trigger Animations in Your App

**For Item Unlocks (Avatar Shop):**
```tsx
const handleItemUnlock = async (item: AvatarItem) => {
  const result = await AvatarUnlockService.unlockItem(user.id, item.id);
  
  if (result.success) {
    triggerEquip(); // Subtle equip animation
    // ... rest of unlock logic
  }
};
```

**For Game Completion:**
```tsx
const handleGameComplete = (score: number) => {
  if (score >= 80) {
    triggerCelebration(); // Success celebration
  } else {
    triggerBlink(); // Subtle acknowledgment
  }
};
```

**For Idle State:**
```tsx
// Automatically plays subtle bounce animation
<AnimatedAvatar animationType="idle" />
```

## 🎨 Animation Types

| Type | Description | Duration | Use Case |
|------|-------------|----------|----------|
| `idle` | Subtle bounce (2px up/down) | Continuous | Default state |
| `blink` | Eye opacity fade | 3.2s | Acknowledgment |
| `celebrate` | Scale + rotate | 0.7s | Success/completion |
| `equip` | Quick scale pop | 0.3s | Item unlock |
| `none` | No animation | - | Disabled state |

## 🔧 Customization

### Adjust Animation Timing
Edit `AnimatedAvatar.tsx`:
```tsx
// Make bounce slower
duration: 3000, // instead of 2000

// Make celebration faster
duration: 150, // instead of 200
```

### Adjust Animation Intensity
```tsx
// Make bounce more subtle
toValue: -1, // instead of -2

// Make celebration less dramatic
toValue: 1.05, // instead of 1.1
```

## 📱 Integration Examples

### Avatar Shop Integration
```tsx
// In SubcategoryPage.tsx
const { triggerEquip } = useAvatarAnimation();

const handleUnlock = async (item: AvatarItem) => {
  const result = await AvatarUnlockService.unlockItem(user.id, item.id);
  
  if (result.success) {
    triggerEquip(); // Show equip animation
    // ... existing unlock logic
  }
};
```

### Game Screen Integration
```tsx
// In GamesScreen.tsx
const { triggerCelebration, triggerBlink } = useAvatarAnimation();

const processGameCompletion = async (score: number) => {
  if (score >= 80) {
    triggerCelebration(); // Success animation
  } else {
    triggerBlink(); // Acknowledgment animation
  }
  
  // ... existing completion logic
};
```

## 🚀 Performance Notes

- **Zero Bundle Impact**: Only CSS-style animations, no additional files
- **Hardware Accelerated**: Uses `useNativeDriver: true`
- **Memory Efficient**: Animations reset automatically
- **Cross-Platform**: Works on both web and React Native

## 🎯 Next Steps

1. **Test the demo**: Run `AvatarAnimationDemo` to see animations
2. **Integrate gradually**: Start with one screen (avatar shop)
3. **Customize timing**: Adjust durations to match your app's feel
4. **Add more triggers**: Use animations for user feedback throughout the app

## 🔍 Troubleshooting

**Animation not playing?**
- Check `animationType` prop is set correctly
- Ensure `useAvatarAnimation` hook is imported
- Verify `AnimatedAvatar` is used instead of `Avatar`

**Performance issues?**
- Animations use native driver, should be smooth
- If issues persist, reduce animation frequency or intensity

**Animations too subtle/dramatic?**
- Adjust `toValue` parameters in `AnimatedAvatar.tsx`
- Modify `duration` values for timing changes
