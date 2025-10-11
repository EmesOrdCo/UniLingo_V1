import { SubjectLessonService, SubjectVocabulary } from './subjectLessonService';
import { logger } from './logger';
import { supabase } from './supabase';

export interface UnitVocabularyItem {
  english: string;
  french: string;
}

export interface UnitSentence {
  french: string;
  english: string;
}

export interface UnitConversationExchange {
  id: string;
  speaker: 'user' | 'assistant';
  text: string;
  translation: string;
  type: 'greeting' | 'question' | 'response' | 'farewell';
}

export interface UnitWriteExercise {
  id: string;
  french: string;
  english: string;
  type: 'scramble';
}

export interface LessonScript {
  id: string;
  subject_name: string;
  cefr_level: string;
  english_script: string;
  french_script: string;
  german_script?: string;
  spanish_script?: string;
  hindi_script?: string;
  mandarin_script?: string;
}

export class UnitDataAdapter {
  /**
   * Get vocabulary data in the format expected by UnitWordsScreen
   */
  static async getUnitVocabulary(subjectName: string, nativeLanguage: string = 'French'): Promise<UnitVocabularyItem[]> {
    try {
      logger.info(`🔄 Converting database data to Unit vocabulary format for: ${subjectName}`);
      
      const lessonData = await SubjectLessonService.getSubjectLesson(subjectName, nativeLanguage);
      
      if (!lessonData.vocabulary || lessonData.vocabulary.length === 0) {
        logger.warn(`⚠️ No vocabulary found for subject: ${subjectName}`);
        return [];
      }

      // Convert to Unit format
      const unitVocabulary: UnitVocabularyItem[] = lessonData.vocabulary.map(vocab => ({
        english: vocab.english_translation,
        french: this.getTranslation(vocab, nativeLanguage)
      }));

      logger.info(`✅ Converted ${unitVocabulary.length} vocabulary items for Unit screen`);
      return unitVocabulary;
    } catch (error) {
      logger.error('Error converting vocabulary for Unit screen:', error);
      return [];
    }
  }

  /**
   * Get sentences data in the format expected by UnitListenScreen and UnitSpeakScreen
   */
  static async getUnitSentences(subjectName: string, nativeLanguage: string = 'French'): Promise<UnitSentence[]> {
    try {
      logger.info(`🔄 Converting database data to Unit sentences format for: ${subjectName}`);
      
      const lessonData = await SubjectLessonService.getSubjectLesson(subjectName, nativeLanguage);
      
      if (!lessonData.vocabulary || lessonData.vocabulary.length === 0) {
        logger.warn(`⚠️ No vocabulary found for subject: ${subjectName}`);
        return [];
      }

      // Convert vocabulary to sentences using example sentences
      const unitSentences: UnitSentence[] = lessonData.vocabulary
        .filter(vocab => vocab.example_sentence_english && this.getExampleSentence(vocab, nativeLanguage))
        .map(vocab => ({
          english: vocab.example_sentence_english!,
          french: this.getExampleSentence(vocab, nativeLanguage)!
        }));

      // If no example sentences, create simple sentences from vocabulary
      if (unitSentences.length === 0) {
        const fallbackSentences = lessonData.vocabulary.slice(0, 7).map(vocab => ({
          english: `This is ${vocab.english_translation}`,
          french: `Ceci est ${this.getTranslation(vocab, nativeLanguage)}`
        }));
        unitSentences.push(...fallbackSentences);
      }

      logger.info(`✅ Converted ${unitSentences.length} sentences for Unit screen`);
      return unitSentences;
    } catch (error) {
      logger.error('Error converting sentences for Unit screen:', error);
      return [];
    }
  }

