import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { I18nContextType, SupportedLanguage } from './types';
import { i18nConfig } from './config';
import { getStoredLanguage, setStoredLanguage } from './storage';
import { getTranslation } from './utils';

const I18nContext = createContext<I18nContextType | undefined>(undefined);

interface I18nProviderProps {
  children: ReactNode;
}

export const I18nProvider: React.FC<I18nProviderProps> = ({ children }) => {
  const [currentLanguage, setCurrentLanguageState] = useState<SupportedLanguage>(
    i18nConfig.defaultLanguage
  );
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const initializeLanguage = async () => {
      try {
        const storedLanguage = await getStoredLanguage();
        if (storedLanguage && i18nConfig.supportedLanguages.includes(storedLanguage)) {
          setCurrentLanguageState(storedLanguage);
        }
      } catch (error) {
        console.error('Error initializing language:', error);
      } finally {
        setIsInitialized(true);
      }
    };

    initializeLanguage();
  }, []);

  const setLanguage = async (language: SupportedLanguage) => {
    if (!i18nConfig.supportedLanguages.includes(language)) {
      console.warn(`Unsupported language: ${language}`);
      return;
    }

    try {
      setCurrentLanguageState(language);
      await setStoredLanguage(language);
    } catch (error) {
      console.error('Error setting language:', error);
    }
  };

  const t = (key: string, params?: Record<string, string | number>): string => {
    return getTranslation(key, currentLanguage, params);
  };

  const isRTL = false; // German is LTR, but this could be extended for other languages

  const value: I18nContextType = {
    currentLanguage,
    setLanguage,
    t,
    isRTL,
  };

  // Don't render children until language is initialized
  if (!isInitialized) {
    return null;
  }

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
};

export const useI18n = (): I18nContextType => {
  const context = useContext(I18nContext);
  if (context === undefined) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
};

// Convenience hook for just the translation function
export const useTranslation = () => {
  const { t } = useI18n();
  return { t };
};
