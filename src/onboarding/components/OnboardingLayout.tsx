import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeTokens } from '../../theme/useThemeTokens';

interface OnboardingLayoutProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  onBack?: () => void;
  showBackButton?: boolean;
  showCloseButton?: boolean;
  onClose?: () => void;
  headerRight?: React.ReactNode;
}

export function OnboardingLayout({
  title,
  subtitle,
  children,
  onBack,
  showBackButton = true,
  showCloseButton = false,
  onClose,
  headerRight,
}: OnboardingLayoutProps) {
  const theme = useThemeTokens();

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background.primary,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: theme.spacing.lg,
      paddingTop: theme.spacing.md,
      paddingBottom: theme.spacing.sm,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border.primary,
    },
    headerLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    backButton: {
      padding: theme.spacing.sm,
      marginRight: theme.spacing.sm,
    },
    headerCenter: {
      flex: 2,
      alignItems: 'center',
    },
    headerRight: {
      flex: 1,
      alignItems: 'flex-end',
    },
    closeButton: {
      padding: theme.spacing.sm,
    },
    content: {
      flex: 1,
      paddingHorizontal: theme.spacing.lg,
      paddingTop: theme.spacing.xl,
    },
    title: {
      fontSize: theme.fonts.sizes.xxxl,
      fontWeight: theme.fonts.weights.bold,
      color: theme.colors.text.primary,
      textAlign: 'center',
      marginBottom: theme.spacing.md,
      lineHeight: 36,
    },
    subtitle: {
      fontSize: theme.fonts.sizes.md,
      color: theme.colors.text.secondary,
      textAlign: 'center',
      marginBottom: theme.spacing.xl,
      lineHeight: 24,
      paddingHorizontal: theme.spacing.md,
    },
  });

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={theme.colors.background.primary} />
      
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          {showBackButton && onBack && (
            <TouchableOpacity style={styles.backButton} onPress={onBack}>
              <Ionicons name="chevron-back" size={24} color={theme.colors.text.primary} />
            </TouchableOpacity>
          )}
        </View>
        
        <View style={styles.headerCenter}>
          {/* Empty center for balance */}
        </View>
        
        <View style={styles.headerRight}>
          {showCloseButton && onClose && (
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Ionicons name="close" size={24} color={theme.colors.text.primary} />
            </TouchableOpacity>
          )}
          {headerRight}
        </View>
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>{title}</Text>
        {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
        {children}
      </View>
    </SafeAreaView>
  );
}