  /**
   * Get conversation data in the format expected by UnitRoleplayScreen and UnitWriteScreen
   */
  static async getUnitConversation(subjectName: string, nativeLanguage: string = 'French'): Promise<UnitConversationExchange[]> {
    try {
      logger.info(`🔄 Converting database data to Unit conversation format for: ${subjectName}`);
      
      const lessonData = await SubjectLessonService.getSubjectLesson(subjectName, nativeLanguage);
      
      if (!lessonData.vocabulary || lessonData.vocabulary.length === 0) {
        logger.warn(`⚠️ No vocabulary found for subject: ${subjectName}`);
        return [];
      }

      // Create a conversation using the vocabulary and example sentences
      const conversation: UnitConversationExchange[] = [];
      
      // Take first few vocabulary items to create conversation
      const vocabItems = lessonData.vocabulary.slice(0, 4);
      
      vocabItems.forEach((vocab, index) => {
        if (vocab.example_sentence_english && this.getExampleSentence(vocab, nativeLanguage)) {
          conversation.push({
            id: `exchange_${index + 1}`,
            speaker: index % 2 === 0 ? 'user' : 'assistant',
            text: this.getExampleSentence(vocab, nativeLanguage)!,
            translation: vocab.example_sentence_english,
            type: index === 0 ? 'greeting' : index === vocabItems.length - 1 ? 'farewell' : 'response'
          });
        }
      });

      // If no conversation from examples, create simple ones
      if (conversation.length === 0) {
        conversation.push(
          {
            id: 'exchange_1',
            speaker: 'user',
            text: `Bonjour, comment allez-vous ?`,
            translation: 'Hello, how are you?',
            type: 'greeting'
          },
          {
            id: 'exchange_2',
            speaker: 'assistant',
            text: `Très bien, merci !`,
            translation: 'Very well, thank you!',
            type: 'response'
          }
        );
      }

      logger.info(`✅ Converted ${conversation.length} conversation exchanges for Unit screen`);
      return conversation;
    } catch (error) {
      logger.error('Error converting conversation for Unit screen:', error);
      return [];
    }
  }

  /**
   * Get lesson script for Write and Roleplay exercises
   */
  static async getLessonScript(subjectName: string, cefrLevel: string = 'A1', nativeLanguage: string = 'French'): Promise<LessonScript | null> {
    try {
      logger.info(`🔄 Fetching lesson script for: ${subjectName} (${cefrLevel})`);
      
      logger.info(`🔍 Querying lesson_scripts for:`, {
        subjectName,
        cefrLevel,
        subjectNameType: typeof subjectName,
        subjectNameLength: subjectName?.length
      });

      // Try exact match first
      let { data, error } = await supabase
        .from('lesson_scripts')
        .select('*')
        .eq('subject_name', subjectName)
        .eq('cefr_level', cefrLevel)
        .order('order_index', { ascending: true })
        .limit(1);

      // If no exact match, try case-insensitive search
      if (!data || data.length === 0) {
        logger.info(`🔍 No exact match found, trying case-insensitive search for: ${subjectName}`);
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('lesson_scripts')
          .select('*')
          .ilike('subject_name', subjectName)
          .eq('cefr_level', cefrLevel)
          .order('order_index', { ascending: true })
          .limit(1);
        
        data = fallbackData;
        error = fallbackError;
      }

      // If still no match, try without CEFR level constraint
      if (!data || data.length === 0) {
        logger.info(`🔍 No CEFR match found, trying without CEFR constraint for: ${subjectName}`);
        const { data: noCefrData, error: noCefrError } = await supabase
          .from('lesson_scripts')
          .select('*')
          .ilike('subject_name', subjectName)
          .order('order_index', { ascending: true })
          .limit(1);
        
        data = noCefrData;
        error = noCefrError;
      }

      logger.info(`🔍 Query result:`, {
        dataLength: data?.length || 0,
        error: error?.message || 'No error',
        foundRecords: data?.map(r => ({ id: r.id, subject_name: r.subject_name, cefr_level: r.cefr_level })) || []
      });

      if (error) {
        logger.error('Error fetching lesson script:', error);
        return null;
      }

      if (!data || data.length === 0) {
        logger.warn(`⚠️ No lesson script found for ${subjectName} (${cefrLevel})`);
        return null;
      }

      const script = data[0];
      
      // Debug: Log what we found in the database
      logger.info(`🔍 Database script data for ${subjectName}:`, {
        id: script.id,
        subject_name: script.subject_name,
        cefr_level: script.cefr_level,
        english_lesson_script_length: script.english_lesson_script?.length || 0,
        french_lesson_script_length: script.french_lesson_script?.length || 0,
        has_english: !!script.english_lesson_script,
        has_french: !!script.french_lesson_script,
        english_preview: script.english_lesson_script?.substring(0, 100) || 'No content'
      });
      
      const lessonScript: LessonScript = {
        id: script.id.toString(),
        subject_name: script.subject_name,
        cefr_level: script.cefr_level,
        english_script: script.english_lesson_script || '',
        french_script: script.french_lesson_script || '',
        german_script: script.german_lesson_script,
        spanish_script: script.spanish_lesson_script,
        hindi_script: script.hindi_lesson_script,
        mandarin_script: script.mandarin_lesson_script,
      };

      logger.info(`✅ Found lesson script for ${subjectName} (${cefrLevel})`);
      return lessonScript;
    } catch (error) {
      logger.error('Error fetching lesson script:', error);
      return null;
    }
  }

