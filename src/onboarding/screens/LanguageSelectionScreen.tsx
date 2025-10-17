import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeTokens } from '../../theme/useThemeTokens';
import { Screen, OptionGrid } from '../ui';
import { useOnboardingStore, useOnboardingField } from '../state';
import { languageOptions, targetLanguageOptions } from '../constants';
import { validateScreen } from '../schema';

export function LanguageSelectionScreen() {
  const theme = useThemeTokens();
  const navigation = useNavigation();
  const { nextStep, previousStep } = useOnboardingStore();
  const [showInfoModal, setShowInfoModal] = React.useState(false);
  
  // Get current values from store
  const { value: nativeLanguage, setValue: setNativeLanguage } = useOnboardingField('nativeLanguage');
  const { value: targetLanguage, setValue: setTargetLanguage } = useOnboardingField('targetLanguage');

  // Set default languages if not set
  useEffect(() => {
    if (!nativeLanguage) {
      setNativeLanguage('en-GB');
    }
    // Set default target language to a highlighted language
    if (!targetLanguage) {
      setTargetLanguage('en'); // Default to English (highlighted language)
    }
  }, [nativeLanguage, setNativeLanguage, targetLanguage, setTargetLanguage]);

  // Check if both languages are selected
  const canContinue = !!(nativeLanguage && targetLanguage);

  // Handle native language selection
  const handleNativeLanguageChange = (selectedIds: string[]) => {
    if (selectedIds.length > 0) {
      setNativeLanguage(selectedIds[0]);
    }
  };

  // Handle target language selection
  const handleTargetLanguageChange = (selectedIds: string[]) => {
    if (selectedIds.length > 0) {
      setTargetLanguage(selectedIds[0]);
    }
  };

  // Handle continue
  const handleContinue = () => {
    if (canContinue) {
      // Validate the current data
      const validation = validateScreen('language-selection', {
        nativeLanguage,
        targetLanguage,
      });

      if (validation.valid) {
        nextStep();
      }
    }
  };

  // Handle back
  const handleBack = () => {
    previousStep();
  };

  // Convert language options to grid format
  const nativeLanguageOptions = languageOptions.map(lang => ({
    id: lang.code,
    title: lang.label,
    leftEmoji: lang.flagEmoji,
    highlighted: lang.highlighted,
  }));

  // Show all languages except the selected native language as target options
  const targetLanguageGridOptions = targetLanguageOptions
    .filter(lang => lang.code !== nativeLanguage) // Exclude native language
    .map((lang: any) => ({
      id: lang.code,
      title: lang.label,
      leftEmoji: lang.flagEmoji,
      highlighted: lang.highlighted,
      disabled: false, // Enable selection
    }));

  return (
    <>
      <Screen
        title="What languages do you speak?"
        subtitle="This helps us personalize your learning experience"
        canContinue={canContinue}
        onBack={handleBack}
        onContinue={handleContinue}
        showBackButton={true}
      >
        <View style={styles.container}>
          {/* Native Language Section */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>
              I speak...
            </Text>
            <OptionGrid
              options={nativeLanguageOptions}
              selectedIds={nativeLanguage ? [nativeLanguage] : []}
              onSelectionChange={handleNativeLanguageChange}
              accessibilityLabel="Select your native language"
            />
          </View>

          {/* Target Language Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>
                I want to learn...
              </Text>
              <TouchableOpacity
                onPress={() => setShowInfoModal(true)}
                style={styles.infoButton}
                accessibilityLabel="Learn about starred languages"
                accessibilityHint="Tap to learn about languages with general lesson access"
              >
                <Ionicons name="information-circle-outline" size={20} color={theme.colors.primary} />
              </TouchableOpacity>
            </View>
            <OptionGrid
              options={targetLanguageGridOptions}
              selectedIds={targetLanguage ? [targetLanguage] : []}
              onSelectionChange={handleTargetLanguageChange} // Enable selection
              accessibilityLabel="Select the language you want to learn"
            />
          </View>
        </View>
      </Screen>

      {/* Info Modal */}
      <Modal
        visible={showInfoModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowInfoModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.colors.background.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.colors.text.dark }]}>
                ⭐ Starred Languages
              </Text>
              <TouchableOpacity
                onPress={() => setShowInfoModal(false)}
                style={styles.closeButton}
                accessibilityLabel="Close modal"
              >
                <Ionicons name="close" size={24} color={theme.colors.text.medium} />
              </TouchableOpacity>
            </View>
            
            <Text style={[styles.modalText, { color: theme.colors.text.medium }]}>
              Languages marked with a star (⭐) have access to general lessons that teach standard day-to-day vocabulary and common phrases.
            </Text>
            
            <Text style={[styles.modalSubtext, { color: theme.colors.text.light }]}>
              These languages include: English, Chinese (Simplified), Chinese (Traditional), Hindi, Spanish, French, and German.
            </Text>
            
            <TouchableOpacity
              style={[styles.modalButton, { backgroundColor: theme.colors.primary }]}
              onPress={() => setShowInfoModal(false)}
            >
              <Text style={[styles.modalButtonText, { color: theme.colors.background.surface }]}>
                Got it
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 32,
  },
  section: {
    gap: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    lineHeight: 24,
  },
  infoButton: {
    padding: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    lineHeight: 26,
  },
  closeButton: {
    padding: 4,
  },
  modalText: {
    fontSize: 16,
    lineHeight: 22,
    marginBottom: 12,
  },
  modalSubtext: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 24,
  },
  modalButton: {
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});