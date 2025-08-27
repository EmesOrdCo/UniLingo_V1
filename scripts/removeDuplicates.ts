import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function removeDuplicates() {
  try {
    console.log('🔍 Scanning database for duplicates...')
    
    // First, get all flashcards to analyze
    const { data: allFlashcards, error: fetchError } = await supabase
      .from('flashcards')
      .select('id, front, subject, topic, difficulty, created_at')
      .order('created_at', { ascending: true }) // Keep oldest records
    
    if (fetchError) {
      throw fetchError
    }
    
    console.log(`📚 Found ${allFlashcards.length} total flashcards`)
    
    // Group by front text to find duplicates
    const groupedByFront: { [key: string]: any[] } = {}
    
    allFlashcards.forEach(card => {
      if (card.front) {
        const frontText = card.front.trim().toLowerCase()
        if (!groupedByFront[frontText]) {
          groupedByFront[frontText] = []
        }
        groupedByFront[frontText].push(card)
      }
    })
    
    // Find duplicates (groups with more than 1 card)
    const duplicates = Object.entries(groupedByFront)
      .filter(([front, cards]) => cards.length > 1)
      .map(([front, cards]) => ({
        front,
        cards: cards.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
      }))
    
    console.log(`🔍 Found ${duplicates.length} duplicate groups`)
    
    if (duplicates.length === 0) {
      console.log('✅ No duplicates found!')
      return
    }
    
    // Show summary of duplicates
    duplicates.forEach(({ front, cards }) => {
      console.log(`\n📝 "${front}" (${cards.length} copies):`)
      cards.forEach((card, index) => {
        const keep = index === 0 ? '✅ KEEP' : '❌ DELETE'
        console.log(`  ${keep} ID: ${card.id}, Subject: ${card.subject}, Topic: ${card.topic}, Created: ${card.created_at}`)
      })
    })
    
    // Ask for confirmation
    console.log(`\n⚠️  This will delete ${duplicates.reduce((sum, { cards }) => sum + cards.length - 1, 0)} duplicate cards`)
    console.log('Press Ctrl+C to cancel, or wait 5 seconds to continue...')
    
    // Wait 5 seconds for user to cancel
    await new Promise(resolve => setTimeout(resolve, 5000))
    
    // Delete duplicates (keep the oldest one from each group)
    let deletedCount = 0
    
    for (const { front, cards } of duplicates) {
      // Keep the first (oldest) card, delete the rest
      const cardsToDelete = cards.slice(1)
      
      for (const card of cardsToDelete) {
        const { error: deleteError } = await supabase
          .from('flashcards')
          .delete()
          .eq('id', card.id)
        
        if (deleteError) {
          console.error(`❌ Failed to delete card ${card.id}:`, deleteError)
        } else {
          deletedCount++
          console.log(`🗑️  Deleted duplicate: "${front}" (ID: ${card.id})`)
        }
        
        // Small delay to avoid overwhelming the database
        await new Promise(resolve => setTimeout(resolve, 100))
      }
    }
    
    console.log(`\n🎉 Successfully removed ${deletedCount} duplicate flashcards!`)
    
    // Verify final count
    const { data: finalCount, error: countError } = await supabase
      .from('flashcards')
      .select('id', { count: 'exact' })
    
    if (!countError) {
      console.log(`📊 Final flashcard count: ${finalCount.length}`)
    }
    
  } catch (error) {
    console.error('❌ Error removing duplicates:', error)
    process.exit(1)
  }
}

// Run the script
removeDuplicates()
  .then(() => {
    console.log('✅ Script completed successfully')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Script failed:', error)
    process.exit(1)
  })
