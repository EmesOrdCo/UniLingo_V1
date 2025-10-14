const fs = require('fs');
const csv = require('csv-parser');
const { supabase } = require('./backend/supabaseClient');

/**
 * Script to process CSV file with Subject and subject_words columns
 * and create individual entries for each subject word with its associated subject
 */

async function createTableIfNotExists() {
  try {
    console.log('Checking if subject_words table exists...');
    
    // Try to select from the table to see if it exists
    const { data, error } = await supabase
      .from('subject_words')
      .select('id')
      .limit(1);
    
    if (error) {
      if (error.message.includes('relation "subject_words" does not exist')) {
        console.log('Table does not exist. Please run the SQL script first:');
        console.log('1. Go to your Supabase dashboard');
        console.log('2. Navigate to SQL Editor');
        console.log('3. Run the contents of create_subject_words_table.sql');
        console.log('4. Then run this script again');
        throw new Error('Table subject_words does not exist. Please create it first using the provided SQL script.');
      } else {
        console.error('Error checking table:', error);
        throw error;
      }
    }
    
    console.log('✅ Table subject_words exists and is accessible');
  } catch (error) {
    console.error('Error setting up table:', error);
    throw error;
  }
}

async function processCSV(csvFilePath) {
  const results = [];
  
  return new Promise((resolve, reject) => {
    fs.createReadStream(csvFilePath)
      .pipe(csv())
      .on('data', (row) => {
        const subject = row.subject?.trim();
        const subjectWords = row['subject_words ']?.trim() || row.subject_words?.trim();
        
        if (subject && subjectWords) {
          // Split by comma and clean up each word/phrase
          const words = subjectWords
            .split(',')
            .map(word => word.trim())
            .filter(word => word.length > 0); // Remove empty strings
          
          // Create individual entries for each word/phrase
          words.forEach(word => {
            results.push({
              word_phrase: word,
              subject: subject,
              french_keyword: row.french_keyword?.trim() || null
            });
          });
        }
      })
      .on('end', () => {
        console.log(`Processed ${results.length} word entries from CSV`);
        resolve(results);
      })
      .on('error', (error) => {
        reject(error);
      });
  });
}

async function insertIntoDatabase(data) {
  try {
    // Insert in batches to avoid overwhelming the database
    const batchSize = 100;
    let insertedCount = 0;
    
    for (let i = 0; i < data.length; i += batchSize) {
      const batch = data.slice(i, i + batchSize);
      
      const { error } = await supabase
        .from('subject_words')
        .insert(batch);
      
      if (error) {
        console.error(`Error inserting batch ${Math.floor(i / batchSize) + 1}:`, error);
        throw error;
      }
      
      insertedCount += batch.length;
      console.log(`Inserted ${insertedCount}/${data.length} entries...`);
    }
    
    console.log(`Successfully inserted ${insertedCount} entries into the database`);
    return insertedCount;
  } catch (error) {
    console.error('Database insertion failed:', error);
    throw error;
  }
}

async function main() {
  try {
    // Get CSV file path from command line arguments
    const csvFilePath = process.argv[2];
    
    if (!csvFilePath) {
      console.error('Please provide the CSV file path as an argument');
      console.error('Usage: node process_subject_words.js <path_to_csv_file>');
      process.exit(1);
    }
    
    if (!fs.existsSync(csvFilePath)) {
      console.error(`CSV file not found: ${csvFilePath}`);
      process.exit(1);
    }
    
    console.log(`Processing CSV file: ${csvFilePath}`);
    
    // Create table if it doesn't exist
    await createTableIfNotExists();
    
    // Process the CSV file
    const processedData = await processCSV(csvFilePath);
    
    if (processedData.length === 0) {
      console.log('No data found in CSV file');
      return;
    }
    
    // Show a preview of the data
    console.log('\nPreview of processed data:');
    console.log('word_phrase | subject | french_keyword');
    console.log('------------|---------|---------------');
    processedData.slice(0, 10).forEach(item => {
      const french = item.french_keyword || 'N/A';
      console.log(`${item.word_phrase.padEnd(11)} | ${item.subject.padEnd(7)} | ${french}`);
    });
    
    if (processedData.length > 10) {
      console.log(`... and ${processedData.length - 10} more entries`);
    }
    
    // Ask for confirmation before inserting
    const readline = require('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    const answer = await new Promise(resolve => {
      rl.question(`\nInsert ${processedData.length} entries into the database? (y/N): `, resolve);
    });
    
    rl.close();
    
    if (answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes') {
      await insertIntoDatabase(processedData);
      console.log('✅ Process completed successfully!');
    } else {
      console.log('❌ Process cancelled by user');
    }
    
  } catch (error) {
    console.error('❌ Script failed:', error);
    process.exit(1);
  }
}

// Run the main function
if (require.main === module) {
  main();
}

module.exports = { processCSV, insertIntoDatabase, createTableIfNotExists };