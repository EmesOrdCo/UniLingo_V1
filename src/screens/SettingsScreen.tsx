import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useI18n, getLanguageDisplayName, getLanguageFlag } from '../lib/i18n';
import { LanguageSelector } from '../components/LanguageSelector';

export default function SettingsScreen() {
  const navigation = useNavigation();
  const { currentLanguage, t } = useI18n();
  const [showLanguageSelector, setShowLanguageSelector] = useState(false);

  const handleLanguagePress = () => {
    setShowLanguageSelector(true);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#1e293b" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('nav.settings')}</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Language Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('common.language')}</Text>
          
          <TouchableOpacity style={styles.settingItem} onPress={handleLanguagePress}>
            <View style={styles.settingLeft}>
              <Text style={styles.flag}>{getLanguageFlag(currentLanguage)}</Text>
              <View style={styles.settingText}>
                <Text style={styles.settingTitle}>{t('common.language')}</Text>
                <Text style={styles.settingSubtitle}>{getLanguageDisplayName(currentLanguage)}</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#64748b" />
          </TouchableOpacity>
        </View>

        {/* Demo Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Translation Demo</Text>
          
          <View style={styles.demoCard}>
            <Text style={styles.demoTitle}>Common UI Elements</Text>
            <View style={styles.demoRow}>
              <Text style={styles.demoLabel}>Loading:</Text>
              <Text style={styles.demoValue}>{t('common.loading')}</Text>
            </View>
            <View style={styles.demoRow}>
              <Text style={styles.demoLabel}>Success:</Text>
              <Text style={styles.demoValue}>{t('common.success')}</Text>
            </View>
            <View style={styles.demoRow}>
              <Text style={styles.demoLabel}>Error:</Text>
              <Text style={styles.demoValue}>{t('common.error')}</Text>
            </View>
            <View style={styles.demoRow}>
              <Text style={styles.demoLabel}>Cancel:</Text>
              <Text style={styles.demoValue}>{t('common.cancel')}</Text>
            </View>
          </View>

          <View style={styles.demoCard}>
            <Text style={styles.demoTitle}>Navigation</Text>
            <View style={styles.demoRow}>
              <Text style={styles.demoLabel}>Home:</Text>
              <Text style={styles.demoValue}>{t('nav.home')}</Text>
            </View>
            <View style={styles.demoRow}>
              <Text style={styles.demoLabel}>Games:</Text>
              <Text style={styles.demoValue}>{t('nav.games')}</Text>
            </View>
            <View style={styles.demoRow}>
              <Text style={styles.demoLabel}>Profile:</Text>
              <Text style={styles.demoValue}>{t('nav.profile')}</Text>
            </View>
          </View>

          <View style={styles.demoCard}>
            <Text style={styles.demoTitle}>Games</Text>
            <View style={styles.demoRow}>
              <Text style={styles.demoLabel}>Flashcard Quiz:</Text>
              <Text style={styles.demoValue}>{t('games.flashcardQuiz')}</Text>
            </View>
            <View style={styles.demoRow}>
              <Text style={styles.demoLabel}>Hangman:</Text>
              <Text style={styles.demoValue}>{t('games.hangman')}</Text>
            </View>
            <View style={styles.demoRow}>
              <Text style={styles.demoLabel}>Start Quiz:</Text>
              <Text style={styles.demoValue}>{t('games.startQuiz')}</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      <LanguageSelector
        visible={showLanguageSelector}
        onClose={() => setShowLanguageSelector(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
    textAlign: 'center',
    marginRight: 40, // Compensate for back button
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  section: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 12,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  flag: {
    fontSize: 24,
    marginRight: 12,
  },
  settingText: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1e293b',
  },
  settingSubtitle: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 2,
  },
  demoCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  demoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 12,
  },
  demoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  demoLabel: {
    fontSize: 14,
    color: '#64748b',
    flex: 1,
  },
  demoValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1e293b',
    flex: 1,
    textAlign: 'right',
  },
});
