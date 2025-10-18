#!/usr/bin/env node

/**
 * Script to run Italian subject words translation
 * This script will:
 * 1. Run the database migration to add Italian columns
 * 2. Translate all English words and example sentences to Italian
 */

import { exec } from 'child_process';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function runCommand(command, description) {
  return new Promise((resolve, reject) => {
    log(`\n${description}...`, 'cyan');
    log(`Running: ${command}`, 'blue');
    
    const child = exec(command, { cwd: __dirname + '/..' }, (error, stdout, stderr) => {
      if (error) {
        log(`❌ Error: ${error.message}`, 'red');
        reject(error);
        return;
      }
      
      if (stderr) {
        log(`⚠️  Warning: ${stderr}`, 'yellow');
      }
      
      if (stdout) {
        log(`📋 Output:\n${stdout}`, 'green');
      }
      
      resolve(stdout);
    });
    
    // Show real-time output
    child.stdout.on('data', (data) => {
      process.stdout.write(data);
    });
    
    child.stderr.on('data', (data) => {
      process.stderr.write(data);
    });
  });
}

async function checkEnvironment() {
  log('🔍 Checking environment...', 'cyan');
  
  // Check if .env file exists
  const envPath = path.join(__dirname, '..', '.env');
  if (!fs.existsSync(envPath)) {
    log('❌ .env file not found. Please create one with your database and OpenAI credentials.', 'red');
    process.exit(1);
  }
  
  // Check if migration file exists
  const migrationPath = path.join(__dirname, '..', 'database', 'migrations', 'add_italian_columns.sql');
  if (!fs.existsSync(migrationPath)) {
    log('❌ Migration file not found.', 'red');
    process.exit(1);
  }
  
  // Check if translation script exists
  const translationPath = path.join(__dirname, 'utilities', 'populate_italian_translations.js');
  if (!fs.existsSync(translationPath)) {
    log('❌ Translation script not found.', 'red');
    process.exit(1);
  }
  
  log('✅ Environment check passed', 'green');
}

async function runMigration() {
  log('\n📊 Running database migration...', 'magenta');
  
  const migrationFile = path.join(__dirname, '..', 'database', 'migrations', 'add_italian_columns.sql');
  
  log('⚠️  Please run the following SQL migration manually in your database:', 'yellow');
  log(`File: ${migrationFile}`, 'blue');
  log('\nOr if you have a migration runner, uncomment the following line:', 'yellow');
  // Uncomment the line below if you have a migration runner
  // await runCommand('your-migration-command', 'Running database migration');
}

async function runTranslation() {
  log('\n🔄 Starting translation process...', 'magenta');
  
  try {
    await runCommand('node scripts/utilities/populate_italian_translations.js', 'Translating subject words');
    log('✅ Translation completed successfully!', 'green');
  } catch (error) {
    log('❌ Translation failed:', 'red');
    log(error.message, 'red');
    process.exit(1);
  }
}

async function testTranslation() {
  log('\n🧪 Testing translation...', 'magenta');
  
  try {
    await runCommand('node scripts/utilities/populate_italian_translations.js --dry-run --limit=5', 'Testing translation');
    log('✅ Test completed successfully!', 'green');
  } catch (error) {
    log('❌ Test failed:', 'red');
    log(error.message, 'red');
  }
}

async function main() {
  log('🇮🇹 Italian Subject Words Translation Tool', 'bright');
  log('=' .repeat(50), 'cyan');
  
  const args = process.argv.slice(2);
  
  try {
    await checkEnvironment();
    
    if (args.includes('--test-only')) {
      await testTranslation();
    } else if (args.includes('--migration-only')) {
      await runMigration();
    } else if (args.includes('--translation-only')) {
      await runTranslation();
    } else {
      // Full process
      await runMigration();
      await runTranslation();
    }
    
    log('\n🎉 Process completed successfully!', 'green');
    
  } catch (error) {
    log('\n💥 Process failed:', 'red');
    log(error.message, 'red');
    process.exit(1);
  }
}

// Show usage if help is requested
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  log('Italian Subject Words Translation Tool', 'bright');
  log('Usage:', 'cyan');
  log('  node scripts/run-italian-translation.js [options]', 'blue');
  log('\nOptions:', 'cyan');
  log('  --test-only        Run translation test only (dry run with 5 words)', 'blue');
  log('  --migration-only   Show migration instructions only', 'blue');
  log('  --translation-only Run translation only (skip migration)', 'blue');
  log('  --help, -h         Show this help message', 'blue');
  log('\nEnvironment Requirements:', 'cyan');
  log('  - .env file with EXPO_PUBLIC_OPENAI_API_KEY and Supabase credentials', 'blue');
  log('  - Database migration file: database/migrations/add_italian_columns.sql', 'blue');
  log('  - Translation script: scripts/utilities/populate_italian_translations.js', 'blue');
  process.exit(0);
}

// Run the main function
main();
