import { LessonVocabulary } from './lessonService';

export interface LanguagePair {
  native: string;
  target: string;
}

export interface InterpretedVocabulary {
  frontTerm: string;
  backTerm: string;
  frontExample: string;
  backExample: string;
  definition: string;
  keywords: string;
}

export class VocabularyInterpretationService {
  /**
   * Interpret vocabulary based on the user's language pair
   * This allows the same vocabulary data to work for any language direction
   */
  static interpretVocabulary(
    vocab: LessonVocabulary, 
    languagePair: LanguagePair
  ): InterpretedVocabulary {
    const isEnglishTarget = languagePair.target === 'English' || languagePair.target === 'en-GB';
    
    if (isEnglishTarget) {
      // English target language (current behavior)
      // Use keywords field as it contains the actual target term
      const targetTerm = typeof vocab.keywords === 'string' ? vocab.keywords : (vocab.english_term || '');
      return {
        frontTerm: targetTerm,
        backTerm: vocab.native_translation,
        frontExample: vocab.example_sentence_target,
        backExample: vocab.example_sentence_native,
        definition: vocab.definition,
        keywords: targetTerm
      };
    } else {
      // Non-English target language (reverse direction)
      // Map the existing fields to the reverse direction
      const targetTerm = typeof vocab.keywords === 'string' ? vocab.keywords : (vocab.english_term || '');
      return {
        frontTerm: vocab.native_translation, // Native language becomes the term to learn
        backTerm: targetTerm, // Keywords field becomes the translation
        frontExample: vocab.example_sentence_native, // Native example becomes the target example
        backExample: vocab.example_sentence_target, // English example becomes the native example
        definition: vocab.definition,
        keywords: vocab.native_translation
      };
    }
  }

  /**
   * Get the language direction for display purposes
   */
  static getLanguageDirection(languagePair: LanguagePair): {
    isEnglishTarget: boolean;
    targetLanguageName: string;
    nativeLanguageName: string;
  } {
    const isEnglishTarget = languagePair.target === 'English' || languagePair.target === 'en-GB';
    
    return {
      isEnglishTarget,
      targetLanguageName: isEnglishTarget ? 'English' : languagePair.target,
      nativeLanguageName: languagePair.native
    };
  }

  /**
   * Get language display names from language codes
   */
  static getLanguageDisplayName(languageCode: string): string {
    const languageMap: { [key: string]: string } = {
      'en-GB': 'English',
      'es': 'Spanish',
      'de': 'German',
      'it': 'Italian',
      'fr': 'French',
      'pt': 'Portuguese',
      'sv': 'Swedish',
      'tr': 'Turkish'
    };
    
    return languageMap[languageCode] || languageCode;
  }

  /**
   * Interpret multiple vocabulary items at once
   */
  static interpretVocabularyList(
    vocabulary: LessonVocabulary[], 
    languagePair: LanguagePair
  ): InterpretedVocabulary[] {
    return vocabulary.map(vocab => this.interpretVocabulary(vocab, languagePair));
  }
}
