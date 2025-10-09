// OpenAI Conversation Script Generator
// Generates 2-way conversations for lesson scripts using keywords

require('dotenv').config(); // Load .env file
const OpenAI = require('openai');
const { createClient } = require('@supabase/supabase-js');

// Configuration
const OPENAI_API_KEY = process.env.EXPO_PUBLIC_OPENAI_API_KEY; // Using your environment variable

// Check if API key is available
if (!OPENAI_API_KEY) {
  console.error('Error: EXPO_PUBLIC_OPENAI_API_KEY environment variable is not set');
  console.log('Please set it with: export EXPO_PUBLIC_OPENAI_API_KEY="your_key_here"');
  process.exit(1);
}
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

// Check if Supabase credentials are available
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('Error: EXPO_PUBLIC_SUPABASE_URL or EXPO_PUBLIC_SUPABASE_ANON_KEY environment variables are not set');
  console.log('Please check your .env file');
  process.exit(1);
}

// Initialize clients
const openai = new OpenAI({
  apiKey: OPENAI_API_KEY,
});

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Conversation generation function for roleplay (spoken conversation)
async function generateRoleplayScript(subject, keywords) {
  const systemPrompt = `You are creating NATURAL educational conversation scripts for English learners. 
  
CRITICAL REQUIREMENTS:
- Create a natural spoken conversation between a learner and a helpful person (teacher/friend/shopkeeper)
- The OTHER PERSON must initiate the conversation
- Use SIMPLE, basic English suitable for beginners
- You must have EXACTLY ${keywords.length} USER messages (one for each keyword)
- Each USER message must be a COMPLETE, NATURAL SENTENCE that contains exactly 1 keyword
- ALL ${keywords.length} keywords must be used exactly once across the ${keywords.length} user messages
- Keywords should be the most complex words in the conversation
- AI messages can contain keywords or not - focus on natural responses
- Make it sound like a REAL conversation, not keyword practice
- User messages should be beginner-level but natural sentences
- Use "AI" as the name for the other person (unless a more suitable name fits the context)

Keywords to use (must use ALL ${keywords.length}): ${keywords.join(', ')}

Format the conversation as:
AI: [initiates conversation naturally]
User: [natural sentence containing keyword 1]
AI: [natural response]
User: [natural sentence containing keyword 2]
AI: [natural response]
User: [natural sentence containing keyword 3]
AI: [natural response]
...continue until ALL ${keywords.length} keywords are used in natural user sentences`;

  const userPrompt = `Create a NATURAL spoken conversation script for the subject "${subject}". 

CRITICAL: You must create EXACTLY ${keywords.length} USER messages. Each USER message must be a COMPLETE, NATURAL SENTENCE containing exactly ONE keyword.

Keywords to use (${keywords.length} total): ${keywords.join(', ')}

The conversation structure must be:
1. AI starts the conversation naturally
2. User responds with a NATURAL SENTENCE containing keyword 1
3. AI responds naturally
4. User responds with a NATURAL SENTENCE containing keyword 2  
5. AI responds naturally
6. User responds with a NATURAL SENTENCE containing keyword 3
7. AI responds naturally
...and so on until ALL ${keywords.length} keywords are used.

IMPORTANT: 
- Each User message must be a complete, natural sentence (not just the keyword)
- Make it sound like a real conversation
- User sentences should be beginner-level English but natural
- DO NOT create fewer user messages than keywords
- Every keyword must appear in a separate, natural user sentence`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      max_tokens: 600,
      temperature: 0.7,
    });

    const result = completion.choices[0].message.content;
    
    // Validate that we have the right number of user messages
    const userMessageCount = (result.match(/User:/g) || []).length;
    
    if (userMessageCount !== keywords.length) {
      console.warn(`⚠️  Warning: Expected ${keywords.length} user messages, got ${userMessageCount}. Retrying...`);
      console.log(`Keyword count: ${keywords.length}, User messages found: ${userMessageCount}`);
      // Retry with even more explicit instructions
      return await generateRoleplayScriptWithValidation(subject, keywords);
    }
    
    // Double-check that all keywords are actually used
    const missingKeywords = keywords.filter(keyword => !result.toLowerCase().includes(keyword.toLowerCase()));
    if (missingKeywords.length > 0) {
      console.warn(`⚠️  Warning: Missing keywords: ${missingKeywords.join(', ')}. Retrying...`);
      return await generateRoleplayScriptWithValidation(subject, keywords);
    }
    
    // Triple-check: Ensure each user message contains exactly one keyword
    const userMessages = result.split('\n').filter(line => line.trim().startsWith('User:'));
    const invalidUserMessages = [];
    const usedKeywords = [];
    
    for (let i = 0; i < userMessages.length; i++) {
      const userMessage = userMessages[i].toLowerCase();
      const foundKeywords = keywords.filter(keyword => userMessage.includes(keyword.toLowerCase()));
      usedKeywords.push(...foundKeywords);
      
      if (foundKeywords.length !== 1) {
        invalidUserMessages.push(`User message ${i + 1}: contains ${foundKeywords.length} keywords (should be 1)`);
      }
    }
    
    // Check for missing keywords
    const missingKeywordsCheck = keywords.filter(keyword => !usedKeywords.includes(keyword));
    
    if (invalidUserMessages.length > 0 || missingKeywordsCheck.length > 0) {
      console.warn(`⚠️  Warning: Validation failed. Invalid messages: ${invalidUserMessages.join('; ')}. Missing keywords: ${missingKeywordsCheck.join(', ')}. Retrying...`);
      return await generateRoleplayScriptWithValidation(subject, keywords);
    }
    
    console.log(`✅ Generated script with ${userMessageCount} user messages, all ${keywords.length} keywords used`);
    return result;
  } catch (error) {
    console.error('Error generating roleplay conversation:', error);
    throw error;
  }
}

