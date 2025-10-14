/**
 * Language Service
 * Maps database language codes to speech synthesis language codes
 */

// Database language codes (as stored in the users table)
export type DatabaseLanguageCode = 'en-GB' | 'es' | 'de' | 'it' | 'fr' | 'pt' | 'sv' | 'tr' | 'zh';

// Speech synthesis language codes (as supported by expo-speech)
export type SpeechLanguageCode = 'en' | 'es' | 'de' | 'it' | 'fr' | 'pt' | 'sv' | 'tr' | 'zh';

/**
 * Maps database language codes to speech language codes
 */
export function getSpeechLanguageCode(databaseLanguageCode: string | null | undefined): SpeechLanguageCode {
  if (!databaseLanguageCode) {
    return 'en'; // Default to English
  }

  const languageMap: Record<string, SpeechLanguageCode> = {
    'en-GB': 'en',    // English (UK) -> English
    'en': 'en',       // English -> English
    'es': 'es',       // Spanish -> Spanish
    'de': 'de',       // German -> German
    'it': 'it',       // Italian -> Italian
    'fr': 'fr',       // French -> French
    'pt': 'pt',       // Portuguese -> Portuguese
    'sv': 'sv',       // Swedish -> Swedish
    'tr': 'tr',       // Turkish -> Turkish
    'zh': 'zh',       // Chinese/Mandarin -> Chinese
  };

  return languageMap[databaseLanguageCode] || 'en';
}

/**
 * Gets the appropriate speech language for target language text
 * Target language is always English for this app
 */
export function getTargetLanguageSpeechCode(): SpeechLanguageCode {
  return 'en'; // Always English for target language
}

/**
 * Gets the appropriate speech language for native language text
 * Uses the user's native language from their profile
 */
export function getNativeLanguageSpeechCode(userNativeLanguage: string | null | undefined): SpeechLanguageCode {
  return getSpeechLanguageCode(userNativeLanguage);
}

/**
 * Determines which speech language to use based on the text content
 * - If text is in target language (English): use English speech
 * - If text is in native language: use native language speech
 */
export function getAppropriateSpeechLanguage(
  textLanguage: 'target' | 'native',
  userNativeLanguage?: string | null
): SpeechLanguageCode {
  if (textLanguage === 'target') {
    return getTargetLanguageSpeechCode();
  } else {
    return getNativeLanguageSpeechCode(userNativeLanguage);
  }
}
