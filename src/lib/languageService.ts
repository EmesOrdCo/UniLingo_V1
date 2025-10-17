/**
 * Language Service
 * Maps database language codes to speech synthesis language codes
 */

// Database language codes (as stored in the users table)
export type DatabaseLanguageCode = 'en-GB' | 'es' | 'de' | 'it' | 'fr' | 'pt' | 'sv' | 'tr' | 'zh';

// Speech synthesis language codes (as supported by expo-speech)
export type SpeechLanguageCode = 'en' | 'es' | 'de' | 'it' | 'fr' | 'pt' | 'sv' | 'tr' | 'zh' | 'hi' | 'ja' | 'ko' | 'ar' | 'ru' | 'nl' | 'da' | 'fi' | 'pl' | 'th' | 'vi';

/**
 * Maps database language codes to speech language codes
 */
export function getSpeechLanguageCode(databaseLanguageCode: string | null | undefined): SpeechLanguageCode {
  if (!databaseLanguageCode) {
    return 'en'; // Default to English
  }

  const languageMap: Record<string, SpeechLanguageCode> = {
    // Language codes
    'en-GB': 'en',    // English (UK) -> English
    'en': 'en',       // English -> English
    'es': 'es',       // Spanish -> Spanish
    'de': 'de',       // German -> German
    'it': 'it',       // Italian -> Italian
    'fr': 'fr',       // French -> French
    'pt': 'pt',       // Portuguese -> Portuguese
    'sv': 'sv',       // Swedish -> Swedish
    'tr': 'tr',       // Turkish -> Turkish
    'zh': 'zh',       // Chinese (Simplified) -> Chinese
    // Full language names
    'English': 'en',
    'Spanish': 'es',
    'German': 'de',
    'Italian': 'it',
    'French': 'fr',
    'Portuguese': 'pt',
    'Swedish': 'sv',
    'Turkish': 'tr',
    'Chinese (Simplified)': 'zh',
    'Chinese (Traditional)': 'zh',
    'Hindi': 'hi',
    'Japanese': 'ja',
    'Korean': 'ko',
    'Arabic': 'ar',
    'Russian': 'ru',
    'Dutch': 'nl',
    'Danish': 'da',
    'Finnish': 'fi',
    'Polish': 'pl',
    'Thai': 'th',
    'Vietnamese': 'vi',
  };

  return languageMap[databaseLanguageCode] || 'en';
}

/**
 * Gets the appropriate speech language for target language text
 * Now supports bi-directional learning - target language can be any language
 */
export function getTargetLanguageSpeechCode(userTargetLanguage?: string | null): SpeechLanguageCode {
  return getSpeechLanguageCode(userTargetLanguage);
}

/**
 * Gets the appropriate speech language for native language text
 * Uses the user's native language from their profile
 */
export function getNativeLanguageSpeechCode(userNativeLanguage: string | null | undefined): SpeechLanguageCode {
  return getSpeechLanguageCode(userNativeLanguage);
}

/**
 * Determines which speech language to use based on the text content and user's language preferences
 * Now supports bi-directional learning
 */
export function getAppropriateSpeechLanguage(
  textLanguage: 'target' | 'native',
  userNativeLanguage?: string | null,
  userTargetLanguage?: string | null
): SpeechLanguageCode {
  if (textLanguage === 'target') {
    return getTargetLanguageSpeechCode(userTargetLanguage);
  } else {
    return getNativeLanguageSpeechCode(userNativeLanguage);
  }
}

/**
 * Determines the correct speech language for vocabulary items in bi-directional learning
 * Based on the user's language preferences and which text is being spoken
 */
export function getVocabularySpeechLanguage(
  textToSpeak: string,
  sourceText: string,
  targetText: string,
  userNativeLanguage?: string | null,
  userTargetLanguage?: string | null
): SpeechLanguageCode {
  // If the text to speak matches the source text, use source language
  if (textToSpeak === sourceText) {
    // Source language is native language in bi-directional learning
    return getNativeLanguageSpeechCode(userNativeLanguage);
  }
  
  // If the text to speak matches the target text, use target language
  if (textToSpeak === targetText) {
    // Target language is what the user is learning
    return getTargetLanguageSpeechCode(userTargetLanguage);
  }
  
  // Fallback: determine based on user's target language preference
  if (userTargetLanguage && userTargetLanguage !== 'English') {
    // User is learning a specific language, speak in that language
    return getTargetLanguageSpeechCode(userTargetLanguage);
  } else {
    // Default: speak in native language
    return getNativeLanguageSpeechCode(userNativeLanguage);
  }
}
