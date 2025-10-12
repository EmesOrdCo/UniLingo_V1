import { supabase } from './supabase';
import { logger } from './logger';

export interface SubjectVocabulary {
  id: number;
  english_translation: string;
  subject: string;
  cefr_level?: string;
  french_translation?: string;
  spanish_translation?: string;
  german_translation?: string;
  mandarin_translation?: string;
  hindi_translation?: string;
  example_sentence_english?: string;
  example_sentence_french?: string;
  example_sentence_spanish?: string;
  example_sentence_german?: string;
  example_sentence_mandarin?: string;
  example_sentence_hindi?: string;
  image_url?: string;
}

export interface SubjectLessonScript {
  id: number;
  subject_name: string;
  cefr_level: string;
  english_lesson_script?: string;
  french_lesson_script?: string;
  spanish_lesson_script?: string;
  german_lesson_script?: string;
  mandarin_lesson_script?: string;
  hindi_lesson_script?: string;
}

export interface SubjectLessonData {
  subject: string;
  cefrLevel?: string;
  vocabulary: SubjectVocabulary[];
  lessonScript?: SubjectLessonScript;
  wordCount: number;
}

export class SubjectLessonService {
  /**
   * Get lesson data for a specific subject
   */
  static async getSubjectLesson(
    subjectName: string,
    nativeLanguage: string = 'French'
  ): Promise<SubjectLessonData> {
    try {
      logger.info(`📚 Fetching lesson data for subject: ${subjectName}`);

      // Fetch vocabulary for this subject
      const { data: vocabulary, error: vocabError } = await supabase
        .from('subject_words')
        .select('*')
        .eq('subject', subjectName)
        .order('id', { ascending: true });

      if (vocabError) {
        logger.error('Error fetching subject vocabulary:', vocabError);
        throw vocabError;
      }

      // Fetch lesson script if available
      const { data: lessonScripts, error: scriptError } = await supabase
        .from('lesson_scripts')
        .select('*')
        .eq('subject_name', subjectName)
        .limit(1);

      if (scriptError) {
        logger.warn('Error fetching lesson script:', scriptError);
      }

      const lessonScript = lessonScripts?.[0];
      const cefrLevel = lessonScript?.cefr_level || vocabulary?.[0]?.cefr_level;

      logger.info(`✅ Found ${vocabulary?.length || 0} vocabulary items for ${subjectName}`);

      return {
        subject: subjectName,
        cefrLevel,
        vocabulary: vocabulary || [],
        lessonScript,
        wordCount: vocabulary?.length || 0,
      };
    } catch (error) {
      logger.error('Error fetching subject lesson:', error);
      throw error;
    }
  }

  /**
   * Get lesson script for a subject in a specific language
   */
  static getLessonScriptForLanguage(
    lessonScript: SubjectLessonScript | undefined,
    nativeLanguage: string
  ): string | undefined {
    if (!lessonScript) return undefined;

    const languageMap: { [key: string]: string } = {
      'French': lessonScript.french_lesson_script || '',
      'Spanish': lessonScript.spanish_lesson_script || '',
      'German': lessonScript.german_lesson_script || '',
      'Chinese (Simplified)': lessonScript.mandarin_lesson_script || '',
      'Hindi': lessonScript.hindi_lesson_script || '',
      'English': lessonScript.english_lesson_script || '',
    };

    return languageMap[nativeLanguage] || lessonScript.english_lesson_script;
  }

  /**
   * Get translation for a vocabulary item in native language
   */
  static getTranslation(vocab: SubjectVocabulary, nativeLanguage: string): string {
    const languageMap: { [key: string]: string } = {
      'French': vocab.french_translation || vocab.english_translation,
      'Spanish': vocab.spanish_translation || vocab.english_translation,
      'German': vocab.german_translation || vocab.english_translation,
      'Chinese (Simplified)': vocab.mandarin_translation || vocab.english_translation,
      'Hindi': vocab.hindi_translation || vocab.english_translation,
    };

    return languageMap[nativeLanguage] || vocab.english_translation;
  }

  /**
   * Get example sentence for a vocabulary item in native language
   */
  static getExampleSentence(vocab: SubjectVocabulary, nativeLanguage: string): {
    english: string;
    native: string;
  } {
    const englishSentence = vocab.example_sentence_english || `Example with "${vocab.word_phrase}"`;
    
    const nativeExampleMap: { [key: string]: string } = {
      'French': vocab.example_sentence_french || englishSentence,
      'Spanish': vocab.example_sentence_spanish || englishSentence,
      'German': vocab.example_sentence_german || englishSentence,
      'Chinese (Simplified)': vocab.example_sentence_mandarin || englishSentence,
      'Hindi': vocab.example_sentence_hindi || englishSentence,
    };

    return {
      english: englishSentence,
      native: nativeExampleMap[nativeLanguage] || englishSentence,
    };
  }

  /**
   * Format vocabulary for lesson exercises
   */
  static formatVocabularyForExercises(
    vocabulary: SubjectVocabulary[],
    nativeLanguage: string
  ): Array<{
    id: string;
    english_term: string;
    keywords: string;  // Added for flashcard compatibility
    native_translation: string;
    example_sentence_en: string;
    example_sentence_native: string;
    definition?: string;  // Made optional since we don't have real definitions
  }> {
    return vocabulary.map((vocab) => {
      const examples = this.getExampleSentence(vocab, nativeLanguage);
      return {
        id: vocab.id.toString(),
        english_term: vocab.english_translation,
        keywords: vocab.english_translation,  // Added for flashcard compatibility
        native_translation: this.getTranslation(vocab, nativeLanguage),
        example_sentence_en: examples.english,
        example_sentence_native: examples.native,
        // Removed definition since we don't have real definitions in the database
      };
    });
  }
}