// Retry function with ultra-explicit instructions
async function generateRoleplayScriptWithValidation(subject, keywords) {
  const userPromptParts = [];
  for (let i = 0; i < keywords.length; i++) {
    userPromptParts.push(`User: [message containing ONLY keyword ${i + 1}: "${keywords[i]}"]`);
    userPromptParts.push(`AI: [response]`);
  }

  const ultraExplicitPrompt = `You are creating a NATURAL conversation script for English learners. This is CRITICAL:

SUBJECT: ${subject}
KEYWORDS (${keywords.length} total): ${keywords.join(', ')}

YOU MUST CREATE EXACTLY ${keywords.length} USER MESSAGES. NO MORE, NO LESS.
EACH USER MESSAGE MUST BE A NATURAL SENTENCE THAT CONTAINS EXACTLY ONE KEYWORD.

REQUIRED STRUCTURE:
AI: [starts conversation with a natural question or statement]
User: [natural response that includes keyword 1: "${keywords[0]}" in a complete sentence]
AI: [natural response]
User: [natural response that includes keyword 2: "${keywords[1]}" in a complete sentence]
AI: [natural response]
User: [natural response that includes keyword 3: "${keywords[2]}" in a complete sentence]
AI: [natural response]
${keywords.length > 3 ? `User: [natural response that includes keyword 4: "${keywords[3]}" in a complete sentence]
AI: [natural response]
` : ''}${keywords.length > 4 ? `User: [natural response that includes keyword 5: "${keywords[4]}" in a complete sentence]
AI: [natural response]
` : ''}${keywords.length > 5 ? `User: [natural response that includes keyword 6: "${keywords[5]}" in a complete sentence]
AI: [natural response]
` : ''}${keywords.length > 6 ? `User: [natural response that includes keyword 7: "${keywords[6]}" in a complete sentence]
AI: [natural response]
` : ''}${keywords.length > 7 ? `User: [natural response that includes keyword 8: "${keywords[7]}" in a complete sentence]
AI: [natural response]
` : ''}${keywords.length > 8 ? `User: [natural response that includes keyword 9: "${keywords[8]}" in a complete sentence]
AI: [natural response]
` : ''}${keywords.length > 9 ? `User: [natural response that includes keyword 10: "${keywords[9]}" in a complete sentence]
AI: [natural response]
` : ''}

RULES:
1. AI starts the conversation naturally
2. Each User message must be a COMPLETE, NATURAL SENTENCE
3. Each User sentence must contain exactly ONE keyword from the list
4. Make it sound like a real conversation, not keyword practice
5. User messages should be beginner-level English
6. You must have EXACTLY ${keywords.length} "User:" lines

EXAMPLE for "After the Accident":
User: "I have a deep wound on my arm from the accident."
User: "The injury didn't hurt me severely, thankfully."
User: "It happened very suddenly when I was walking."

Create the conversation now.`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: "You are a helpful assistant that creates educational conversations. Follow instructions exactly." },
        { role: "user", content: ultraExplicitPrompt }
      ],
      max_tokens: 800,
      temperature: 0.3,
    });

    const retryResult = completion.choices[0].message.content;
    
    const retryUserMessageCount = (retryResult.match(/User:/g) || []).length;
    
    // Validate retry result and extend if needed
    if (retryUserMessageCount !== keywords.length) {
      console.log(`⚠️  Retry still has wrong count: ${retryUserMessageCount} user messages, need ${keywords.length}`);
      
      // Find missing keywords and extend the conversation
      const retryUserMessages = retryResult.split('\n').filter(line => line.trim().startsWith('User:'));
      const retryUsedKeywords = [];
      
      for (let i = 0; i < retryUserMessages.length; i++) {
        const userMessage = retryUserMessages[i].toLowerCase();
        const foundKeywords = keywords.filter(keyword => userMessage.includes(keyword.toLowerCase()));
        retryUsedKeywords.push(...foundKeywords);
      }
      
      const retryMissingKeywords = keywords.filter(keyword => !retryUsedKeywords.includes(keyword));
      console.log(`Missing keywords to add: ${retryMissingKeywords.join(', ')}`);
      
      // Extend the conversation with missing keywords
      const extendedResult = await extendConversationWithMissingKeywords(retryResult, retryMissingKeywords, subject);
      return extendedResult;
    }
    
    console.log(`✅ Retry successful: ${retryUserMessageCount} user messages, all keywords used`);
    return retryResult;
  } catch (error) {
    console.error('Error in retry generation:', error);
    throw error;
  }
}

