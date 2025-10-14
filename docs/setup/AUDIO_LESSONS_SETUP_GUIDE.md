# 🎵 Audio Lessons Setup Guide

Complete step-by-step guide to implement AWS Polly audio lessons for UniLingo.

---

## 📋 Prerequisites

- AWS Account
- Supabase account with your database
- Node.js backend server
- React Native app

---

## STEP 1: Create Database Table

### 1.1 Run SQL in Supabase

1. Open your Supabase project
2. Go to **SQL Editor**
3. Run the SQL file: `create_audio_lessons_table.sql`
4. Verify table created:

```sql
SELECT * FROM audio_lessons LIMIT 1;
```

---

## STEP 2: Setup AWS Account

### 2.1 Create AWS Account
1. Go to https://aws.amazon.com/
2. Click "Create an AWS Account"
3. Follow the signup process

### 2.2 Create IAM User for Polly

1. Open AWS Console
2. Navigate to **IAM** (Identity and Access Management)
3. Click **Users** → **Create user**
4. Username: `unilingo-polly-user`
5. Select: **Programmatic access**
6. Click **Next: Permissions**

### 2.3 Attach Policies

1. Click **Attach policies directly**
2. Search and select these policies:
   - `AmazonPollyFullAccess`
   - `AmazonS3FullAccess`
3. Click **Next: Tags** (skip tags)
4. Click **Next: Review**
5. Click **Create user**

### 2.4 Save Credentials

**IMPORTANT:** Save these immediately (they're only shown once):
- Access key ID: `AKIA...`
- Secret access key: `wJalrXU...`

---

## STEP 3: Create S3 Bucket

### 3.1 Create Bucket

1. Navigate to **S3** in AWS Console
2. Click **Create bucket**
3. Bucket name: `unilingo-audio-lessons` (must be unique)
4. Region: Choose closest to your users (e.g., `us-east-1`)
5. **Block all public access**: UNCHECK (we need public read access for audio)
6. Click **Create bucket**

### 3.2 Configure Bucket Policy

1. Click on your bucket name
2. Go to **Permissions** tab
3. Scroll to **Bucket policy**
4. Click **Edit**
5. Paste this policy (replace `YOUR-BUCKET-NAME`):

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "PublicReadGetObject",
            "Effect": "Allow",
            "Principal": "*",
            "Action": "s3:GetObject",
            "Resource": "arn:aws:s3:::YOUR-BUCKET-NAME/audio-lessons/*"
        }
    ]
}
```

6. Click **Save changes**

### 3.3 Configure CORS

1. In bucket, go to **Permissions** tab
2. Scroll to **Cross-origin resource sharing (CORS)**
3. Click **Edit**
4. Paste this:

```json
[
    {
        "AllowedHeaders": ["*"],
        "AllowedMethods": ["GET", "HEAD"],
        "AllowedOrigins": ["*"],
        "ExposeHeaders": ["ETag"],
        "MaxAgeSeconds": 3000
    }
]
```

5. Click **Save changes**

---

## STEP 4: Configure Backend Environment

### 4.1 Update `.env` file

Add these variables to `backend/.env`:

```env
# AWS Configuration
AWS_ACCESS_KEY_ID=your_access_key_here
AWS_SECRET_ACCESS_KEY=your_secret_key_here
AWS_REGION=us-east-1
AWS_S3_BUCKET=unilingo-audio-lessons
```

**Replace** with your actual values from Step 2.4

### 4.2 Install AWS SDK

```bash
cd backend
npm install @aws-sdk/client-polly @aws-sdk/client-s3
```

### 4.3 Restart Backend Server

```bash
# Stop current server (Ctrl+C)
npm start
# or
npm run dev
```

You should see:
```
🎙️ PollyService initialized: { region: 'us-east-1', bucket: 'unilingo-audio-lessons', hasCredentials: true }
✅ Audio endpoints registered
```

---

## STEP 5: Test the Backend

### 5.1 Check Server Health

```bash
curl http://localhost:3001/api/health
```

Should return:
```json
{
  "status": "healthy",
  "timestamp": "2024-..."
}
```

### 5.2 Test Audio Generation (with Postman or curl)

First, create a regular lesson using the app (upload a PDF). Note the `lesson_id`.

Then test audio generation:

```bash
curl -X POST http://localhost:3001/api/audio/generate-lesson \
  -H "Content-Type: application/json" \
  -d '{
    "lessonId": "your-lesson-id-here",
    "userId": "your-user-id-here"
  }'
