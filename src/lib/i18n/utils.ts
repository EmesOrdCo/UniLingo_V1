import { translations } from './translations';
import { SupportedLanguage } from './types';

export const interpolateString = (
  template: string,
  params: Record<string, string | number> = {}
): string => {
  return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    return params[key]?.toString() || match;
  });
};

export const getTranslation = (
  key: string,
  language: SupportedLanguage,
  params?: Record<string, string | number>
): string => {
  try {
    const translation = translations[language]?.[key];
    
    if (!translation) {
      // Fallback to English if translation not found
      const fallbackTranslation = translations.en[key];
      if (!fallbackTranslation) {
        console.warn(`Translation missing for key: ${key} in both ${language} and en`);
        return key; // Return the key itself if no translation found
      }
      return interpolateString(fallbackTranslation, params);
    }
    
    return interpolateString(translation, params);
  } catch (error) {
    console.error(`Error getting translation for key: ${key}`, error);
    return key; // Return the key itself on error
  }
};

export const getNestedTranslation = (
  key: string,
  language: SupportedLanguage,
  params?: Record<string, string | number>
): string => {
  try {
    const keys = key.split('.');
    let translation: any = translations[language];
    
    for (const k of keys) {
      if (translation && typeof translation === 'object' && k in translation) {
        translation = translation[k];
      } else {
        // Fallback to English
        translation = translations.en;
        for (const fallbackKey of keys) {
          if (translation && typeof translation === 'object' && fallbackKey in translation) {
            translation = translation[fallbackKey];
          } else {
            console.warn(`Translation missing for key: ${key} in both ${language} and en`);
            return key;
          }
        }
        break;
      }
    }
    
    if (typeof translation !== 'string') {
      console.warn(`Translation is not a string for key: ${key}`);
      return key;
    }
    
    return interpolateString(translation, params);
  } catch (error) {
    console.error(`Error getting nested translation for key: ${key}`, error);
    return key;
  }
};
