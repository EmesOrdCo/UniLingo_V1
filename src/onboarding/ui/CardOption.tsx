import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ViewStyle,
} from 'react-native';
import { useThemeTokens } from '../../theme/useThemeTokens';

interface CardOptionProps {
  title: string;
  subtitle?: string;
  selected?: boolean;
  disabled?: boolean;
  onPress?: () => void;
  leftIcon?: React.ReactNode;
  leftEmoji?: string;
  rightIcon?: 'chevron' | 'checkbox' | 'none';
  style?: ViewStyle;
  accessibilityLabel?: string;
  accessibilityHint?: string;
}

export function CardOption({
  title,
  subtitle,
  selected = false,
  disabled = false,
  onPress,
  leftIcon,
  leftEmoji,
  rightIcon = 'chevron',
  style,
  accessibilityLabel,
  accessibilityHint,
}: CardOptionProps) {
  const theme = useThemeTokens();

  const getRightIcon = () => {
    if (rightIcon === 'none') return null;
    
    if (rightIcon === 'checkbox') {
      return (
        <View
          style={[
            styles.checkbox,
            {
              backgroundColor: selected ? theme.colors.primary : 'transparent',
              borderColor: selected ? theme.colors.primary : theme.colors.border.primary,
            },
          ]}
        >
          {selected && (
            <Text style={[styles.checkmark, { color: theme.colors.background.surface }]}>
              ✓
            </Text>
          )}
        </View>
      );
    }

    // Default chevron
    return (
      <Text style={[styles.chevron, { color: theme.colors.text.light }]}>
        ›
      </Text>
    );
  };

  const getAccessibilityLabel = () => {
    if (accessibilityLabel) return accessibilityLabel;
    
    let label = title;
    if (subtitle) label += `, ${subtitle}`;
    if (selected) label += ', selected';
    if (disabled) label += ', disabled';
    
    return label;
  };

  return (
    <Pressable
      style={({ pressed }) => [
        styles.container,
        {
          backgroundColor: selected ? theme.colors.primaryLight + '20' : theme.colors.background.surface,
          borderColor: selected ? theme.colors.primary : theme.colors.border.primary,
          opacity: disabled ? 0.5 : pressed ? 0.8 : 1,
        },
        style,
      ]}
      onPress={onPress}
      disabled={disabled}
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      accessibilityRole="button"
      accessibilityLabel={getAccessibilityLabel()}
      accessibilityHint={accessibilityHint}
      accessibilityState={{
        selected,
        disabled,
      }}
    >
      <View style={styles.content}>
        {/* Left Icon/Emoji */}
        <View style={styles.leftSection}>
          {leftEmoji && (
            <Text style={styles.emoji}>{leftEmoji}</Text>
          )}
          {leftIcon && (
            <View style={styles.iconContainer}>
              {leftIcon}
            </View>
          )}
        </View>

        {/* Text Content */}
        <View style={styles.textSection}>
          <Text
            style={[
              styles.title,
              {
                color: selected ? theme.colors.primary : theme.colors.text.dark,
                fontWeight: selected ? '600' : '500',
              },
            ]}
          >
            {title}
          </Text>
          {subtitle && (
            <Text
              style={[
                styles.subtitle,
                { color: theme.colors.text.medium },
              ]}
            >
              {subtitle}
            </Text>
          )}
        </View>

        {/* Right Icon */}
        <View style={styles.rightSection}>
          {getRightIcon()}
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    borderWidth: 1,
    marginVertical: 4,
    minHeight: 56,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    flex: 1,
  },
  leftSection: {
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: {
    fontSize: 24,
    lineHeight: 24,
  },
  iconContainer: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textSection: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    fontSize: 16,
    lineHeight: 20,
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 18,
  },
  rightSection: {
    marginLeft: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chevron: {
    fontSize: 20,
    fontWeight: '300',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmark: {
    fontSize: 12,
    fontWeight: '600',
  },
});

