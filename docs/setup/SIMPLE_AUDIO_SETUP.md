# 🎵 Simple Audio Lessons - Setup Guide

## ✅ What's Done

- ✅ Database table created (`audio_lessons`)
- ✅ Backend service created (`simplePollyService.js`)
- ✅ Backend API endpoints created (`simpleAudioEndpoints.js`)
- ✅ Backend routes registered in `server.js`
- ✅ Frontend service created (`simpleAudioLessonService.ts`)

---

## 📋 What You Need to Do (3 Steps)

### STEP 1: Install AWS SDK (2 minutes)

```bash
cd backend
npm install @aws-sdk/client-polly @aws-sdk/client-s3
```

---

### STEP 2: Add AWS Credentials (5 minutes)

#### A. Get AWS Credentials

1. Go to [AWS Console](https://aws.amazon.com/)
2. Sign in or create account
3. Go to **IAM** → **Users** → **Create User**
4. Name: `unilingo-audio`
5. Attach policies:
   - `AmazonPollyFullAccess`
   - `AmazonS3FullAccess`
6. Save your credentials:
   - Access Key ID: `AKIA...`
   - Secret Access Key: `wJalr...`

#### B. Create S3 Bucket

1. AWS Console → **S3** → **Create Bucket**
2. Name: `unilingo-audio-lessons` (must be globally unique)
3. Region: `us-east-1` (or your preferred region)
4. **Uncheck** "Block all public access"
5. Create bucket

#### C. Add Bucket Policy

1. Open your bucket → **Permissions** → **Bucket Policy**
2. Add this policy (replace `YOUR-BUCKET-NAME`):

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Principal": "*",
            "Action": "s3:GetObject",
            "Resource": "arn:aws:s3:::YOUR-BUCKET-NAME/audio-lessons/*"
        }
    ]
}
```

#### D. Update `.env` File

Add to `backend/.env`:

```env
AWS_ACCESS_KEY_ID=AKIA...your-key-here
AWS_SECRET_ACCESS_KEY=wJalr...your-secret-here
AWS_REGION=us-east-1
AWS_S3_BUCKET=unilingo-audio-lessons
```

---

### STEP 3: Restart Backend (1 minute)

```bash
cd backend
npm start
```

Look for:
```
🎙️ SimplePollyService initialized: { ... hasCredentials: true }
✅ Simple audio endpoints registered
```

---

## 🧪 Test It!

### Test 1: Backend Health

```bash
curl http://localhost:3001/api/health
```

### Test 2: Create Audio Lesson

```bash
curl -X POST http://localhost:3001/api/audio/create \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Lesson",
    "scriptText": "Hello, this is a test audio lesson. Welcome to learning!",
    "userId": "YOUR_USER_ID"
  }'
```

Should return:
```json
{
  "success": true,
  "audioLesson": {
    "id": "...",
    "title": "Test Lesson",
    "audio_url": "https://s3.amazonaws.com/...",
    "audio_duration": 6,
    "status": "not_started"
  }
}
```

### Test 3: Play the Audio

Copy the `audio_url` from the response and paste it in your browser. The audio should play!

---

## 📱 Frontend Integration

### Using in Your App

```typescript
import { SimpleAudioLessonService } from '../lib/simpleAudioLessonService';
import { Audio } from 'expo-av';

// 1. Create audio lesson from PDF text
const result = await SimpleAudioLessonService.createAudioLesson(
  'My Lesson Title',
  pdfTextContent, // The extracted text from PDF
  user.id
);

// 2. Get user's audio lessons
const lessons = await SimpleAudioLessonService.getUserAudioLessons(user.id);

// 3. Play audio
const { sound } = await Audio.Sound.createAsync(
  { uri: lesson.audio_url },
  { shouldPlay: true }
);

// 4. Track playback
await SimpleAudioLessonService.trackPlayback(lesson.id, user.id);

