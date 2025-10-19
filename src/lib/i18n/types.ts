export interface Translation {
  [key: string]: string | Translation;
}

export interface Translations {
  en: Translation;
  de: Translation;
}

export type SupportedLanguage = 'en' | 'de';

export interface I18nConfig {
  defaultLanguage: SupportedLanguage;
  supportedLanguages: SupportedLanguage[];
  fallbackLanguage: SupportedLanguage;
}

export interface I18nContextType {
  currentLanguage: SupportedLanguage;
  setLanguage: (language: SupportedLanguage) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
  isRTL: boolean;
}
