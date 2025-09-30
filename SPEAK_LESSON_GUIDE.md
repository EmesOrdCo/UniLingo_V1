# 🎤 Speak Lesson - Testing Guide

## Overview

The Speak lesson feature is now fully integrated! Users can practice pronunciation of vocabulary words with real-time feedback using Azure Speech Services.

## How to Test

### 1. **Access Speak Lesson**

1. Open app and go to **Home** page
2. Scroll to **Course Units** section
3. Tap on any topic group (e.g., "Basic Verbs")
4. You'll see 5 lesson types - tap **"Speak"** 🎤
5. The Speak lesson screen will open

### 2. **Use the Speak Lesson**

**Screen Layout:**
- **Header**: Shows topic name and XP counter
- **Progress bar**: Shows current word / total words
- **Pronunciation component**: 
  - Target word displayed prominently
  - "Tap to Record" button
  - Attempts remaining counter
  - Word definition and example

**Workflow:**
1. Read the word displayed (e.g., "go")
2. Tap **"Tap to Record"** button
3. Speak the word clearly into your microphone
4. Recording auto-stops after 5 seconds (or tap "Stop")
5. Wait for analysis (~2-3 seconds)
6. See your score and feedback!

### 3. **Scoring & Rewards**

**Score Breakdown:**
- **90-100**: Excellent! 🌟 → Earn 15 XP
- **75-89**: Good job! 👍 → Earn 10 XP
- **60-74**: Not bad! 💪 → Earn 5 XP
- **0-59**: Keep practicing! 📚 → Earn 2 XP

**Result Details:**
- **Overall Score**: 0-100
- **Accuracy Score**: How precise your sounds are
- **Fluency Score**: How natural it flows
- **What you said**: Recognized text vs expected

### 4. **Retry System**

- **3 attempts per word**
- After 3 attempts OR scoring 60+, auto-move to next word
- Can manually skip with "Skip This Word" button
- Best score is saved

### 5. **Completion**

After all words:
- See completion screen with:
  - Total words practiced
  - Average score
  - Number of perfect scores (90+)
  - Total XP earned
- Bonus XP based on average score
- Tap "Done" to return to home

## Expected Behavior

### ✅ What Works

1. **Pronunciation Assessment**
   - Real-time speech recognition
   - Detailed scoring (accuracy, fluency, completeness)
   - Word-level and phoneme-level feedback
   - Natural language suggestions

2. **XP Rewards**
   - Immediate XP for each word
   - Bonus XP at lesson completion
   - Higher scores = more XP

3. **Smooth UX**
   - Auto-progression after max attempts
   - Visual feedback (pulse animation while recording)
   - Clear attempt tracking
   - Skip option available

4. **All Vocabulary**
   - Loads all words from selected topic group
   - Shows definition and example sentence
   - Supports any CEFR level (A1-C2)

### ⚠️ Known Limitations

1. **Microphone Permission**
   - First time: App will request permission
   - If denied: User gets clear error message
   - iOS/Android: Different permission flows

2. **Internet Required**
   - Speech assessment requires backend connection
   - Clear error if offline

3. **Audio Quality**
   - Better microphone = better scores
   - Background noise can affect accuracy
   - Works best in quiet environment

## Testing Checklist

### Basic Flow
- [ ] Can access Speak lesson from home page
- [ ] Lesson loads all words for topic
- [ ] Recording starts when tapping button
- [ ] Recording stops automatically or manually
- [ ] Score appears after processing
- [ ] XP is awarded correctly
- [ ] Progress bar updates
- [ ] Completion screen shows at end

### Edge Cases
- [ ] What happens if mic permission denied?
- [ ] What if no internet connection?
- [ ] What if user speaks wrong word?
- [ ] What if user doesn't speak at all?
- [ ] What if user taps record while already recording?
- [ ] What if user navigates away mid-lesson?

### Quality
- [ ] Scores seem accurate for good/bad pronunciation
- [ ] Feedback messages are helpful
- [ ] UI is responsive and clear
- [ ] No crashes or errors
- [ ] Works on both iOS and Android

## Troubleshooting

### "Microphone permission required"
- **iOS**: Settings → UniLingo → Microphone → Enable
- **Android**: Settings → Apps → UniLingo → Permissions → Microphone → Allow

### "No speech recognized"
- Speak louder and clearer
- Check microphone is not muted
- Try in a quieter environment
- Make sure you're saying the exact word

### "Assessment failed"
- Check internet connection
- Verify backend is running
- Check Azure credentials in Railway
- See backend logs for details

### Low/Wrong Scores
- Pronunciation assessment is strict
- Practice makes perfect!
- Some accents may score differently
- Background noise affects scores

## API Usage & Costs

### Current Setup
- **Free Tier**: 5 hours/month
- **Per Lesson**: ~20-50 words × 2 sec each = ~40-100 seconds
- **Cost**: Free for ~180-450 lessons/month

### Monitoring
- Check Azure portal for usage
- Free tier alerts at 80% usage
- Auto-upgrades to Standard if exceeded (~$1/hour)

## Next Steps (Future Enhancements)

### Could Add:
1. **Progress Tracking**: Save pronunciation scores per word
2. **Leaderboards**: Compare scores with friends
3. **Sentence Practice**: Pronounce full sentences
4. **Accent Selection**: Choose target accent (British/American)
5. **Slow Playback**: Hear correct pronunciation
6. **Recording Review**: Play back your recording
7. **Daily Streaks**: Track consecutive days of practice
8. **Achievements**: Badges for milestones

### Technical Improvements:
1. **Offline Mode**: Download pronunciations for offline practice
2. **Better Error Handling**: More graceful failures
3. **Caching**: Cache assessment results
4. **Queue System**: Handle multiple concurrent users better
5. **Analytics**: Track which words are hardest

## Support

If you encounter issues:
1. Check console logs for errors
2. Verify backend is running (`cd backend && npm run dev`)
3. Check Railway deployment logs
4. Verify Azure credentials are set
5. Test with simple words first (e.g., "go", "cat", "run")

---

**Ready to test!** 🎤 Navigate to Home → Topic Group → Speak and start practicing! 🚀