```

Expected response:
```json
{
  "success": true,
  "audioLesson": {
    "id": "...",
    "title": "...",
    "audio_url": "https://unilingo-audio-lessons.s3.amazonaws.com/...",
    "audio_duration": 120,
    ...
  },
  "generationTime": 5
}
```

---

## STEP 6: Update Frontend (AudioRecapScreen)

### 6.1 Open AudioRecapScreen.tsx

File: `src/screens/AudioRecapScreen.tsx`

### 6.2 Add Imports

Add these at the top:

```typescript
import { Audio } from 'expo-av';
import { AudioLessonService, AudioLesson } from '../lib/audioLessonService';
import { LessonService } from '../lib/lessonService';
import { useAuth } from '../contexts/AuthContext';
```

### 6.3 Update Component State

Replace the state section with:

```typescript
const { user } = useAuth();
const [isGenerating, setIsGenerating] = useState(false);
const [audioLessons, setAudioLessons] = useState<AudioLesson[]>([]);
const [sound, setSound] = useState<Audio.Sound | null>(null);
const [playingLessonId, setPlayingLessonId] = useState<string | null>(null);
const [userLessons, setUserLessons] = useState<any[]>([]);
```

### 6.4 Add Effect Hook

```typescript
useEffect(() => {
  loadData();
  
  return () => {
    // Cleanup audio on unmount
    if (sound) {
      sound.unloadAsync();
    }
  };
}, [user]);

const loadData = async () => {
  if (!user) return;
  
  // Load audio lessons
  const audio = await AudioLessonService.getUserAudioLessons(user.id);
  setAudioLessons(audio);
  
  // Load user's regular lessons (for conversion)
  const lessons = await LessonService.getUserLessonsWithProgress(user.id);
  setUserLessons(lessons);
};
```

### 6.5 Update handleCreateAudioLesson

```typescript
const handleCreateAudioLesson = async () => {
  if (!user) {
    Alert.alert('Error', 'You must be logged in');
    return;
  }

  if (userLessons.length === 0) {
    Alert.alert(
      'No Lessons Found',
      'Create a regular lesson first by uploading a PDF.',
      [
        { text: 'Create Lesson', onPress: () => navigation.navigate('CreateLesson' as never) }
      ]
    );
    return;
  }

  // Show lesson selection
  Alert.alert(
    'Select Lesson',
    'Choose a lesson to convert to audio:',
    [
      ...userLessons.slice(0, 5).map((lesson) => ({
        text: lesson.title,
        onPress: () => generateAudioForLesson(lesson.id)
      })),
      { text: 'Cancel', style: 'cancel' }
    ]
  );
};

const generateAudioForLesson = async (lessonId: string) => {
  if (!user) return;

  try {
    setIsGenerating(true);
    
    Alert.alert('Generating Audio', 'This will take about 30 seconds...');
    
    const result = await AudioLessonService.generateAudio(lessonId, user.id);
    
    if (result.success) {
      Alert.alert('Success!', 'Audio lesson generated successfully!');
      loadData(); // Refresh list
    } else {
      Alert.alert('Error', result.error || 'Failed to generate audio');
    }
  } catch (error) {
    Alert.alert('Error', 'Failed to generate audio');
  } finally {
    setIsGenerating(false);
  }
};
```

### 6.6 Update handlePlayAudioLesson

```typescript
const handlePlayAudioLesson = async (lesson: AudioLesson) => {
  try {
    // Stop currently playing audio
    if (sound && playingLessonId) {
      await sound.stopAsync();
      await sound.unloadAsync();
      setSound(null);
      
      // If clicking same lesson, just stop
      if (playingLessonId === lesson.id) {
        setPlayingLessonId(null);
        return;
      }
    }

    // Play new audio
    console.log('Playing audio:', lesson.audio_url);
    const { sound: newSound } = await Audio.Sound.createAsync(
      { uri: lesson.audio_url },
      { shouldPlay: true }
    );

    setSound(newSound);
    setPlayingLessonId(lesson.id);

    // Track playback
    AudioLessonService.trackPlayback(lesson.id, user?.id || '', 0);

    // Handle playback completion
    newSound.setOnPlaybackStatusUpdate((status) => {
      if (status.isLoaded && status.didJustFinish) {
        setPlayingLessonId(null);
        // Track listen time
        if (status.positionMillis) {
          AudioLessonService.trackPlayback(
            lesson.id,
            user?.id || '',
            Math.floor(status.positionMillis / 1000)
          );
        }
      }
    });

  } catch (error) {
    console.error('Error playing audio:', error);
    Alert.alert('Error', 'Failed to play audio lesson');
  }
};
```

### 6.7 Update handleDeleteAudioLesson

```typescript
const handleDeleteAudioLesson = (lessonId: string) => {
  Alert.alert(
    'Delete Audio',
    'This will delete the audio file but keep the lesson. Continue?',
    [
      { text: 'Cancel', style: 'cancel' },
      { 
        text: 'Delete', 
        style: 'destructive',
        onPress: async () => {
          if (!user) return;
          const success = await AudioLessonService.deleteAudioLesson(lessonId, user.id);
          if (success) {
            Alert.alert('Deleted', 'Audio lesson deleted successfully');
            loadData();
          } else {
            Alert.alert('Error', 'Failed to delete audio');
          }
        }
      }
    ]
  );
};
```

### 6.8 Update Render

Update the lesson list to use real data:

```typescript
{audioLessons.map((lesson) => (
  <TouchableOpacity
    key={lesson.id}
    style={styles.lessonCard}
    onPress={() => handlePlayAudioLesson(lesson)}
  >
    <View style={styles.lessonContent}>
      <View style={styles.lessonIcon}>
        <Ionicons 
          name={playingLessonId === lesson.id ? "pause-circle" : "play-circle"} 
          size={24} 
          color="#3b82f6" 
        />
      </View>
      <View style={styles.lessonInfo}>
        <Text style={styles.lessonTitle}>{lesson.title}</Text>
        <Text style={styles.lessonSubtitle}>
          {AudioLessonService.formatDuration(lesson.audio_duration)} • 
          Played {lesson.play_count} times
        </Text>
      </View>
    </View>
    <TouchableOpacity
      style={styles.deleteButton}
      onPress={(e) => {
        e.stopPropagation();
        handleDeleteAudioLesson(lesson.id);
      }}
    >
      <Ionicons name="trash-outline" size={20} color="#ef4444" />
    </TouchableOpacity>
  </TouchableOpacity>
))}
```

---

## STEP 7: Test End-to-End

### 7.1 Create a Regular Lesson

1. Open your app
2. Go to **Lessons** tab
3. Tap **Create Lesson**
4. Upload a PDF
5. Wait for lesson to be generated
6. Note the lesson name

### 7.2 Generate Audio

1. Go to **Lessons** tab
2. Tap **Audio Recap**
3. Tap **Upload PDF** button
4. Select the lesson you just created
5. Wait ~30 seconds
6. You should see success message

### 7.3 Play Audio

1. You should see your audio lesson in the list
2. Tap on it to play
3. Audio should start playing
4. Tap again to pause

---

## STEP 8: Verify Everything Works

### 8.1 Check Database

In Supabase SQL Editor:

```sql
SELECT 
  id, 
  title, 
  audio_duration, 
  status, 
  play_count 
