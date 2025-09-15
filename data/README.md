# Data Files - Simplified

This directory contains the essential vocabulary data for your UniLingo app.

## Files

### `vocabulary.txt` - Complete Vocabulary List
- **687 English terms** - Clean, final vocabulary list
- **Purpose**: Source data for populating your Supabase database
- **Format**: One word per line, alphabetical order
- **Usage**: Import this into your `general_english_vocab` table
- **Content**: All vocabulary terms used in your app (A1-C2 levels)

## Usage

This file contains the complete vocabulary that powers your UniLingo app. When you need to:
- **Repopulate your database**: Import this file into Supabase
- **Add new vocabulary**: Edit this file and re-import
- **Reference vocabulary**: Check what terms are available
- **Backup your data**: This serves as your vocabulary backup

## Database Integration

Your app reads vocabulary from Supabase (`general_english_vocab` table), not directly from this file. This file serves as:
1. **Source data** for database population
2. **Backup** if database data is lost
3. **Reference** for vocabulary content
4. **Development tool** for adding/editing vocabulary

## File Details
- **Size**: 5,832 bytes
- **Lines**: 687 vocabulary terms
- **Format**: Plain text, one term per line
- **Encoding**: UTF-8
- **Last Updated**: Final corrected version