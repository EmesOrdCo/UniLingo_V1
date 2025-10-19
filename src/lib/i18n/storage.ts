import AsyncStorage from '@react-native-async-storage/async-storage';
import { SupportedLanguage } from './types';

const LANGUAGE_STORAGE_KEY = 'user_preferred_language';

export const getStoredLanguage = async (): Promise<SupportedLanguage | null> => {
  try {
    const stored = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
    return stored as SupportedLanguage | null;
  } catch (error) {
    console.error('Error getting stored language:', error);
    return null;
  }
};

export const setStoredLanguage = async (language: SupportedLanguage): Promise<void> => {
  try {
    await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, language);
  } catch (error) {
    console.error('Error setting stored language:', error);
  }
};

export const clearStoredLanguage = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(LANGUAGE_STORAGE_KEY);
  } catch (error) {
    console.error('Error clearing stored language:', error);
  }
};