FROM audio_lessons 
WHERE status = 'completed';
```

### 8.2 Check S3

1. Go to AWS Console → S3
2. Open your bucket
3. Navigate to `audio-lessons/`
4. You should see folders with user IDs
5. Inside, MP3 files should be present

### 8.3 Check Audio URL

Copy an audio URL from the database and paste into browser.
Audio should play or download.

---

## 🎉 SUCCESS!

You now have a fully functional audio lessons system!

---

## 📊 Monitor Usage

### AWS Costs

Check your AWS billing dashboard:
- **Polly**: ~$4 per 1 million characters
- **S3 Storage**: ~$0.023 per GB/month
- **S3 Requests**: Very cheap (~$0.0004 per 1,000 requests)

### Example Cost Calculation

- 100 lessons/month
- Average 1,000 words per lesson = 5,000 characters
- Total: 500,000 characters/month
- **Cost**: ~$2/month for Polly + ~$0.10/month for S3 = **~$2.10/month**

Very affordable! 🎉

---

## 🐛 Troubleshooting

### Audio Generation Fails

**Check:**
1. AWS credentials in `.env` are correct
2. IAM user has Polly and S3 permissions
3. S3 bucket name matches in `.env`
4. Backend logs show "PollyService initialized: { ... hasCredentials: true }"

**Test AWS Credentials:**
```bash
# In backend directory
node -e "console.log(process.env.AWS_ACCESS_KEY_ID)"
```

### Audio Won't Play

**Check:**
1. S3 bucket policy allows public read
2. CORS is configured correctly
3. Audio URL is accessible (paste in browser)
4. expo-av is installed in your app

### Database Errors

**Check:**
1. RLS policies are enabled
2. User is authenticated
3. `audio_lessons` table exists

---

## 🚀 Next Steps

1. **Add Progress Bar**: Show audio playback progress
2. **Download for Offline**: Save audio locally
3. **Playback Speed**: Add 0.5x, 1x, 1.5x, 2x speed options
4. **Background Audio**: Play audio while app is in background
5. **Auto-generate**: Generate audio automatically when lesson is created

---

## 📚 Resources

- [AWS Polly Documentation](https://docs.aws.amazon.com/polly/)
- [AWS S3 Documentation](https://docs.aws.amazon.com/s3/)
- [Expo AV Documentation](https://docs.expo.dev/versions/latest/sdk/av/)
- [Supabase RLS Guide](https://supabase.com/docs/guides/auth/row-level-security)

---

**Questions?** Check the troubleshooting section or review the implementation files:
- `backend/pollyService.js` - Core audio generation logic
- `backend/audioEndpoints.js` - API endpoints
- `src/lib/audioLessonService.ts` - Frontend service
- `src/screens/AudioRecapScreen.tsx` - UI component