// Function to extend conversation with missing keywords
async function extendConversationWithMissingKeywords(existingConversation, missingKeywords, subject) {
  console.log(`🔧 Extending conversation with missing keywords: ${missingKeywords.join(', ')}`);
  
  // Analyze existing conversation to avoid duplication
  const existingLines = existingConversation.split('\n').filter(line => line.trim());
  const existingUserMessages = existingLines.filter(line => line.trim().startsWith('User:'));
  const existingAIMessages = existingLines.filter(line => line.trim().startsWith('AI:'));
  
  console.log(`Existing: ${existingUserMessages.length} user messages, ${existingAIMessages.length} AI messages`);
  
  const extensionPrompt = `You are extending an existing conversation script. Here is the current conversation:

${existingConversation}

MISSING KEYWORDS TO ADD: ${missingKeywords.join(', ')}

CRITICAL REQUIREMENTS:
1. Add exactly ${missingKeywords.length} NEW user messages (do NOT repeat any existing messages)
2. Each NEW user message must contain exactly ONE of the missing keywords
3. Each NEW user message must be a natural sentence
4. Add appropriate AI responses after each new user message
5. Make the conversation flow naturally from where it ended
6. Do NOT duplicate any existing user or AI messages
7. Each missing keyword must appear in a user message (not AI message)

Continue the conversation naturally. Add only NEW content that hasn't been said before.

Required format (add exactly this many exchanges):
${missingKeywords.map((keyword, index) => `
User: [NEW natural sentence containing "${keyword}"]
AI: [NEW response that hasn't been said before]`).join('')}

Make sure each missing keyword is used exactly once in a natural user sentence.`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: "You are a helpful assistant that extends conversations naturally. Follow instructions exactly." },
        { role: "user", content: extensionPrompt }
      ],
      max_tokens: 600,
      temperature: 0.3,
    });

    const extension = completion.choices[0].message.content;
    
    // Combine existing conversation with extension
    const fullConversation = existingConversation + '\n' + extension;
    
    // Final validation - check that all keywords are in user messages
    const finalUserMessages = fullConversation.split('\n').filter(line => line.trim().startsWith('User:'));
    const finalUserMessageCount = finalUserMessages.length;
    
    console.log(`🔧 Extension complete: ${finalUserMessageCount} total user messages`);
    
    // Validate that all original keywords are in user messages
    const finalUsedKeywords = [];
    for (let i = 0; i < finalUserMessages.length; i++) {
      const userMessage = finalUserMessages[i].toLowerCase();
      const foundKeywords = missingKeywords.filter(keyword => userMessage.includes(keyword.toLowerCase()));
      finalUsedKeywords.push(...foundKeywords);
    }
    
    const stillMissing = missingKeywords.filter(keyword => !finalUsedKeywords.includes(keyword));
    if (stillMissing.length > 0) {
      console.error(`❌ EXTENSION FAILED: Still missing keywords in user messages: ${stillMissing.join(', ')}`);
      throw new Error(`Extension failed to add keywords to user messages: ${stillMissing.join(', ')}`);
    }
    
    console.log(`✅ All missing keywords now in user messages: ${missingKeywords.join(', ')}`);
    return fullConversation;
  } catch (error) {
    console.error('Error extending conversation:', error);
    throw error;
  }
}

// Conversation generation function for writing (text-based conversation)
async function generateWritingScript(subject, keywords) {
  const systemPrompt = `You are creating educational conversation scripts for English learners. 
  
CRITICAL REQUIREMENTS:
- Create a natural text-based conversation (like chat messages) between a learner and a helpful person
- The OTHER PERSON must initiate the conversation
- Use SIMPLE, basic English suitable for beginners
- You must have EXACTLY ${keywords.length} USER messages (one for each keyword)
- Each USER message must contain exactly 1 keyword from the provided list
- ALL ${keywords.length} keywords must be used exactly once across the ${keywords.length} user messages
- Keywords should be the most complex words in the conversation
- AI messages can contain keywords or not - focus on natural responses
- Make it natural and practical for text-based communication (shorter messages)
- Use "AI" as the name for the other person (unless a more suitable name fits the context)

Keywords to use (must use ALL ${keywords.length}): ${keywords.join(', ')}

Format the conversation as:
AI: [initiates conversation]
User: [message with keyword 1]
AI: [response - can have keywords or not]
User: [message with keyword 2]
AI: [response - can have keywords or not]
User: [message with keyword 3]
AI: [response - can have keywords or not]
...continue until ALL ${keywords.length} keywords are used in user messages`;

  const userPrompt = `Create a text-based conversation script for the subject "${subject}". 

CRITICAL: You must create EXACTLY ${keywords.length} USER messages. Each USER message must contain exactly ONE keyword.

Keywords to use (${keywords.length} total): ${keywords.join(', ')}

The conversation structure must be:
1. AI starts the conversation
2. User responds with keyword 1
3. AI responds
4. User responds with keyword 2  
5. AI responds
6. User responds with keyword 3
7. AI responds
...and so on until ALL ${keywords.length} keywords are used.

DO NOT create fewer user messages than keywords. Every keyword must appear in a separate user message.`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      max_tokens: 600,
      temperature: 0.7,
    });

    const result = completion.choices[0].message.content;
    
    // Validate that we have the right number of user messages
    const userMessageCount = (result.match(/User:/g) || []).length;
    if (userMessageCount !== keywords.length) {
      console.warn(`⚠️  Warning: Expected ${keywords.length} user messages, got ${userMessageCount}. Retrying...`);
      // Retry with even more explicit instructions
      return await generateWritingScriptWithValidation(subject, keywords);
    }
    
    return result;
  } catch (error) {
    console.error('Error generating writing conversation:', error);
    throw error;
  }
}

// Retry function for writing scripts with ultra-explicit instructions
async function generateWritingScriptWithValidation(subject, keywords) {
  const ultraExplicitPrompt = `You are creating a text-based conversation script. This is CRITICAL:

SUBJECT: ${subject}
KEYWORDS (${keywords.length} total): ${keywords.join(', ')}

YOU MUST CREATE EXACTLY ${keywords.length} USER MESSAGES. NO MORE, NO LESS.

Format:
AI: [starts conversation]
User: [message containing keyword 1: "${keywords[0]}"]
AI: [response]
User: [message containing keyword 2: "${keywords[1]}"]
AI: [response]
User: [message containing keyword 3: "${keywords[2]}"]
AI: [response]
${keywords.length > 3 ? `User: [message containing keyword 4: "${keywords[3]}"]
AI: [response]` : ''}
${keywords.length > 4 ? `User: [message containing keyword 5: "${keywords[4]}"]
AI: [response]` : ''}
${keywords.length > 5 ? `User: [message containing keyword 6: "${keywords[5]}"]
AI: [response]` : ''}
${keywords.length > 6 ? `User: [message containing keyword 7: "${keywords[6]}"]
AI: [response]` : ''}
${keywords.length > 7 ? `User: [message containing keyword 8: "${keywords[7]}"]
AI: [response]` : ''}
${keywords.length > 8 ? `User: [message containing keyword 9: "${keywords[8]}"]
AI: [response]` : ''}
${keywords.length > 9 ? `User: [message containing keyword 10: "${keywords[9]}"]
AI: [response]` : ''}

Create the conversation now. Make sure you have exactly ${keywords.length} "User:" lines.`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: "You are a helpful assistant that creates educational conversations. Follow instructions exactly." },
        { role: "user", content: ultraExplicitPrompt }
      ],
      max_tokens: 800,
      temperature: 0.3,
    });

    return completion.choices[0].message.content;
  } catch (error) {
    console.error('Error in retry generation:', error);
    throw error;
  }
}

// Get keywords for a subject
async function getKeywordsForSubject(subject) {
  try {
    const { data, error } = await supabase
      .from('subject_words')
      .select('word_phrase')
      .eq('subject', subject);

    if (error) throw error;
    
    return data.map(row => row.word_phrase).filter(word => word);
  } catch (error) {
    console.error('Error fetching keywords:', error);
    throw error;
  }
}

// Generate roleplay scripts for all subjects
async function generateAllRoleplayScripts() {
  try {
    // Get all unique subjects
    const { data: subjects, error: subjectsError } = await supabase
      .from('subject_words')
      .select('subject')
      .order('subject');

    if (subjectsError) throw subjectsError;

    const uniqueSubjects = [...new Set(subjects.map(s => s.subject))];
    console.log(`Found ${uniqueSubjects.length} unique subjects`);

    for (const subject of uniqueSubjects) {
      console.log(`\nProcessing subject: ${subject}`);
      
      // Get keywords for this subject
      const keywords = await getKeywordsForSubject(subject);
      
      if (keywords.length === 0) {
        console.log(`No keywords found for ${subject}, skipping...`);
        continue;
      }

      console.log(`Keywords (${keywords.length}): ${keywords.join(', ')}`);

      // Generate roleplay conversation
      const roleplayScript = await generateRoleplayScript(subject, keywords);
      console.log('Generated roleplay script');

      // Update the lesson_scripts table
      const { error: updateError } = await supabase
        .from('lesson_scripts')
        .update({
          english_script_roleplay: roleplayScript,
          updated_at: new Date().toISOString()
        })
        .eq('subject_name', subject);

      if (updateError) {
        console.error(`Error updating ${subject}:`, updateError);
      } else {
        console.log(`✅ Updated roleplay script for ${subject}`);
      }

      // Add delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    console.log('\n🎉 All roleplay scripts generated successfully!');
  } catch (error) {
    console.error('Error in generateAllRoleplayScripts:', error);
  }
}

// Generate writing scripts for all subjects
async function generateAllWritingScripts() {
  try {
    // Get all unique subjects
    const { data: subjects, error: subjectsError } = await supabase
      .from('subject_words')
      .select('subject')
      .order('subject');

    if (subjectsError) throw subjectsError;

    const uniqueSubjects = [...new Set(subjects.map(s => s.subject))];
    console.log(`Found ${uniqueSubjects.length} unique subjects`);

    for (const subject of uniqueSubjects) {
      console.log(`\nProcessing subject: ${subject}`);
      
      // Get keywords for this subject
      const keywords = await getKeywordsForSubject(subject);
      
      if (keywords.length === 0) {
        console.log(`No keywords found for ${subject}, skipping...`);
        continue;
      }

      console.log(`Keywords (${keywords.length}): ${keywords.join(', ')}`);

      // Generate writing conversation
      const writingScript = await generateWritingScript(subject, keywords);
      console.log('Generated writing script');

      // Update the lesson_scripts table
      const { error: updateError } = await supabase
        .from('lesson_scripts')
        .update({
          english_script_writing: writingScript,
          updated_at: new Date().toISOString()
        })
        .eq('subject_name', subject);

      if (updateError) {
        console.error(`Error updating ${subject}:`, updateError);
      } else {
        console.log(`✅ Updated writing script for ${subject}`);
      }

      // Add delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    console.log('\n🎉 All writing scripts generated successfully!');
  } catch (error) {
    console.error('Error in generateAllWritingScripts:', error);
  }
}

// Generate roleplay script for a specific subject
async function generateRoleplayScriptForSubject(subjectName) {
  try {
    console.log(`Generating roleplay script for: ${subjectName}`);
    
    const keywords = await getKeywordsForSubject(subjectName);
    
    if (keywords.length === 0) {
      throw new Error(`No keywords found for subject: ${subjectName}`);
    }

    const roleplayScript = await generateRoleplayScript(subjectName, keywords);

    // Update the lesson_scripts table
    const { error } = await supabase
      .from('lesson_scripts')
      .update({
        english_script_roleplay: roleplayScript,
        updated_at: new Date().toISOString()
      })
      .eq('subject_name', subjectName);

    if (error) throw error;

    console.log(`✅ Generated and saved roleplay script for ${subjectName}`);
    return { roleplayScript };
  } catch (error) {
    console.error(`Error generating roleplay script for ${subjectName}:`, error);
    throw error;
  }
}

// Generate writing script for a specific subject
async function generateWritingScriptForSubject(subjectName) {
  try {
    console.log(`Generating writing script for: ${subjectName}`);
    
    const keywords = await getKeywordsForSubject(subjectName);
    
    if (keywords.length === 0) {
      throw new Error(`No keywords found for subject: ${subjectName}`);
    }

    const writingScript = await generateWritingScript(subjectName, keywords);

    // Update the lesson_scripts table
    const { error } = await supabase
      .from('lesson_scripts')
      .update({
        english_script_writing: writingScript,
        updated_at: new Date().toISOString()
      })
      .eq('subject_name', subjectName);

    if (error) throw error;

    console.log(`✅ Generated and saved writing script for ${subjectName}`);
    return { writingScript };
  } catch (error) {
    console.error(`Error generating writing script for ${subjectName}:`, error);
    throw error;
  }
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log('Usage:');
    console.log('  node generate_conversation_scripts.js roleplay all        # Generate roleplay scripts for all subjects');
    console.log('  node generate_conversation_scripts.js writing all         # Generate writing scripts for all subjects');
    console.log('  node generate_conversation_scripts.js roleplay "Saying Hello"    # Generate roleplay for specific subject');
    console.log('  node generate_conversation_scripts.js writing "Saying Hello"     # Generate writing for specific subject');
    process.exit(1);
  }

  const scriptType = args[0];
  const target = args[1];

  if (!scriptType || !target) {
    console.log('Error: Please specify script type (roleplay/writing) and target (all/subject name)');
    process.exit(1);
  }

  if (scriptType === 'roleplay') {
    if (target === 'all') {
      await generateAllRoleplayScripts();
    } else {
      await generateRoleplayScriptForSubject(target);
    }
  } else if (scriptType === 'writing') {
    if (target === 'all') {
      await generateAllWritingScripts();
    } else {
      await generateWritingScriptForSubject(target);
    }
  } else {
    console.log('Error: Script type must be "roleplay" or "writing"');
    process.exit(1);
  }
}

// Export functions for use in other scripts
module.exports = {
  generateRoleplayScript,
  generateWritingScript,
  generateAllRoleplayScripts,
  generateAllWritingScripts,
  generateRoleplayScriptForSubject,
  generateWritingScriptForSubject,
  getKeywordsForSubject
};

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}
