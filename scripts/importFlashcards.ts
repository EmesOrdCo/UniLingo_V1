import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'

// Configuration
const supabaseUrl = process.env.SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const userId = process.env.TARGET_USER_ID! // The user who will own these flashcards

// Initialize Supabase client with service role key for admin access
const supabase = createClient(supabaseUrl, supabaseServiceKey)

interface RawFlashcard {
  front: string
  back: string
  subject: string
  topic: string
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  frontLanguage: 'english' | 'native'
  nativeLanguage: string
  pinyin?: string
  example: string
  pronunciation: string
  tags: string[]
}

interface DatabaseFlashcard {
  user_id: string
  front: string
  back: string
  subject: string
  topic: string
  difficulty: string
  front_language: string
  native_language: string
  pinyin?: string
  example: string
  pronunciation: string
  tags: string[]
  source: string
  review_count: number
  mastery: number
  next_review: string
  created_at: string
}

async function importFlashcards(jsonFilePath: string) {
  try {
    console.log('🚀 Starting flashcard import...')
    
    // Read and parse JSON file
    const jsonData = fs.readFileSync(jsonFilePath, 'utf8')
    const rawFlashcards: RawFlashcard[] = JSON.parse(jsonData)
    
    console.log(`📚 Found ${rawFlashcards.length} flashcards to import`)
    
    // Transform data for database
    const databaseFlashcards: DatabaseFlashcard[] = rawFlashcards.map(card => ({
      user_id: userId,
      front: card.front,
      back: card.back,
      subject: card.subject,
      topic: card.topic,
      difficulty: card.difficulty,
      front_language: card.frontLanguage,
      native_language: card.nativeLanguage,
      pinyin: card.pinyin,
      example: card.example,
      pronunciation: card.pronunciation,
      tags: card.tags,
      source: 'ai_generated',
      review_count: 0,
      mastery: 0,
      next_review: new Date().toISOString(),
      created_at: new Date().toISOString(),
    }))
    
    // Import in batches to avoid timeout
    const batchSize = 100
    let importedCount = 0
    
    for (let i = 0; i < databaseFlashcards.length; i += batchSize) {
      const batch = databaseFlashcards.slice(i, i + batchSize)
      
      console.log(`📦 Importing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(databaseFlashcards.length / batchSize)}`)
      
      const { data, error } = await supabase
        .from('flashcards')
        .insert(batch)
        .select('id')
      
      if (error) {
        console.error(`❌ Error importing batch ${i / batchSize + 1}:`, error)
        throw error
      }
      
      importedCount += batch.length
      console.log(`✅ Imported ${importedCount}/${databaseFlashcards.length} flashcards`)
      
      // Small delay between batches to avoid overwhelming the database
      if (i + batchSize < databaseFlashcards.length) {
        await new Promise(resolve => setTimeout(resolve, 1000))
      }
    }
    
    console.log(`🎉 Successfully imported ${importedCount} flashcards!`)
    
    // Create reverse cards (optional)
    if (process.env.CREATE_REVERSE_CARDS === 'true') {
      console.log('🔄 Creating reverse cards...')
      await createReverseCards(importedCount)
    }
    
  } catch (error) {
    console.error('❌ Import failed:', error)
    process.exit(1)
  }
}

async function createReverseCards(totalCards: number) {
  try {
    // Get all imported cards
    const { data: cards, error } = await supabase
      .from('flashcards')
      .select('*')
      .eq('user_id', userId)
      .eq('source', 'ai_generated')
      .order('created_at', { ascending: false })
      .limit(totalCards)
    
    if (error) throw error
    
    console.log(`🔄 Creating reverse cards for ${cards.length} flashcards...`)
    
    let reverseCount = 0
    for (const card of cards) {
      const reverseCard: DatabaseFlashcard = {
        user_id: userId,
        front: card.back,
        back: card.front,
        subject: card.subject,
        topic: card.topic,
        difficulty: card.difficulty,
        front_language: card.front_language === 'english' ? 'native' : 'english',
        native_language: card.native_language,
        pinyin: card.pinyin,
        example: card.example,
        pronunciation: card.pronunciation,
        tags: card.tags,
        source: 'ai_generated',
        review_count: 0,
        mastery: 0,
        next_review: new Date().toISOString(),
        created_at: new Date().toISOString(),
      }
      
      const { error: insertError } = await supabase
        .from('flashcards')
        .insert([reverseCard])
      
      if (insertError) {
        console.error(`❌ Error creating reverse card:`, insertError)
      } else {
        reverseCount++
      }
    }
    
    console.log(`✅ Created ${reverseCount} reverse cards`)
    
  } catch (error) {
    console.error('❌ Error creating reverse cards:', error)
  }
}

// CLI usage
if (require.main === module) {
  const jsonFilePath = process.argv[2]
  
  if (!jsonFilePath) {
    console.error('❌ Please provide a JSON file path')
    console.log('Usage: npm run import-flashcards <path-to-json>')
    process.exit(1)
  }
  
  if (!fs.existsSync(jsonFilePath)) {
    console.error(`❌ File not found: ${jsonFilePath}`)
    process.exit(1)
  }
  
  importFlashcards(jsonFilePath)
}

export { importFlashcards }
