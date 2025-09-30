# 🎤 Pronunciation Assessment Feature

## Overview

The pronunciation assessment feature uses Azure Speech Services to provide real-time feedback on pronunciation accuracy. Users can record themselves speaking words or sentences and receive detailed scores and suggestions.

## Features

✅ **Real-time pronunciation scoring** (0-100 scale)  
✅ **Detailed feedback** on accuracy, fluency, and completeness  
✅ **Word-level analysis** with phoneme-level scoring  
✅ **Natural language feedback** with improvement suggestions  
✅ **Audio recording** with automatic stop  
✅ **Visual score display** with color-coded results

## How to Use

### 1. **Basic Usage in Any Component**

```tsx
import PronunciationCheck from '../components/PronunciationCheck';

// In your component
<PronunciationCheck
  word="Hello"
  onComplete={(result) => {
    console.log('Pronunciation score:', result.assessment?.pronunciationScore);
  }}
/>
```

### 2. **With Full Sentence**

```tsx
<PronunciationCheck
  word="Hello"
  sentence="Hello, how are you today?"
  maxRecordingDuration={8000} // 8 seconds
  onComplete={(result) => {
    if (result.success && result.assessment) {
      // Handle successful assessment
      const score = result.assessment.pronunciationScore;
      if (score >= 75) {
        // Award points, unlock next lesson, etc.
      }
    }
  }}
/>
```

### 3. **Integration Example: Speak Lesson**

```tsx
import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import PronunciationCheck from '../components/PronunciationCheck';

interface Word {
  english_term: string;
  example_sentence?: string;
}

export default function SpeakLessonScreen({ words }: { words: Word[] }) {
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [completedWords, setCompletedWords] = useState<number[]>([]);

  const currentWord = words[currentWordIndex];

  const handlePronunciationComplete = (result) => {
    if (result.success && result.assessment) {
      const score = result.assessment.pronunciationScore;
      
      if (score >= 60) {
        // Mark as completed
        setCompletedWords([...completedWords, currentWordIndex]);
        
        // Move to next word
        if (currentWordIndex < words.length - 1) {
          setCurrentWordIndex(currentWordIndex + 1);
        } else {
          // Lesson complete!
          console.log('Lesson complete!');
        }
      }
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.progress}>
        Word {currentWordIndex + 1} of {words.length}
      </Text>
      
      <PronunciationCheck
        word={currentWord.english_term}
        sentence={currentWord.example_sentence}
        onComplete={handlePronunciationComplete}
      />
      
      <Text style={styles.completed}>
        Completed: {completedWords.length}/{words.length}
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff',
  },
  progress: {
    fontSize: 16,
    color: '#64748b',
    marginBottom: 16,
  },
  completed: {
    fontSize: 14,
    color: '#10b981',
    marginTop: 16,
    textAlign: 'center',
  },
});
```

## API Response Structure

### Success Response

```typescript
{
  success: true,
  assessment: {
    pronunciationScore: 85,      // Overall score (0-100)
    accuracyScore: 88,            // How accurate the sounds are
    fluencyScore: 82,             // How naturally it flows
    completenessScore: 100,       // Did they say all words
    recognizedText: "hello",      // What was recognized
    referenceText: "hello",       // What they should say
    passed: true,                 // Score >= 60
    words: [
      {
        word: "hello",
        accuracyScore: 88,
        errorType: "None",
        phonemes: [
          { phoneme: "h", accuracyScore: 95 },
          { phoneme: "ɛ", accuracyScore: 85 },
          { phoneme: "l", accuracyScore: 90 },
          { phoneme: "oʊ", accuracyScore: 82 }
        ]
      }
    ]
  },
  feedback: {
    overall: "Good job! Your pronunciation is clear. 👍",
    accuracy: "Most sounds are pronounced correctly.",
    fluency: "Good rhythm and flow.",
    wordIssues: []
  }
}
```

### Error Response

```typescript
{
  success: false,
  error: "No speech recognized. Please speak clearly."
}
```

## Score Interpretation

| Score | Meaning | Emoji | Action |
|-------|---------|-------|--------|
| 90-100 | Excellent | 🌟 | Award bonus points |
| 75-89 | Good | 👍 | Mark as complete |
| 60-74 | Fair | 💪 | Mark as complete, suggest practice |
| 0-59 | Needs work | 📚 | Allow retry, show tips |

## Backend Configuration

### Environment Variables

Already configured in Railway and `.env`:

```bash
AZURE_SPEECH_KEY=your_key_here
AZURE_SPEECH_REGION=uksouth
```

### API Endpoint

```
POST /api/pronunciation-assess
Content-Type: multipart/form-data

Body:
- audio: WAV file (max 5MB)
- referenceText: string (what should be pronounced)
```

## Cost Tracking

- **Free Tier**: 5 hours/month = ~9,000 assessments (2 sec avg)
- **Standard Tier**: ~$1 per hour of audio processed
- **Current Setup**: Free tier with automatic billing to Standard if exceeded

### Estimated Monthly Costs

| Users | Checks/Day | Duration | Monthly Cost |
|-------|-----------|----------|--------------|
| 100 | 5 | 2 sec | ~$8 |
| 500 | 5 | 2 sec | ~$42 |
| 1000 | 10 | 2 sec | ~$167 |

## Testing

### Manual Test

1. Open any screen with `<PronunciationCheck />`
2. Tap "Tap to Record"
3. Say the word clearly
4. Wait for auto-stop or tap "Stop"
5. View results

### Quick Test Component

```tsx
// Add to any existing screen for testing
<PronunciationCheck
  word="Test"
  sentence="This is a test"
  onComplete={(result) => {
    console.log('Test result:', result);
  }}
/>
```

## Integration Checklist

- [x] Backend: Azure Speech SDK installed
- [x] Backend: Pronunciation service created
- [x] Backend: API endpoint added
- [x] Frontend: Audio recording permissions configured
- [x] Frontend: Pronunciation service created
- [x] Frontend: UI component created
- [ ] Frontend: Integrate into Speak lessons
- [ ] Frontend: Add to relevant screens
- [ ] Testing: Manual testing complete
- [ ] Testing: User acceptance testing

## Next Steps

1. **Unlock Speak Lessons** - Remove lock from Speak lesson type in topic groups
2. **Add to Existing Screens** - Integrate pronunciation check where appropriate
3. **Track Usage** - Monitor Azure usage to stay within limits
4. **Gather Feedback** - Get user feedback on pronunciation accuracy
5. **Add Gamification** - Award XP, badges for pronunciation achievements

## Troubleshooting

### "Microphone permission required"
- Ensure app has microphone permissions enabled
- Check device settings

### "No speech recognized"
- Speak louder and clearer
- Check microphone is not muted
- Reduce background noise

### "Assessment failed"
- Check backend logs for Azure errors
- Verify AZURE_SPEECH_KEY and AZURE_SPEECH_REGION are set
- Check internet connection

### High costs
- Reduce maxRecordingDuration (default 5 sec)
- Batch multiple words into sentences
- Implement daily user limits (e.g., max 10 checks/day)

## Support

- **Azure Speech Docs**: https://learn.microsoft.com/en-us/azure/ai-services/speech-service/
- **Pronunciation Assessment**: https://learn.microsoft.com/en-us/azure/ai-services/speech-service/how-to-pronunciation-assessment
