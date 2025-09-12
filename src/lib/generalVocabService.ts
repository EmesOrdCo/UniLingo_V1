import { supabase } from './supabase';

export interface GeneralVocabItem {
  id: string;
  english_term: string;
  definition: string;
  example_sentence: string;
  sfi_rank: number;
  cefr_level: string;
  topic_group: string;
  translation_spanish?: string;
  translation_german?: string;
  example_sentence_spanish?: string;
  example_sentence_german?: string;
  example_sentence_2?: string;
  example_sentence_3?: string;
  created_at: string;
  updated_at: string;
}

export interface ProcessedVocabItem {
  id: string;
  english_term: string;
  definition: string;
  example_sentence: string;
  native_translation: string;
  example_sentence_native: string;
  sfi_rank: number;
  cefr_level: string;
  topic_group: string;
  difficulty_rank: number;
}

export class GeneralVocabService {
  /**
   * Get vocabulary items by topic group and user's native language
   */
  static async getVocabByTopicGroup(
    topicGroup: string, 
    nativeLanguage: string
  ): Promise<ProcessedVocabItem[]> {
    try {
      console.log(`🔍 Fetching vocabulary for topic: ${topicGroup}, native language: ${nativeLanguage}`);
      
      const { data, error } = await supabase
        .from('general_english_vocab')
        .select('*')
        .eq('topic_group', topicGroup)
        .order('sfi_rank', { ascending: true });

      if (error) {
        console.error('Error fetching general vocabulary:', error);
        throw error;
      }

      if (!data || data.length === 0) {
        console.log(`No vocabulary found for topic group: ${topicGroup}`);
        return [];
      }

      // Process the data to include native language translations
      const processedData = data.map((item: GeneralVocabItem) => {
        const processedItem: ProcessedVocabItem = {
          id: item.id,
          english_term: item.english_term,
          definition: item.definition,
          example_sentence: item.example_sentence,
          native_translation: this.getNativeTranslation(item, nativeLanguage),
          example_sentence_native: this.getNativeExampleSentence(item, nativeLanguage),
          sfi_rank: item.sfi_rank,
          cefr_level: item.cefr_level,
          topic_group: item.topic_group,
          difficulty_rank: this.mapSfiRankToDifficulty(item.sfi_rank)
        };
        
        return processedItem;
      });

      console.log(`✅ Found ${processedData.length} vocabulary items for ${topicGroup}`);
      return processedData;

    } catch (error) {
      console.error('Error in getVocabByTopicGroup:', error);
      return [];
    }
  }

  /**
   * Get native translation based on user's native language
   */
  private static getNativeTranslation(item: GeneralVocabItem, nativeLanguage: string): string {
    const languageMap: { [key: string]: string } = {
      'spanish': item.translation_spanish || '',
      'german': item.translation_german || ''
    };

    const translation = languageMap[nativeLanguage.toLowerCase()];
    return translation || item.english_term; // Fallback to English term if no translation
  }

  /**
   * Get native example sentence based on user's native language
   */
  private static getNativeExampleSentence(item: GeneralVocabItem, nativeLanguage: string): string {
    const languageMap: { [key: string]: string } = {
      'spanish': item.example_sentence_spanish || '',
      'german': item.example_sentence_german || ''
    };

    const exampleSentence = languageMap[nativeLanguage.toLowerCase()];
    return exampleSentence || item.example_sentence; // Fallback to English example
  }

  /**
   * Map SFI rank to difficulty rank (1-5 scale)
   */
  private static mapSfiRankToDifficulty(sfiRank: number): number {
    if (sfiRank <= 100) return 1; // Beginner
    if (sfiRank <= 200) return 2; // Easy
    if (sfiRank <= 300) return 3; // Medium
    if (sfiRank <= 400) return 4; // Hard
    return 5; // Expert
  }

  /**
   * Get all available topic groups
   */
  static async getTopicGroups(): Promise<string[]> {
    try {
      const { data, error } = await supabase
        .from('general_english_vocab')
        .select('topic_group')
        .not('topic_group', 'is', null);

      if (error) {
        console.error('Error fetching topic groups:', error);
        return [];
      }

      const uniqueTopics = [...new Set(data?.map(item => item.topic_group) || [])];
      return uniqueTopics.sort();
    } catch (error) {
      console.error('Error in getTopicGroups:', error);
      return [];
    }
  }

  /**
   * Get vocabulary count for a specific topic group
   */
  static async getVocabCountByTopicGroup(topicGroup: string): Promise<number> {
    try {
      const { count, error } = await supabase
        .from('general_english_vocab')
        .select('*', { count: 'exact', head: true })
        .eq('topic_group', topicGroup);

      if (error) {
        console.error('Error fetching vocabulary count:', error);
        return 0;
      }

      return count || 0;
    } catch (error) {
      console.error('Error in getVocabCountByTopicGroup:', error);
      return 0;
    }
  }
}
