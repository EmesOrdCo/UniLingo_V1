#!/bin/bash

# Script to run the Chinese Traditional translation migration
# This script helps set up and run the translation process

set -e  # Exit on any error

echo "🚀 Chinese Traditional Translation Migration Setup"
echo "=================================================="

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Please run this script from the project root directory"
    exit 1
fi

# Check if required files exist
if [ ! -f "database/migrations/add_chinese_traditional_columns.sql" ]; then
    echo "❌ Error: Migration file not found"
    exit 1
fi

if [ ! -f "scripts/utilities/populate_chinese_traditional_translations.js" ]; then
    echo "❌ Error: Translation script not found"
    exit 1
fi

# Check environment variables
echo "🔍 Checking environment variables..."

if [ -z "$SUPABASE_URL" ]; then
    echo "❌ Error: SUPABASE_URL environment variable not set"
    echo "   Please set it in your .env file or export it"
    exit 1
fi

if [ -z "$SUPABASE_ANON_KEY" ]; then
    echo "❌ Error: SUPABASE_ANON_KEY environment variable not set"
    echo "   Please set it in your .env file or export it"
    exit 1
fi

if [ -z "$OPENAI_API_KEY" ]; then
    echo "❌ Error: OPENAI_API_KEY environment variable not set"
    echo "   Please set it in your .env file or export it"
    exit 1
fi

echo "✅ Environment variables are set"

# Test the setup
echo ""
echo "🧪 Testing setup..."
node scripts/utilities/test_chinese_translation.js

if [ $? -ne 0 ]; then
    echo "❌ Setup test failed. Please fix the issues before proceeding."
    exit 1
fi

echo ""
echo "✅ Setup test passed!"

# Ask user what they want to do
echo ""
echo "What would you like to do?"
echo "1) Run database migration only"
echo "2) Run translation script (dry run)"
echo "3) Run translation script (live)"
echo "4) Run translation script with limit (for testing)"
echo "5) Exit"

read -p "Enter your choice (1-5): " choice

case $choice in
    1)
        echo ""
        echo "📋 Running database migration..."
        echo "Please run this SQL in your Supabase SQL editor:"
        echo "database/migrations/add_chinese_traditional_columns.sql"
        echo ""
        echo "Or if you have psql configured:"
        echo "psql -h your_host -U your_user -d your_database -f database/migrations/add_chinese_traditional_columns.sql"
        ;;
    2)
        echo ""
        echo "🧪 Running translation script (dry run)..."
        node scripts/utilities/populate_chinese_traditional_translations.js --dry-run
        ;;
    3)
        echo ""
        echo "⚠️  This will make live changes to your database!"
        read -p "Are you sure you want to continue? (y/N): " confirm
        if [[ $confirm == [yY] || $confirm == [yY][eE][sS] ]]; then
            echo "🚀 Running translation script (live)..."
            node scripts/utilities/populate_chinese_traditional_translations.js
        else
            echo "❌ Cancelled by user"
        fi
        ;;
    4)
        read -p "Enter the number of records to process: " limit
        echo ""
        echo "🧪 Running translation script with limit of $limit records..."
        node scripts/utilities/populate_chinese_traditional_translations.js --limit=$limit
        ;;
    5)
        echo "👋 Goodbye!"
        exit 0
        ;;
    *)
        echo "❌ Invalid choice. Please run the script again."
        exit 1
        ;;
esac

echo ""
echo "✅ Migration process completed!"
