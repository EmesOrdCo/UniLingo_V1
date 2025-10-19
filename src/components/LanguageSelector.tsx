import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  FlatList,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useI18n, SupportedLanguage, i18nConfig, getLanguageDisplayName, getLanguageFlag } from '../lib/i18n';

interface LanguageSelectorProps {
  visible: boolean;
  onClose: () => void;
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({ visible, onClose }) => {
  const { currentLanguage, setLanguage, t } = useI18n();
  const [selectedLanguage, setSelectedLanguage] = useState<SupportedLanguage>(currentLanguage);

  const handleLanguageSelect = async (language: SupportedLanguage) => {
    setSelectedLanguage(language);
  };

  const handleConfirm = async () => {
    try {
      await setLanguage(selectedLanguage);
      onClose();
      
      // Show success message
      Alert.alert(
        t('common.success'),
        `Language changed to ${getLanguageDisplayName(selectedLanguage)}`,
        [{ text: t('common.ok') }]
      );
    } catch (error) {
      Alert.alert(
        t('common.error'),
        'Failed to change language. Please try again.',
        [{ text: t('common.ok') }]
      );
    }
  };

  const renderLanguageItem = ({ item }: { item: SupportedLanguage }) => {
    const isSelected = selectedLanguage === item;
    const displayName = getLanguageDisplayName(item);
    const flag = getLanguageFlag(item);

    return (
      <TouchableOpacity
        style={[
          styles.languageItem,
          isSelected && styles.languageItemSelected,
        ]}
        onPress={() => handleLanguageSelect(item)}
      >
        <View style={styles.languageItemContent}>
          <Text style={styles.flag}>{flag}</Text>
          <Text style={[
            styles.languageName,
            isSelected && styles.languageNameSelected,
          ]}>
            {displayName}
          </Text>
          {isSelected && (
            <Ionicons name="checkmark" size={20} color="#007AFF" />
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.cancelButton}>
            <Text style={styles.cancelText}>{t('common.cancel')}</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Select Language</Text>
          <TouchableOpacity onPress={handleConfirm} style={styles.confirmButton}>
            <Text style={styles.confirmText}>{t('common.confirm')}</Text>
          </TouchableOpacity>
        </View>

        {/* Language List */}
        <FlatList
          data={i18nConfig.supportedLanguages}
          renderItem={renderLanguageItem}
          keyExtractor={(item) => item}
          style={styles.languageList}
          showsVerticalScrollIndicator={false}
        />
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
  },
  cancelButton: {
    paddingVertical: 8,
  },
  cancelText: {
    fontSize: 16,
    color: '#007AFF',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
  },
  confirmButton: {
    paddingVertical: 8,
  },
  confirmText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
  },
  languageList: {
    flex: 1,
  },
  languageItem: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  languageItemSelected: {
    backgroundColor: '#f0f8ff',
  },
  languageItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  flag: {
    fontSize: 24,
    marginRight: 12,
  },
  languageName: {
    flex: 1,
    fontSize: 16,
    color: '#000000',
  },
  languageNameSelected: {
    fontWeight: '600',
    color: '#007AFF',
  },
});
