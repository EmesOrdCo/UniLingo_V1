import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Dimensions,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from '../lib/i18n';
import Avatar from '../components/avatar/Avatar';
import AvatarCustomizer from '../components/avatar/AvatarCustomizer';

const { width, height } = Dimensions.get('window');

/**
 * Avatar Editor Screen - Modern, streamlined avatar customization
 * Clean, intuitive interface for avatar personalization
 */
const AvatarEditorScreen: React.FC = () => {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const { user } = useAuth();
  const [avatarScale] = useState(new Animated.Value(1));

  const handleSave = () => {
    // Animate avatar on save
    Animated.sequence([
      Animated.timing(avatarScale, {
        toValue: 1.1,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(avatarScale, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();

    Alert.alert(
      t('avatar.save.success.title'),
      t('avatar.save.success.message'),
      [{ text: t('avatar.save.success.button'), style: 'default' }]
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Modern Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#1f2937" />
        </TouchableOpacity>
        
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>{t('avatar.customize.title')}</Text>
          <Text style={styles.headerSubtitle}>{t('avatar.customize.subtitle')}</Text>
        </View>
        
        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <Ionicons name="checkmark" size={20} color="#ffffff" />
        </TouchableOpacity>
      </View>

      {/* Avatar Preview Section */}
      <View style={styles.previewSection}>
        <View style={styles.avatarContainer}>
          <Animated.View style={[styles.avatarFrame, { transform: [{ scale: avatarScale }] }]}>
            <Avatar size={Math.min(width * 0.4, 200)} />
          </Animated.View>
        </View>
        
        <Text style={styles.previewText}>{t('avatar.customize.instruction')}</Text>
      </View>

      {/* Customizer */}
      <View style={styles.customizerContainer}>
        <AvatarCustomizer />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1f2937',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  saveButton: {
    backgroundColor: '#3b82f6',
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  previewSection: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 20,
    backgroundColor: '#ffffff',
  },
  avatarContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarFrame: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 1000,
    padding: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  previewText: {
    fontSize: 16,
    color: '#6b7280',
    marginTop: 16,
    textAlign: 'center',
  },
  customizerContainer: {
    flex: 1,
  },
});

export default AvatarEditorScreen;
