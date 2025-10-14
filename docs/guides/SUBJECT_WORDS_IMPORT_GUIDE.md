# Subject Words Import Guide

This guide will help you import your CSV data containing subjects and their associated words into your Supabase database.

## Overview

The script will transform your CSV data from this format:
```
Subject | subject_words
Saying Hello | hi, hello, good morning, good afternoon, good evening, goodbye, please, bye
Meeting New People | meet, friend, nice, this, is, from, yes, no
```

Into individual database entries like this:
```
word_phrase | subject
hi | Saying Hello
hello | Saying Hello
good morning | Saying Hello
...
meet | Meeting New People
friend | Meeting New People
...
```

## Prerequisites

1. Make sure your `.env` file contains the required Supabase credentials
2. Ensure you have Node.js installed
3. Have your CSV file ready with the exact column names: `Subject` and `subject_words`

## Step 1: Create the Database Table

1. Go to your Supabase dashboard
2. Navigate to the SQL Editor
3. Copy and paste the contents of `create_subject_words_table.sql`
4. Run the SQL script to create the table

## Step 2: Run the Import Script

```bash
# Navigate to your project directory
cd /Users/harryemes/UniLingo_Latest

# Run the script with your CSV file path
node process_subject_words.js path/to/your/file.csv
```

## Example Usage

```bash
node process_subject_words.js data/subject_words.csv
```

## What the Script Does

1. **Validates the CSV file** - Checks if the file exists and has the correct format
2. **Creates table entries** - Splits comma-separated words and creates individual database entries
3. **Shows preview** - Displays the first 10 entries before insertion
4. **Asks for confirmation** - Prompts you to confirm before inserting data
5. **Batch insertion** - Inserts data in batches of 100 for better performance
6. **Progress tracking** - Shows insertion progress

## Database Schema

The `subject_words` table has the following structure:

```sql
CREATE TABLE subject_words (
  id SERIAL PRIMARY KEY,
  word_phrase TEXT NOT NULL,
  subject TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Error Handling

- The script will check if the table exists before proceeding
- It validates the CSV file format
- Shows clear error messages if something goes wrong
- Asks for confirmation before making changes

## Tips

- Make sure your CSV file has headers exactly as: `Subject,subject_words`
- The script trims whitespace from both subjects and words
- Empty words/phrases are automatically filtered out
- The script processes comma-separated values in the `subject_words` column

## Troubleshooting

If you get an error about the table not existing:
1. Make sure you've run the SQL script in your Supabase dashboard
2. Check that your Supabase credentials are correct in the `.env` file

If you get CSV parsing errors:
1. Ensure your CSV file has the exact column names: `Subject` and `subject_words`
2. Make sure the file is not corrupted and is readable

