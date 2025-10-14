# Word Images - Quick Start Checklist

Follow this checklist to get word images working in 5 minutes! ⚡

## ✅ Quick Start Steps

### Step 1: Database Migration (2 minutes)
- [ ] Open Supabase Dashboard
- [ ] Go to SQL Editor
- [ ] Copy and paste from `add_image_url_to_subject_words.sql`
- [ ] Click "Run"
- [ ] Wait for success message

### Step 2: Upload Images to Storage (2 minutes)
- [ ] Go to Supabase Dashboard > Storage
- [ ] Find or create `General_Lessons` bucket
- [ ] Click bucket settings and make it **Public**
- [ ] Upload your images (JPG, PNG, WebP, GIF)
- [ ] Name images after the words (e.g., `hello.jpg`, `goodbye.png`)

**Quick Tip:** Download a few sample images first to test:
- hello.jpg
- goodbye.jpg
- thanks.jpg
- please.jpg

### Step 3: Populate Image URLs (1 minute)

Run ONE of these options:

**Option A - Automatic (Recommended):**
```bash
npx ts-node src/scripts/populateWordImages.ts
```

**Option B - In Your App:**
Add this to a test screen and run once:
```typescript
import { WordImageService } from './src/lib/wordImageService';

// Run this once
WordImageService.updateWordImagesInDatabase()
  .then(count => console.log(`✅ Updated ${count} words!`));
```

**Option C - SQL (Manual):**
```sql
-- Update specific words manually
UPDATE subject_words 
SET image_url = 'https://[YOUR_SUPABASE_URL]/storage/v1/object/public/General_Lessons/hello.jpg'
WHERE english_translation = 'hello';
```

### Step 4: Test in App (< 1 minute)
- [ ] Run your app
- [ ] Navigate to Dashboard
- [ ] Click on any General Lesson subject
- [ ] Start the Words exercise
- [ ] Verify images appear in the 2x2 grid! 🎉

## 🐛 Quick Troubleshooting

**No images showing?**
1. Check bucket is Public: `Storage > General_Lessons > Settings > Public`
2. Verify images uploaded: `Storage > General_Lessons` (should see your files)
3. Check database: Run `SELECT COUNT(*) FROM subject_words WHERE image_url IS NOT NULL;`

**Wrong images showing?**
- Image filenames should match the English word
- Use lowercase: `hello.jpg` not `Hello.jpg`
- Replace spaces with underscores: `good_morning.jpg`

**Images loading slowly?**
- Compress images before uploading
- Keep images under 500KB
- Use WebP format for better compression

## 🎯 Success Checklist

After completing all steps, you should have:
- [x] Database column added
- [x] Images uploaded to Storage
- [x] Image URLs populated in database
- [x] Images displaying in app

## 📸 Image Requirements

### Naming Convention
✅ **Good:** `hello.jpg`, `goodbye.png`, `thank_you.webp`
❌ **Bad:** `IMG_001.jpg`, `photo.png`, `image1.jpg`

### File Requirements
- **Format:** JPG, PNG, WebP, or GIF
- **Size:** Under 500KB (compress if larger)
- **Dimensions:** 800x600 or similar (4:3 aspect ratio recommended)
- **Quality:** Clear, high-resolution images

## 🚀 Next Steps

Once images are working:
1. **Add more images:** Upload images for all your vocabulary words
2. **Organize images:** Use consistent naming and quality
3. **Monitor usage:** Check Supabase Storage usage regularly
4. **User feedback:** Ask users what they think of the images!

## 📚 Full Documentation

For detailed information, see:
- `WORD_IMAGES_SETUP_GUIDE.md` - Complete setup guide
- `WORD_IMAGES_IMPLEMENTATION_SUMMARY.md` - Technical details
- `src/lib/wordImageService.ts` - Service code and comments

## 🆘 Need Help?

If you encounter issues:
1. Check the console for error messages
2. Verify Supabase credentials are correct
3. Ensure all migrations have been run
4. Review the troubleshooting section in `WORD_IMAGES_SETUP_GUIDE.md`

---

**Estimated Time:** 5-10 minutes total
**Difficulty:** Easy ⭐⭐☆☆☆

🎉 **You're all set! Enjoy teaching with visual vocabulary!**

