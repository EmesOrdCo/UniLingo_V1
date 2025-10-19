import { I18nConfig, SupportedLanguage } from './types';

export const i18nConfig: I18nConfig = {
  defaultLanguage: 'en',
  supportedLanguages: ['en', 'de'],
  fallbackLanguage: 'en',
};

export const getLanguageDisplayName = (language: SupportedLanguage): string => {
  const names: Record<SupportedLanguage, string> = {
    en: 'English',
    de: 'Deutsch',
  };
  return names[language];
};

export const getLanguageFlag = (language: SupportedLanguage): string => {
  const flags: Record<SupportedLanguage, string> = {
    en: '🇺🇸',
    de: '🇩🇪',
  };
  return flags[language];
};
