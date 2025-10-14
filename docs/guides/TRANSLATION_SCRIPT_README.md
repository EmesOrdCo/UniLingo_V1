# 🌍 Subject Words Translation Script

This script automatically translates all English words in the `subject_words` table to 5 languages using OpenAI.

## 📋 **What It Does**

- Fetches all words from `subject_words` table that need translation
- Uses OpenAI GPT-4o-mini to translate each word to:
  - 🇫🇷 French
  - 🇪🇸 Spanish
  - 🇩🇪 German
  - 🇨🇳 Mandarin Chinese (Simplified)
  - 🇮🇳 Hindi
- Saves translations back to the database
- Shows progress and handles errors gracefully

## 🚀 **Setup**

### **1. Install Dependencies**

```bash
npm install openai @supabase/supabase-js dotenv
```

### **2. Configure Environment Variables**

Create a `.env` file in the root directory:

```env
OPENAI_API_KEY=your_openai_api_key_here
SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

**Where to find these:**
- **OpenAI API Key**: https://platform.openai.com/api-keys
- **Supabase URL**: Your Supabase project settings → API
- **Supabase Service Role Key**: Your Supabase project settings → API → Service Role Key (⚠️ Keep this secret!)

### **3. Run the Database Migration**

First, add the translation columns to your database:

```bash
# Run this SQL in Supabase SQL Editor:
# Copy contents of add_subject_words_translations_simple.sql
```

## ▶️ **Run the Script**

```bash
node translate_subject_words.js
```

## 📊 **What You'll See**

```
🌍 Starting translation process...

📚 Found 150 words to translate

[1/150] Translating: "hello" (Greetings)
  Translating to French...
  Translating to Spanish...
  Translating to German...
  Translating to Mandarin Chinese (Simplified)...
  Translating to Hindi...
  ✅ Translations saved: {
    french_translation: 'bonjour',
    spanish_translation: 'hola',
    german_translation: 'hallo',
    mandarin_translation: '你好',
    hindi_translation: 'नमस्ते'
  }

[2/150] Translating: "computer" (Technology)
  ...

📊 Progress: 10/150 words processed

...

==================================================
🎉 Translation complete!
✅ Successfully translated: 150 words
❌ Errors: 0 words
==================================================
```

## 🔧 **How It Works**

1. **Fetches words**: Gets all words that are missing any translation
2. **Translates**: Uses OpenAI to translate to each language
3. **Rate limiting**: Adds 200ms delay between translations
4. **Updates database**: Saves all translations at once
5. **Error handling**: Continues even if one translation fails

## 💰 **Cost Estimation**

Using GPT-4o-mini (very cheap):
- ~$0.0001 per word × 5 languages = ~$0.0005 per word
- For 1000 words: ~$0.50
- For 10,000 words: ~$5.00

## ⚙️ **Customization**

### **Change Translation Model**

Edit line 30 in `translate_subject_words.js`:

```javascript
model: 'gpt-4o-mini',  // Change to 'gpt-4o' for better quality (higher cost)
```

### **Translate Specific Subject**

Modify the query on line 65:

```javascript
.select('id, word_phrase, subject')
.eq('subject', 'Computer Science')  // Add this line
.or('french_translation.is.null,...');
```

### **Skip Already Translated Words**

The script automatically skips words that already have all translations. To re-translate:

```sql
-- Reset specific language translations
UPDATE subject_words SET french_translation = NULL;
```

## 🔄 **Re-running the Script**

Safe to run multiple times! It only translates words that are missing translations.

## ⚠️ **Important Notes**

1. **Service Role Key**: Keep this secret! Don't commit to Git
2. **Rate Limits**: Script has built-in delays, but watch for API limits
3. **Costs**: Monitor your OpenAI usage dashboard
4. **Backup**: Always backup your database before bulk operations

## 🐛 **Troubleshooting**

### **"Error: OPENAI_API_KEY not found"**
- Make sure `.env` file exists in root directory
- Check the API key is correct

### **"Error fetching words: ..."**
- Verify Supabase credentials
- Check table exists: `subject_words`
- Verify columns exist (run the migration SQL first)

### **Rate Limit Errors**
- Increase delay on line 44: `setTimeout(resolve, 500)` (500ms instead of 200ms)
- Reduce batch size (process fewer words at a time)

## 📝 **Next Steps**

After translations are complete:
1. ✅ Words are translated
2. 🔄 Later: Run similar script for `example_sentence_*` columns
3. 🎨 Later: Add context-specific translations if needed

## 🎉 **Success!**

Your subject words will now be available in 6 languages! 🌍

- English (original)
- French
- Spanish
- German
- Mandarin
- Hindi

