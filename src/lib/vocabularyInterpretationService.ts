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
  /**
   * Interpret vocabulary for flashcards (native term on front, target term on back)
   */
  static interpretVocabularyForFlashcards(
    vocab: LessonVocabulary, 
    languagePair: LanguagePair
  ): InterpretedVocabulary {
    return {
      frontTerm: vocab.native_translation, // Native language term (front of card)
      backTerm: vocab.keywords, // Target language term (back of card)
      frontExample: vocab.example_sentence_target, // Target language example sentence
      backExample: vocab.example_sentence_native, // Native language example sentence
      definition: vocab.definition, // Definition in user's native language
      keywords: vocab.native_translation
    };
  }

  /**
   * Interpret vocabulary for fill-in-the-blank (target term for blank, target options)
   */
  static interpretVocabularyForFillInBlank(
    vocab: LessonVocabulary, 
    languagePair: LanguagePair
  ): InterpretedVocabulary {
    return {
      frontTerm: vocab.keywords, // Target language term (what gets blanked)
      backTerm: vocab.native_translation, // Native language term (for hints)
      frontExample: vocab.example_sentence_target, // Target language example sentence
      backExample: vocab.example_sentence_native, // Native language example sentence
      definition: vocab.definition, // Definition in user's native language
      keywords: vocab.native_translation
    };
  }

  /**
   * Interpret vocabulary for listen exercise (target term for audio and options)
   */
  static interpretVocabularyForListen(
    vocab: LessonVocabulary, 
    languagePair: LanguagePair
  ): InterpretedVocabulary {
    return {
      frontTerm: vocab.keywords, // Target language term (what gets played and selected)
      backTerm: vocab.native_translation, // Native language term (for reference)
      frontExample: vocab.example_sentence_target, // Target language example sentence
      backExample: vocab.example_sentence_native, // Native language example sentence
      definition: vocab.definition, // Definition in user's native language
      keywords: vocab.keywords // Target language term for listen exercise
    };
  }

  /**
   * Interpret vocabulary based on the user's language pair (legacy method - defaults to flashcards)
   */
  static interpretVocabulary(
    vocab: LessonVocabulary, 
    languagePair: LanguagePair
  ): InterpretedVocabulary {
    // Default to flashcards behavior for backward compatibility
    return this.interpretVocabularyForFlashcards(vocab, languagePair);
  }

  /**
   * Get the language direction for display purposes
   */
  static getLanguageDirection(languagePair: LanguagePair): {
    isEnglishTarget: boolean;
    targetLanguageName: string;
    nativeLanguageName: string;
  } {
    return {
      isEnglishTarget: languagePair.target === 'English' || languagePair.target === 'en-GB',
      targetLanguageName: languagePair.target,
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
   * Interpret a list of vocabulary for fill-in-the-blank exercises
   */
  static interpretVocabularyListForFillInBlank(
    vocabulary: LessonVocabulary[], 
    languagePair: LanguagePair
  ): InterpretedVocabulary[] {
    return vocabulary.map(vocab => this.interpretVocabularyForFillInBlank(vocab, languagePair));
  }

  /**
   * Interpret a list of vocabulary for listen exercises
   */
  static interpretVocabularyListForListen(
    vocabulary: LessonVocabulary[], 
    languagePair: LanguagePair
  ): InterpretedVocabulary[] {
    return vocabulary.map(vocab => this.interpretVocabularyForListen(vocab, languagePair));
  }

  /**
   * Interpret a list of vocabulary for flashcard exercises
   */
  static interpretVocabularyListForFlashcards(
    vocabulary: LessonVocabulary[], 
    languagePair: LanguagePair
  ): InterpretedVocabulary[] {
    return vocabulary.map(vocab => this.interpretVocabularyForFlashcards(vocab, languagePair));
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
