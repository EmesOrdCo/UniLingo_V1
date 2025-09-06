import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeTokens } from '../../theme/useThemeTokens';

interface OnboardingOptionProps {
  title: string;
  subtitle?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  isSelected?: boolean;
  onPress: () => void;
  style?: ViewStyle;
  disabled?: boolean;
}

export function OnboardingOption({
  title,
  subtitle,
  icon,
  isSelected = false,
  onPress,
  style,
  disabled = false,
}: OnboardingOptionProps) {
  const theme = useThemeTokens();

  const styles = StyleSheet.create({
    container: {
      backgroundColor: theme.colors.background.primary,
      borderRadius: theme.radius.md,
      borderWidth: 2,
      borderColor: isSelected ? theme.colors.primary : theme.colors.border.primary,
      padding: theme.spacing.lg,
      marginBottom: theme.spacing.md,
      flexDirection: 'row',
      alignItems: 'center',
      opacity: disabled ? 0.6 : 1,
    },
    selectedContainer: {
      borderColor: theme.colors.primary,
      backgroundColor: `${theme.colors.primary}10`,
    },
    iconContainer: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: isSelected ? theme.colors.primary : theme.colors.background.secondary,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: theme.spacing.md,
    },
    content: {
      flex: 1,
    },
    title: {
      fontSize: theme.fonts.sizes.md,
      fontWeight: theme.fonts.weights.medium,
      color: theme.colors.text.primary,
      marginBottom: subtitle ? theme.spacing.xs : 0,
    },
    subtitle: {
      fontSize: theme.fonts.sizes.sm,
      color: theme.colors.text.secondary,
      lineHeight: 20,
    },
    checkmark: {
      marginLeft: theme.spacing.sm,
    },
  });

  return (
    <TouchableOpacity
      style={[
        styles.container,
        isSelected && styles.selectedContainer,
        style,
      ]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.7}
    >
      {icon && (
        <View style={styles.iconContainer}>
          <Ionicons
            name={icon}
            size={20}
            color={isSelected ? theme.colors.text.inverse : theme.colors.text.secondary}
          />
        </View>
      )}
      
      <View style={styles.content}>
        <Text style={styles.title}>{title}</Text>
        {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      </View>
      
      {isSelected && (
        <View style={styles.checkmark}>
          <Ionicons
            name="checkmark-circle"
            size={24}
            color={theme.colors.primary}
          />
        </View>
      )}
    </TouchableOpacity>
  );
}