// 5. Mark as completed
await SimpleAudioLessonService.markAsCompleted(lesson.id, user.id);

// 6. Delete
await SimpleAudioLessonService.deleteAudioLesson(lesson.id, user.id);

// 7. Get stats
const stats = await SimpleAudioLessonService.getStats(user.id);
```

---

## 📊 API Endpoints Available

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/audio/create` | Create audio from text |
| GET | `/api/audio/lessons/:userId` | Get user's lessons |
| GET | `/api/audio/lesson/:id` | Get specific lesson |
| PUT | `/api/audio/lesson/:id/play` | Track playback |
| PUT | `/api/audio/lesson/:id/complete` | Mark completed |
| DELETE | `/api/audio/lesson/:id` | Delete lesson |
| GET | `/api/audio/stats/:userId` | Get user stats |

---

## 🎯 Complete Flow

```
1. User uploads PDF
   ↓
2. Extract text from PDF (existing functionality)
   ↓
3. Call SimpleAudioLessonService.createAudioLesson(title, text, userId)
   ↓
4. Backend:
   - Creates database record
   - Generates audio with AWS Polly
   - Uploads to S3
   - Updates database with audio URL
   ↓
5. Frontend displays audio lesson
   ↓
6. User plays audio (status → in_progress)
   ↓
7. User finishes (status → completed)
```

---

## 💰 Cost

**Per 1000 lessons:**
- Average 5,000 characters per lesson
- Total: 5M characters
- Polly cost: $20
- S3 storage: $0.02

**Cost per lesson: ~$0.02**

**Free tier (first 12 months):**
- 5M characters/month free (Polly)
- 5GB storage free (S3)

So basically **FREE for development!** 🎉

---

## 🐛 Troubleshooting

| Problem | Solution |
|---------|----------|
| "AWS credentials not configured" | Check `.env` has AWS keys |
| "Polly generation failed" | Verify IAM user has Polly permissions |
| "S3 upload failed" | Check bucket name matches `.env` |
| "Audio won't play" | Verify S3 bucket policy allows public read |
| Backend crashes | Run `npm install` in backend folder |

---

## ✨ Next Steps

1. **Install AWS SDK** ✓
2. **Add AWS credentials** ✓
3. **Test backend** ✓
4. **Integrate in AudioRecapScreen:**
   - Add PDF upload
   - Extract text
   - Call `createAudioLesson()`
   - Display lessons
   - Add play button
   - Track completion

---

## 📝 Example Integration in AudioRecapScreen

```typescript
import { SimpleAudioLessonService } from '../lib/simpleAudioLessonService';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { Audio } from 'expo-av';

// Handle PDF upload
const handleCreateAudioLesson = async () => {
  // 1. Pick PDF
  const result = await DocumentPicker.getDocumentAsync({
    type: 'application/pdf'
  });
  
  if (result.canceled) return;
  
  const file = result.assets[0];
  
  // 2. Extract text (your existing function)
  const text = await extractTextFromPDF(file.uri);
  
  // 3. Create audio lesson
  const audioResult = await SimpleAudioLessonService.createAudioLesson(
    file.name.replace('.pdf', ''),
    text,
    user.id
  );
  
  if (audioResult.success) {
    Alert.alert('Success!', 'Audio lesson created');
    loadAudioLessons(); // Refresh list
  }
};

// Play audio
const handlePlay = async (lesson) => {
  const { sound } = await Audio.Sound.createAsync(
    { uri: lesson.audio_url },
    { shouldPlay: true }
  );
  
  // Track playback
  await SimpleAudioLessonService.trackPlayback(lesson.id, user.id);
  
  // When finished
  sound.setOnPlaybackStatusUpdate((status) => {
    if (status.didJustFinish) {
      SimpleAudioLessonService.markAsCompleted(lesson.id, user.id);
    }
  });
};
```

---

**That's it!** You now have a complete audio lesson system. 🚀

Just add AWS credentials and you're ready to go!

