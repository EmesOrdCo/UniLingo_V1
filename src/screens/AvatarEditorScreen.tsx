import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useDispatch } from 'react-redux';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from '../lib/i18n';
import Avatar from '../components/avatar/Avatar';
import AvatarCustomizer from '../components/avatar/AvatarCustomizer';
import { loadAvatarOptions } from '../store/slices/avatarSlice';

/**
 * Avatar Editor Screen - Full avatar customization system
 * Integrates the real avatar system from fe-react-avatar-maker
 */
const AvatarEditorScreen: React.FC = () => {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'preview' | 'customize'>('preview');

  // Load saved avatar options when component mounts
  useEffect(() => {
    const loadSavedOptions = async () => {
      try {
        const savedOptions = await AsyncStorage.getItem('avatar-options');
        if (savedOptions) {
          dispatch(loadAvatarOptions(JSON.parse(savedOptions)));
        }
      } catch (error) {
        console.error('Error loading avatar options:', error);
      }
    };

    loadSavedOptions();
  }, [dispatch]);

  const handleSave = () => {
    Alert.alert(
      'Avatar Saved',
      'Your avatar has been saved successfully!',
      [{ text: 'OK' }]
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#000000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('profile.menu.customizeAvatar')}</Text>
        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <Text style={styles.saveButtonText}>Save</Text>
        </TouchableOpacity>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'preview' && styles.activeTab]}
          onPress={() => setActiveTab('preview')}
        >
          <Text style={[styles.tabText, activeTab === 'preview' && styles.activeTabText]}>
            Preview
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'customize' && styles.activeTab]}
          onPress={() => setActiveTab('customize')}
        >
          <Text style={[styles.tabText, activeTab === 'customize' && styles.activeTabText]}>
            Customize
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      {activeTab === 'preview' ? (
        <View style={styles.previewContainer}>
          <Text style={styles.previewTitle}>Your Avatar</Text>
          <Avatar size={250} />
          <Text style={styles.previewDescription}>
            Customize your avatar using the options in the Customize tab
          </Text>
        </View>
      ) : (
        <AvatarCustomizer />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e1e8ed',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    flex: 1,
    textAlign: 'center',
  },
  saveButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e1e8ed',
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#007AFF',
  },
  tabText: {
    fontSize: 16,
    color: '#6b7280',
    fontWeight: '500',
  },
  activeTabText: {
    color: '#007AFF',
    fontWeight: '600',
  },
  previewContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  previewTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 20,
  },
  previewDescription: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 20,
    paddingHorizontal: 20,
  },
});

export default AvatarEditorScreen;
