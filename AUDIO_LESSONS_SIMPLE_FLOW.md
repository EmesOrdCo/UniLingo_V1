# 🎵 Audio Lessons: Simple Flow

## The Complete System (Super Simple Explanation)

```
┌─────────────────────────────────────────────────────────────┐
│                     USER UPLOADS PDF                         │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│              TEXT EXTRACTION (Already Works!)                │
│  • Zapier webhook extracts text from PDF                     │
│  • Returns plain text content                                │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│            KEYWORD EXTRACTION (Already Works!)               │
│  • OpenAI analyzes text                                      │
│  • Extracts vocabulary terms                                 │
│  • Creates definitions & translations                        │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│         SCRIPT GENERATION & SAVING (Already Works!)          │
│  • Organizes vocabulary into lesson                          │
│  • Saves to esp_lessons table                                │
│  • Saves vocabulary to lesson_vocabulary table               │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
        ╔═════════════════════════════════════════╗
        ║    🆕 AWS POLLY TEXT-TO-SPEECH          ║
        ║    (This is what we're adding!)         ║
        ╚═════════════╤═══════════════════════════╝
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│                   FORMAT AUDIO SCRIPT                        │
│  • Take lesson vocabulary                                    │
│  • Create natural-sounding script:                           │
│    "Term 1: Apple. Definition: A red fruit..."               │
│  • Add pauses and formatting                                 │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│               GENERATE AUDIO WITH AWS POLLY                  │
│  • Send script to AWS Polly                                  │
│  • Polly converts text → speech                              │
│  • Returns MP3 audio file                                    │
│  • Uses "Joanna" voice (neural engine)                       │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│                 UPLOAD AUDIO TO S3                           │
│  • Upload MP3 to S3 bucket                                   │
│  • Make it publicly accessible                               │
│  • Get permanent URL                                         │
│  • Example: https://bucket.s3.aws.com/audio.mp3             │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│              SAVE AUDIO INFO TO DATABASE                     │
│  • Save to audio_lessons table                               │
│  • Store: audio_url, duration, title, etc.                   │
│  • Link to original lesson                                   │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│                  DISPLAY IN APP                              │
│  • User sees audio lesson in list                            │
│  • Tap to play                                               │
│  • Audio streams from S3                                     │
│  • Can pause, replay, delete                                 │
└─────────────────────────────────────────────────────────────┘
```

---

## What You Need to Do (Step by Step)

### ✅ Step 1: Database (5 minutes)
```bash
# Run this SQL file in Supabase:
create_audio_lessons_table.sql
```

**Creates:** `audio_lessons` table to store audio info

---

### ✅ Step 2: AWS Setup (15 minutes)

**A. Create AWS Account** (if you don't have one)
- Go to aws.amazon.com
- Sign up for free tier

**B. Create IAM User**
- AWS Console → IAM → Users → Create User
- Name: `unilingo-polly-user`
- Attach policies: `AmazonPollyFullAccess` + `AmazonS3FullAccess`
- **Save credentials:**
  - Access Key ID: `AKIA...`
  - Secret Access Key: `wJalr...`

**C. Create S3 Bucket**
- AWS Console → S3 → Create Bucket
- Name: `unilingo-audio-lessons` (must be unique)
- Region: `us-east-1` (or closest to you)
- Uncheck "Block all public access"
- Add bucket policy (from setup guide)

---

### ✅ Step 3: Backend Setup (5 minutes)

**A. Install AWS SDK**
```bash
cd backend
npm install @aws-sdk/client-polly @aws-sdk/client-s3
```

**B. Add to `.env`**
```env
AWS_ACCESS_KEY_ID=your_key_here
AWS_SECRET_ACCESS_KEY=your_secret_here
AWS_REGION=us-east-1
AWS_S3_BUCKET=unilingo-audio-lessons
```

**C. Files Already Created:**
- ✅ `backend/pollyService.js` - Core audio generation
- ✅ `backend/audioEndpoints.js` - API routes
- ✅ `backend/server.js` - Routes registered

**D. Restart Server**
```bash
npm start
```

Look for:
```
🎙️ PollyService initialized
✅ Audio endpoints registered
```

---

### ✅ Step 4: Frontend Setup (10 minutes)

**A. File Already Created:**
- ✅ `src/lib/audioLessonService.ts`

**B. Update AudioRecapScreen.tsx**
- Follow instructions in `AUDIO_LESSONS_SETUP_GUIDE.md`
- Or I can make these changes for you!

---

### ✅ Step 5: Test (5 minutes)

1. **Create a regular lesson** (upload PDF as usual)
2. **Generate audio:**
   - Go to Lessons → Audio Recap
   - Tap "Upload PDF" → Select your lesson
   - Wait ~30 seconds
3. **Play audio:**
   - Tap on the audio lesson
   - Should play automatically!

---

## Cost Estimate

Very affordable! 💰

- **100 audio lessons/month**
- **Average 5,000 characters per lesson**
- **Total: 500,000 characters/month**

**Monthly Cost:**
- AWS Polly: ~$2.00
- AWS S3: ~$0.10
- **Total: ~$2.10/month** 🎉

---

## Files You Have

✅ Already created for you:
```
create_audio_lessons_table.sql      ← Database schema
backend/pollyService.js              ← AWS Polly integration
backend/audioEndpoints.js            ← API endpoints
backend/server.js                    ← Routes registered
src/lib/audioLessonService.ts        ← Frontend service
AUDIO_LESSONS_SETUP_GUIDE.md        ← Detailed instructions
AUDIO_LESSONS_SIMPLE_FLOW.md         ← This file
```

📝 Need to update:
```
backend/.env                         ← Add AWS credentials
src/screens/AudioRecapScreen.tsx     ← Update UI logic
```

---

## Quick Start Commands

```bash
# 1. Install AWS SDK
cd backend
npm install @aws-sdk/client-polly @aws-sdk/client-s3

# 2. Add AWS credentials to backend/.env
# (Open file and paste your keys)

# 3. Restart backend
npm start

# 4. Run SQL in Supabase
# (Copy/paste create_audio_lessons_table.sql)

# 5. Update AudioRecapScreen.tsx
# (Follow setup guide or ask me to do it!)

# 6. Test in app!
```

---

## That's It!

The system is **90% done**. You just need to:
1. ⏰ Add AWS credentials (2 min)
2. ⏰ Run SQL file (1 min)
3. ⏰ Update AudioRecapScreen (10 min)

**Total time: ~15 minutes** (plus AWS account setup if needed)

---

## Need Help?

**Option 1:** Follow the detailed guide in `AUDIO_LESSONS_SETUP_GUIDE.md`

**Option 2:** Ask me to:
- Create AWS account with you
- Update AudioRecapScreen for you
- Test the entire flow with you
- Troubleshoot any issues

**Option 3:** Test what we have so far:
```bash
# Test if backend is ready
curl -X POST http://localhost:3001/api/audio/generate-lesson \
  -H "Content-Type: application/json" \
  -d '{"lessonId":"test","userId":"test"}'
```

---

## What Makes This Simple?

1. **Database already has lessons** ✅
2. **PDF processing already works** ✅
3. **OpenAI keyword extraction already works** ✅
4. **Just adding audio generation** 🆕
5. **Most code already written** ✅

You're literally just:
- Plugging in AWS credentials
- Running one SQL file
- Updating one React component

That's it! 🎉

