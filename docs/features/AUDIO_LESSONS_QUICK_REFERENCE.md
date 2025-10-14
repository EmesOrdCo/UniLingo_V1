# 🎵 Audio Lessons Quick Reference Card

## ⚡ 3-Minute Setup Checklist

```
□ 1. Run create_audio_lessons_table.sql in Supabase
□ 2. npm install @aws-sdk/client-polly @aws-sdk/client-s3
□ 3. Add AWS credentials to backend/.env
□ 4. Restart backend (npm start)
□ 5. Update AudioRecapScreen.tsx (see guide)
□ 6. Test!
```

---

## 📋 Files Created For You

| File | Purpose | Status |
|------|---------|--------|
| `create_audio_lessons_table.sql` | Database schema | ✅ Ready |
| `backend/pollyService.js` | AWS Polly service | ✅ Ready |
| `backend/audioEndpoints.js` | API routes | ✅ Ready |
| `src/lib/audioLessonService.ts` | Frontend service | ✅ Ready |
| `AUDIO_LESSONS_SETUP_GUIDE.md` | Full guide | ✅ Ready |
| `AUDIO_LESSONS_SIMPLE_FLOW.md` | Visual flow | ✅ Ready |

---

## 🔑 Environment Variables Needed

Add to `backend/.env`:

```env
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=wJalr...
AWS_REGION=us-east-1
AWS_S3_BUCKET=unilingo-audio-lessons
```

---

## 🌐 AWS Resources Needed

| Resource | Name | Purpose |
|----------|------|---------|
| IAM User | `unilingo-polly-user` | API access |
| S3 Bucket | `unilingo-audio-lessons` | Store MP3 files |
| Polly | (service, no setup) | Text-to-speech |

**Permissions:**
- `AmazonPollyFullAccess`
- `AmazonS3FullAccess`

---

## 🗄️ Database Schema

**Table:** `audio_lessons`

**Key Columns:**
- `id` (UUID)
- `user_id` (UUID)
- `lesson_id` (UUID) - links to esp_lessons
- `audio_url` (TEXT) - S3 URL
- `audio_duration` (INTEGER) - seconds
- `title` (TEXT)
- `status` ('processing' | 'completed' | 'failed')
- `play_count` (INTEGER)

---

## 🔗 API Endpoints

All endpoints at: `http://localhost:3001/api/audio/`

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/generate-lesson` | Generate audio |
| GET | `/lessons/:userId` | Get user's audio lessons |
| GET | `/lesson/:audioLessonId` | Get specific audio |
| DELETE | `/lesson/:audioLessonId` | Delete audio |
| PUT | `/lesson/:audioLessonId/play` | Track playback |
| GET | `/stats/:userId` | Get user stats |

---

## 🎯 Usage Example (Backend)

```javascript
// Generate audio for a lesson
POST /api/audio/generate-lesson
{
  "lessonId": "abc-123",
  "userId": "user-456"
}

// Response:
{
  "success": true,
  "audioLesson": {
    "id": "audio-789",
    "title": "Biology Lesson 1",
    "audio_url": "https://s3.amazonaws.com/.../audio.mp3",
    "audio_duration": 120
  },
  "generationTime": 5
}
```

---

## 📱 Usage Example (Frontend)

```typescript
import { AudioLessonService } from '../lib/audioLessonService';

// Generate audio
const result = await AudioLessonService.generateAudio(lessonId, userId);

// Get user's audio lessons
const lessons = await AudioLessonService.getUserAudioLessons(userId);

// Play audio
import { Audio } from 'expo-av';
const { sound } = await Audio.Sound.createAsync(
  { uri: lesson.audio_url },
  { shouldPlay: true }
);

// Delete audio
await AudioLessonService.deleteAudioLesson(audioLessonId, userId);
```

---

## 🔍 How to Test

### 1. Test Backend Connection
```bash
curl http://localhost:3001/api/health
```

### 2. Test Audio Generation
```bash
curl -X POST http://localhost:3001/api/audio/generate-lesson \
  -H "Content-Type: application/json" \
  -d '{"lessonId":"YOUR_LESSON_ID","userId":"YOUR_USER_ID"}'