  /**
   * Get writing exercises from lesson script for UnitWriteScreen
   */
  static async getUnitWriteExercises(subjectName: string, cefrLevel: string = 'A1', nativeLanguage: string = 'French'): Promise<UnitWriteExercise[]> {
    try {
      logger.info(`🔄 Converting lesson script to Unit write exercises format for: ${subjectName}`);
      
      const lessonScript = await this.getLessonScript(subjectName, cefrLevel, nativeLanguage);
      
      if (!lessonScript) {
        logger.warn(`⚠️ No lesson script found for subject: ${subjectName}`);
        return [];
      }

      // For Write exercises, we want the user to write in English (target language)
      // So we use english_lesson_script as the target and create scrambled English sentences
      const englishScript = lessonScript.english_script;

      logger.info(`🔍 Write exercises debug for ${subjectName}:`, {
        englishScript: englishScript,
        englishScriptLength: englishScript?.length || 0,
        hasEnglishScript: !!englishScript,
        lessonScriptKeys: Object.keys(lessonScript)
      });

      if (!englishScript) {
        logger.warn(`⚠️ No English script content found for ${subjectName}`);
        return [];
      }

      // Split English script into sentences and create exercises
      const englishSentences = englishScript
        .split(/[.!?]+/)
        .map(s => s.trim())
        .filter(s => s.length > 0);
      
      const exercises: UnitWriteExercise[] = englishSentences.map((sentence, index) => ({
        id: `exercise_${index + 1}`,
        french: sentence, // For Write exercises, both fields are the same English text
        english: sentence, // User needs to unscramble English sentences
        type: 'scramble' as const
      }));

      logger.info(`✅ Converted ${exercises.length} write exercises from lesson script`);
      return exercises;
    } catch (error) {
      logger.error('Error converting write exercises for Unit screen:', error);
      return [];
    }
  }

  /**
   * Get conversation data from lesson script for UnitRoleplayScreen
   */
  static async getUnitConversationFromScript(subjectName: string, cefrLevel: string = 'A1', nativeLanguage: string = 'French'): Promise<UnitConversationExchange[]> {
    try {
      logger.info(`🔄 Converting lesson script to Unit conversation format for: ${subjectName}`);
      
      const lessonScript = await this.getLessonScript(subjectName, cefrLevel, nativeLanguage);
      
      if (!lessonScript) {
        logger.warn(`⚠️ No lesson script found for subject: ${subjectName}`);
        return [];
      }

      // For Roleplay exercises, we use English as the target language
      // The user will practice speaking English conversations
      const englishScript = lessonScript.english_script;

      if (!englishScript) {
        logger.warn(`⚠️ No English script content found for ${subjectName}`);
        return [];
      }

      // Split English script into conversation exchanges
      const exchanges = this.splitScriptIntoConversation(englishScript);
      
      logger.info(`✅ Converted ${exchanges.length} conversation exchanges from lesson script`);
      return exchanges;
    } catch (error) {
      logger.error('Error converting conversation for Unit screen:', error);
      return [];
    }
  }

  /**
   * Helper method to get translation for a vocabulary item
   */
  private static getTranslation(vocab: SubjectVocabulary, nativeLanguage: string): string {
    const languageMap: { [key: string]: string | undefined } = {
      'French': vocab.french_translation,
      'Spanish': vocab.spanish_translation,
      'German': vocab.german_translation,
      'Chinese (Simplified)': vocab.mandarin_translation,
      'Hindi': vocab.hindi_translation,
    };
    return languageMap[nativeLanguage] || vocab.english_translation || '';
  }

