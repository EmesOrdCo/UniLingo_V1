# Chinese Traditional Translation Scripts

This directory contains scripts to add and populate Chinese Traditional translations in the `subject_words` table.

## Files

- `add_chinese_traditional_columns.sql` - Database migration to add the new columns
- `populate_chinese_traditional_translations.js` - Script to populate translations using OpenAI API
- `test_chinese_translation.js` - Test script to verify everything is working

## Setup

### 1. Environment Variables

Make sure you have the following environment variables set:

```bash
# Supabase configuration
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key

# OpenAI API key
OPENAI_API_KEY=your_openai_api_key
```

### 2. Run the Database Migration

First, run the SQL migration to add the new columns:

```sql
-- Run this in your Supabase SQL editor or via psql
\i database/migrations/add_chinese_traditional_columns.sql
```

Or execute the SQL file directly:

```bash
psql -h your_host -U your_user -d your_database -f database/migrations/add_chinese_traditional_columns.sql
```

## Usage

### 1. Test the Setup

Before running the translation script, test that everything is configured correctly:

```bash
node scripts/utilities/test_chinese_translation.js
```

This will test:
- OpenAI API connection
- Supabase database connection
- Chinese Traditional columns exist
- Complete translation workflow

### 2. Run the Translation Script

#### Dry Run (Recommended First)

Test the script without making any changes:

```bash
node scripts/utilities/populate_chinese_traditional_translations.js --dry-run
```

#### Live Run

Run the script to actually populate the translations:

```bash
node scripts/utilities/populate_chinese_traditional_translations.js
```

#### Limit Records (For Testing)

Process only a limited number of records:

```bash
node scripts/utilities/populate_chinese_traditional_translations.js --limit=10
```

#### Combined Options

```bash
# Dry run with limited records
node scripts/utilities/populate_chinese_traditional_translations.js --dry-run --limit=5
```

## What the Script Does

1. **Fetches Records**: Gets all records from `subject_words` that have:
   - `english_translation` or `example_sentence_english` populated
   - `"chinese(traditional)_translation"` or `"example_sentence_chinese(traditional)"` empty

2. **Translates Content**: Uses OpenAI GPT-3.5-turbo to translate:
   - `english_translation` → `"chinese(traditional)_translation"`
   - `example_sentence_english` → `"example_sentence_chinese(traditional)"`

3. **Updates Database**: Saves the translations back to the database

4. **Rate Limiting**: Includes a 100ms delay between requests to avoid API rate limits

## Database Schema

The migration adds these columns to the `subject_words` table:

```sql
ALTER TABLE subject_words
ADD COLUMN IF NOT EXISTS "chinese(traditional)_translation" TEXT,
ADD COLUMN IF NOT EXISTS "example_sentence_chinese(traditional)" TEXT;
```

## Cost Estimation

- OpenAI GPT-3.5-turbo costs approximately $0.001 per 1K tokens
- Each translation typically uses 50-100 tokens
- For 1000 records with both translation and example sentence: ~$0.10-0.20

## Troubleshooting

### Common Issues

1. **Missing Environment Variables**
   ```
   Error: Missing OpenAI API key
   ```
   Solution: Set the `OPENAI_API_KEY` environment variable

2. **Database Connection Issues**
   ```
   Error: Missing Supabase configuration
   ```
   Solution: Set `SUPABASE_URL` and `SUPABASE_ANON_KEY`

3. **Columns Don't Exist**
   ```
   Error: Chinese Traditional columns test failed
   ```
   Solution: Run the database migration first

4. **OpenAI API Rate Limits**
   ```
   Error: Rate limit exceeded
   ```
   Solution: The script includes delays, but you may need to wait or upgrade your OpenAI plan

### Monitoring Progress

The script provides detailed output showing:
- Which records are being processed
- The original and translated text
- Success/failure status for each record
- Final summary with counts

### Resuming After Interruption

If the script is interrupted, you can safely run it again. It will only process records that don't already have Chinese Traditional translations.

## Example Output

```
🚀 Starting Chinese Traditional translation population...
Mode: LIVE
Found 150 records to process

Processing record ID: 1
  Translating: "Diagnosis"
  → "診斷"
  Translating example: "The doctor made a diagnosis based on the symptoms."
  → "醫生根據症狀做出診斷。"
  ✓ Updated record 1

📊 Summary:
  Records processed: 150
  Errors: 0
  Mode: LIVE (changes applied)

✅ Chinese Traditional translations have been populated successfully!
```
