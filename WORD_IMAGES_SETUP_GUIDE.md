# Word Images Setup Guide

This guide will help you populate word images from the Supabase General_Lessons bucket into your vocabulary exercises.

## Overview

The words exercise in the General Lessons on the dashboard can now display real images from the Supabase Storage (General_Lessons bucket) instead of placeholders.

## Step 1: Add the Image URL Column to Database

1. Open your Supabase dashboard
2. Navigate to the SQL Editor
3. Run the following SQL script:

```sql
-- File: add_image_url_to_subject_words.sql
ALTER TABLE subject_words 
ADD COLUMN IF NOT EXISTS image_url TEXT;

COMMENT ON COLUMN subject_words.image_url IS 'URL to word image stored in Supabase Storage (General_Lessons bucket)';

CREATE INDEX IF NOT EXISTS idx_subject_words_image_url ON subject_words(image_url) WHERE image_url IS NOT NULL;
```

## Step 2: Upload Images to Supabase Storage

1. Go to Supabase Dashboard > Storage
2. Open the `General_Lessons` bucket (or create it if it doesn't exist)
3. Upload images for your vocabulary words

### Image Naming Convention

Name your images based on the English word. For example:
- `hello.jpg` or `hello.png` for the word "hello"
- `goodbye.jpg` for the word "goodbye"
- `good_morning.jpg` for "good morning" (spaces replaced with underscores)

The system will automatically match:
- Exact filename matches (e.g., `hello.jpg` for word "hello")
- Files starting with the word (e.g., `hello_1.jpg` for word "hello")
- Files containing the word (e.g., `saying_hello.jpg` for word "hello")

### Supported Image Formats
- JPG/JPEG
- PNG
- WebP
- GIF

## Step 3: Populate Image URLs in Database

There are two ways to populate the image URLs:

### Option A: Using the WordImageService (Recommended)

The WordImageService will automatically fetch images from the General_Lessons bucket and match them to vocabulary words.

You can call this from your app or create a one-time script:

```typescript
import { WordImageService } from './src/lib/wordImageService';

// Update all words with their image URLs
const updatedCount = await WordImageService.updateWordImagesInDatabase();
console.log(`Updated ${updatedCount} words with images`);

// Or update for a specific subject
const subjectUpdatedCount = await WordImageService.updateWordImagesInDatabase('Asking About Location');
console.log(`Updated ${subjectUpdatedCount} words for subject`);
```

### Option B: Manual SQL Update

If you prefer to manually set image URLs:

```sql
UPDATE subject_words 
SET image_url = 'https://your-supabase-url.supabase.co/storage/v1/object/public/General_Lessons/hello.jpg'
WHERE english_translation = 'hello';
```

## Step 4: Verify Images are Working

1. Run your app
2. Navigate to Dashboard > General Lessons > Words Exercise
3. Start a lesson
4. You should see real images instead of placeholder icons

## How It Works

### Data Flow

1. **Database**: The `subject_words` table now has an `image_url` column
2. **Service Layer**: `SubjectLessonService` fetches vocabulary with image URLs
3. **Adapter**: `UnitDataAdapter` passes image URLs through to the UI
4. **Screen**: `UnitWordsScreen` displays images in the 2x2 grid for English→French questions

### Image Matching Algorithm

The `WordImageService` uses the following logic to match images to words:

1. Normalizes the word (lowercase, trim spaces, replace spaces with underscores)
2. Lists all files in the General_Lessons bucket
3. Finds files that:
   - Exactly match the normalized word
   - Start with the normalized word
   - Contain the normalized word
4. Returns the public URL for the matched image

## Troubleshooting

### Images Not Showing

1. **Check Supabase Storage Permissions**
   - Make sure the General_Lessons bucket is set to "Public"
   - Go to Storage > General_Lessons > Settings > Make public

2. **Verify Image URLs in Database**
   ```sql
   SELECT id, english_translation, image_url 
   FROM subject_words 
   WHERE image_url IS NOT NULL;
   ```

3. **Check Image Naming**
   - Ensure image filenames match or contain the word
   - Use lowercase and underscores instead of spaces

4. **Check Bucket Name**
   - Verify the bucket is named exactly `General_Lessons` (case-sensitive)

### Debug Image Matching

Use the debug function to list all available images:

```typescript
import { WordImageService } from './src/lib/wordImageService';

const images = await WordImageService.listAllImages();
console.log('Available images:', images);
```

## Best Practices

1. **Image Quality**
   - Use high-quality images (at least 800x600 pixels)
   - Optimize images before uploading (compress to reduce file size)
   - Use consistent aspect ratios (preferably 4:3 or 16:9)

2. **Image Naming**
   - Use descriptive, word-based names
   - Keep filenames short and simple
   - Use lowercase for consistency

3. **Batch Upload**
   - Upload multiple images at once to save time
   - Organize images in folders if needed (the service will search recursively)

4. **Performance**
   - The service caches image URLs for better performance
   - Images are loaded lazily as users progress through exercises

## Future Enhancements

Potential improvements for the image system:

- [ ] Automatic image generation using AI (DALL-E, Stable Diffusion)
- [ ] Image upload directly from the app
- [ ] Multiple images per word with carousel
- [ ] Image quality indicators
- [ ] Offline image caching
- [ ] Image search/selection interface in admin panel

## Support

If you encounter issues:
1. Check the browser console for error messages
2. Verify Supabase Storage is accessible
3. Ensure database migrations have been run
4. Check that the WordImageService is properly initialized