  /**
   * Helper method to get example sentence for a vocabulary item
   */
  private static getExampleSentence(vocab: SubjectVocabulary, nativeLanguage: string): string {
    const languageMap: { [key: string]: string | undefined } = {
      'French': vocab.example_sentence_french,
      'Spanish': vocab.example_sentence_spanish,
      'German': vocab.example_sentence_german,
      'Chinese (Simplified)': vocab.example_sentence_mandarin,
      'Hindi': vocab.example_sentence_hindi,
    };
    return languageMap[nativeLanguage] || vocab.example_sentence_english || '';
  }

  /**
   * Helper method to get script by language
   */
  private static getScriptByLanguage(lessonScript: LessonScript, nativeLanguage: string): string {
    const languageMap: { [key: string]: string } = {
      'French': lessonScript.french_script,
      'Spanish': lessonScript.spanish_script || '',
      'German': lessonScript.german_script || '',
      'Chinese (Simplified)': lessonScript.mandarin_script || '',
      'Hindi': lessonScript.hindi_script || '',
    };
    const script = languageMap[nativeLanguage];
    
    // Log for debugging
    console.log(`🔍 Looking for ${nativeLanguage} script:`, {
      nativeLanguage,
      found: !!script,
      scriptLength: script?.length || 0,
      availableScripts: {
        french: !!lessonScript.french_script,
        spanish: !!lessonScript.spanish_script,
        german: !!lessonScript.german_script,
        mandarin: !!lessonScript.mandarin_script,
        hindi: !!lessonScript.hindi_script,
      }
    });
    
    return script || lessonScript.french_script;
  }

  /**
   * Helper method to split script into sentences for write exercises
   */
  private static splitScriptIntoSentences(targetScript: string, englishScript: string): { french: string; english: string }[] {
    // Split scripts by sentences (period, exclamation, question mark)
    const targetSentences = targetScript
      .split(/[.!?]+/)
      .map(s => s.trim())
      .filter(s => s.length > 0);

    const englishSentences = englishScript
      .split(/[.!?]+/)
      .map(s => s.trim())
      .filter(s => s.length > 0);

    // Pair up sentences
    const pairs: { french: string; english: string }[] = [];
    const maxLength = Math.min(targetSentences.length, englishSentences.length);
    
    for (let i = 0; i < maxLength; i++) {
      if (targetSentences[i] && englishSentences[i]) {
        pairs.push({
          french: targetSentences[i],
          english: englishSentences[i]
        });
      }
    }

    return pairs;
  }

  /**
   * Helper method to split script into conversation exchanges for roleplay
   */
  private static splitScriptIntoConversation(englishScript: string): UnitConversationExchange[] {
    // Split English script by '/' separators (common format in lesson scripts)
    const englishLines = englishScript
      .split(/\s*\/\s*/)
      .map(s => s.trim())
      .filter(s => s.length > 0);

    console.log('🔍 Split script into lines:', englishLines);

    // Create conversation exchanges - A is Assistant, B is User
    const exchanges: UnitConversationExchange[] = [];
    
    for (let i = 0; i < englishLines.length; i++) {
      if (englishLines[i]) {
        // Determine speaker based on the line content (A: or B:)
        let speaker = 'assistant'; // Default
        let text = englishLines[i];
        
        if (text.startsWith('A:')) {
          speaker = 'assistant';
          text = text.substring(2).trim(); // Remove "A:" prefix
        } else if (text.startsWith('B:')) {
          speaker = 'user';
          text = text.substring(2).trim(); // Remove "B:" prefix
        } else {
          // If no prefix, alternate based on position
          speaker = i % 2 === 0 ? 'assistant' : 'user';
        }
        
        exchanges.push({
          id: `exchange_${i + 1}`,
          speaker: speaker as 'user' | 'assistant',
          text: text,
          translation: text, // Same text since it's English practice
          type: i === 0 ? 'greeting' : i === englishLines.length - 1 ? 'farewell' : 'response'
        });
      }
    }

    return exchanges;
  }
}
