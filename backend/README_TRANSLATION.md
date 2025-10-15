# Lesson Script Translation

This directory contains scripts to translate English lesson scripts to French using OpenAI API.

## Files

- `translateLessonScripts.js` - Main translation script
- `checkTranslationProgress.js` - Progress monitoring script
- `README_TRANSLATION.md` - This documentation

## Usage

### Check Translation Progress
```bash
node checkTranslationProgress.js
```

### Test Translation (Single Record)
```bash
node translateLessonScripts.js test
node translateLessonScripts.js test 123  # Test specific record ID
```

### Get Statistics
```bash
node translateLessonScripts.js stats
```

### Run Full Translation
```bash
node translateLessonScripts.js translate
```

## Translation Process

The translation script:

1. **Preserves Format**: Maintains the exact "A:" "B:" "/" format required by the frontend
2. **Rate Limiting**: Processes records in batches of 5 with 2-second delays to respect OpenAI API limits
3. **Error Handling**: Continues processing even if individual records fail
4. **Validation**: Ensures the translated format matches the original structure
5. **Progress Tracking**: Provides detailed logging of the translation process

## Example Translation

**English:**
```
A: Hi! How are you today? / B: Hello, I'm good, thank you. / A: Good morning, it's nice to see some sun. / B: Yes, it's a good day to walk.
```

**French:**
```
A: Salut ! Comment ça va aujourd'hui ? / B: Bonjour, ça va bien, merci. / A: Bonjour, c'est agréable de voir un peu de soleil. / B: Oui, c'est une belle journée pour se promener.
```

## Monitoring Progress

The translation process runs in the background and can take 30-60 minutes to complete all 427 records. You can monitor progress using:

```bash
# Check current progress
node checkTranslationProgress.js

# Or use the stats command
node translateLessonScripts.js stats
```

## Cost Estimation

- **Records to translate**: ~427
- **Estimated cost**: $2-5 (depending on script lengths)
- **Processing time**: 30-60 minutes
- **Rate limiting**: 5 records per batch, 2-second delays

## Troubleshooting

If the translation process fails:

1. Check OpenAI API key is set in `.env` file
2. Verify database connection
3. Check for rate limiting errors
4. Restart the translation process (it will skip already translated records)

## Next Steps

After French translation is complete, you can extend this script to translate to other languages:

- German (`german_lesson_script`)
- Spanish (`spanish_lesson_script`)
- Chinese (Simplified) (`chinese_simplified_lesson_script`)
- Hindi (`hindi_lesson_script`)

Simply modify the script to target different columns and update the language in the translation prompt.
