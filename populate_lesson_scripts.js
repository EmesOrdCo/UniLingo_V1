const fs = require('fs');
const csv = require('csv-parser');
const { supabase } = require('./backend/supabaseClient');

/**
 * Script to populate lesson_scripts table with one entry per subject/lesson
 * This creates the lesson-level scripts that are linked to the subject_words table
 */

async function createLessonScriptsTable() {
  try {
    console.log('Checking if lesson_scripts table exists...');
    
    // Try to select from the table to see if it exists
    const { data, error } = await supabase
      .from('lesson_scripts')
      .select('id')
      .limit(1);
    
    if (error) {
      if (error.message.includes('relation "lesson_scripts" does not exist')) {
        console.log('Table does not exist. Please run the SQL script first:');
        console.log('1. Go to your Supabase dashboard');
        console.log('2. Navigate to SQL Editor');
        console.log('3. Run the contents of fix_script_structure.sql');
        console.log('4. Then run this script again');
        throw new Error('Table lesson_scripts does not exist. Please create it first using the provided SQL script.');
      } else {
        console.error('Error checking table:', error);
        throw error;
      }
    }
    
    console.log('✅ Table lesson_scripts exists and is accessible');
  } catch (error) {
    console.error('Error setting up table:', error);
    throw error;
  }
}

async function processCSVForLessonScripts(csvFilePath) {
  const results = [];
  const seenSubjects = new Set(); // Track unique subjects
  
  return new Promise((resolve, reject) => {
    fs.createReadStream(csvFilePath)
      .pipe(csv())
      .on('data', (row) => {
        const subject = row.subject?.trim();
        
        if (subject && !seenSubjects.has(subject)) {
          seenSubjects.add(subject);
          
          results.push({
            subject_name: subject,
            english_script_writing: row.english_script_writing?.trim() || null,
            english_script_roleplay: row.english_script_roleplay?.trim() || null,
            french_script_writing: row.french_script_writing?.trim() || null,
            french_script_roleplay: row.french_script_roleplay?.trim() || null
          });
        }
      })
      .on('end', () => {
        console.log(`Processed ${results.length} unique subjects for lesson scripts`);
        resolve(results);
      })
      .on('error', (error) => {
        reject(error);
      });
  });
}

async function insertLessonScripts(data) {
  try {
    console.log('Inserting lesson scripts...');
    
    const { error } = await supabase
      .from('lesson_scripts')
      .insert(data);
    
    if (error) {
      console.error('Error inserting lesson scripts:', error);
      throw error;
    }
    
    console.log(`✅ Successfully inserted ${data.length} lesson scripts`);
    return data.length;
  } catch (error) {
    console.error('Database insertion failed:', error);
    throw error;
  }
}

async function verifyScripts() {
  try {
    console.log('Verifying lesson scripts were created correctly...');
    
    // Get count of lesson scripts
    const { data: scripts, error: scriptsError } = await supabase
      .from('lesson_scripts')
      .select('id, subject_name');
    
    if (scriptsError) throw scriptsError;
    
    console.log(`✅ Created ${scripts.length} lesson scripts`);
    
    // Show a few examples
    if (scripts.length > 0) {
      console.log('\nSample lesson scripts:');
      scripts.slice(0, 5).forEach(script => {
        console.log(`- ${script.subject_name} (ID: ${script.id})`);
      });
    }
    
  } catch (error) {
    console.error('Error verifying scripts:', error);
    throw error;
  }
}

async function main() {
  try {
    // Get CSV file path from command line arguments
    const csvFilePath = process.argv[2];
    
    if (!csvFilePath) {
      console.error('Please provide the CSV file path as an argument');
      console.error('Usage: node populate_lesson_scripts.js <path_to_csv_file>');
      process.exit(1);
    }
    
    if (!fs.existsSync(csvFilePath)) {
      console.error(`CSV file not found: ${csvFilePath}`);
      process.exit(1);
    }
    
    console.log(`Processing CSV file for lesson scripts: ${csvFilePath}`);
    
    // Check if table exists
    await createLessonScriptsTable();
    
    // Process the CSV file
    const processedData = await processCSVForLessonScripts(csvFilePath);
    
    if (processedData.length === 0) {
      console.log('No data found in CSV file');
      return;
    }
    
    // Show a preview of the data
    console.log('\nPreview of lesson scripts:');
    console.log('subject_name | english_script_writing (first 50 chars)');
    console.log('-------------|----------------------------------------');
    processedData.slice(0, 10).forEach(item => {
      const script = item.english_script_writing ? 
        item.english_script_writing.substring(0, 50) + '...' : 'N/A';
      console.log(`${item.subject_name.padEnd(12)} | ${script}`);
    });
    
    if (processedData.length > 10) {
      console.log(`... and ${processedData.length - 10} more scripts`);
    }
    
    // Ask for confirmation before inserting
    const readline = require('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    const answer = await new Promise(resolve => {
      rl.question(`\nInsert ${processedData.length} lesson scripts? (y/N): `, resolve);
    });
    
    rl.close();
    
    if (answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes') {
      await insertLessonScripts(processedData);
      await verifyScripts();
      console.log('✅ Lesson scripts population completed successfully!');
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

module.exports = { processCSVForLessonScripts, insertLessonScripts, linkScriptsToSubjects };