```

### 3. Test in App
1. Create regular lesson (upload PDF)
2. Go to Audio Recap
3. Generate audio
4. Play audio

---

## 🐛 Troubleshooting

| Problem | Solution |
|---------|----------|
| "AWS credentials not configured" | Check `.env` file has AWS keys |
| "Polly generation failed" | Verify IAM user has Polly permissions |
| "S3 upload failed" | Check S3 bucket name matches `.env` |
| "Audio won't play" | Verify S3 bucket policy allows public read |
| "Database insert failed" | Run `create_audio_lessons_table.sql` |
| Backend not recognizing routes | Restart backend server |

---

## 💰 Cost Calculator

**Per 1000 lessons:**
- 1000 lessons × 5,000 characters = 5M characters
- Polly: 5M chars × $4/1M = $20
- S3 storage: 1000 files × 1MB × $0.023/GB = $0.02
- **Total: ~$20 for 1000 lessons**

**Per lesson: ~$0.02** 💸

---

## 🎙️ Voice Options

Change voice in `backend/pollyService.js`:

```javascript
// Line ~112
VoiceId: 'Joanna',  // Change this!
```

**Available voices:**
- `Joanna` (Female, US) - Default ✅
- `Matthew` (Male, US)
- `Ivy` (Female, US, young)
- `Joey` (Male, US, young)
- `Amy` (Female, UK)
- `Emma` (Female, UK)
- `Brian` (Male, UK)
- Many more...

---

## ⚙️ Configuration Options

In `backend/pollyService.js`:

```javascript
// Audio quality
Engine: 'neural',  // or 'standard' (cheaper but lower quality)

// Sample rate
SampleRate: '24000',  // or '16000', '22050'

// Speaking rate (in SSML)
'<prosody rate="medium">text</prosody>'  // slow, medium, fast

// Add pauses
'<break time="1s"/>'  // 1 second pause
```

---

## 📊 Database Queries

```sql
-- Get all audio lessons
SELECT * FROM audio_lessons 
WHERE user_id = 'your-user-id' 
AND status = 'completed';

-- Get stats
SELECT 
  COUNT(*) as total_lessons,
  SUM(audio_duration) as total_duration_seconds,
  SUM(play_count) as total_plays
FROM audio_lessons 
WHERE user_id = 'your-user-id';

-- Find failed generations
SELECT * FROM audio_lessons 
WHERE status = 'failed';
```

---

## 🔄 Complete Flow Summary

```
1. User creates lesson (upload PDF)
   └─> Stored in esp_lessons + lesson_vocabulary

2. User taps "Generate Audio"
   └─> Frontend calls AudioLessonService.generateAudio()

3. Backend receives request
   └─> Fetches lesson from database
   └─> Formats script for TTS
   └─> Calls AWS Polly
   └─> Polly returns MP3 audio

4. Backend uploads to S3
   └─> Gets public URL

5. Backend saves to database
   └─> Stores in audio_lessons table

6. Frontend displays audio lesson
   └─> User can play, pause, delete

7. User plays audio
   └─> Streams from S3
   └─> Tracks play count
```

---

## 🚀 Next Steps After Setup

1. **Test with real lesson** ✅
2. **Check AWS costs** (should be minimal)
3. **Add features:**
   - Playback speed control
   - Download for offline
   - Auto-generate on lesson creation
   - Progress bar
   - Background playback
4. **Monitor:**
   - AWS billing
   - S3 storage usage
   - User engagement

---

## 📞 Support Resources

- **AWS Polly Docs:** https://docs.aws.amazon.com/polly/
- **AWS S3 Docs:** https://docs.aws.amazon.com/s3/
- **Expo AV Docs:** https://docs.expo.dev/versions/latest/sdk/av/
- **Supabase RLS:** https://supabase.com/docs/guides/auth/row-level-security

---

## ✅ Success Checklist

Once setup is complete, verify:

- ✅ `audio_lessons` table exists in Supabase
- ✅ Backend logs show "PollyService initialized"
- ✅ Backend logs show "Audio endpoints registered"
- ✅ Can generate audio via API
- ✅ Audio file appears in S3 bucket
- ✅ Audio URL is publicly accessible
- ✅ Audio plays in app
- ✅ Play count increments
- ✅ Can delete audio

---

**You're all set!** 🎉

Refer to `AUDIO_LESSONS_SETUP_GUIDE.md` for detailed step-by-step instructions.

