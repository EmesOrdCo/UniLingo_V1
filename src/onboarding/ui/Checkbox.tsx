import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ViewStyle,
} from 'react-native';
import { useThemeTokens } from '../../theme/useThemeTokens';

interface CheckboxProps {
  title: string;
  subtitle?: string;
  checked?: boolean;
  disabled?: boolean;
  onPress?: () => void;
  style?: ViewStyle;
  accessibilityLabel?: string;
  accessibilityHint?: string;
}

export function Checkbox({
  title,
  subtitle,
  checked = false,
  disabled = false,
  onPress,
  style,
  accessibilityLabel,
  accessibilityHint,
}: CheckboxProps) {
  const theme = useThemeTokens();

  const getAccessibilityLabel = () => {
    if (accessibilityLabel) return accessibilityLabel;
    
    let label = title;
    if (subtitle) label += `, ${subtitle}`;
    if (checked) label += ', checked';
    if (disabled) label += ', disabled';
    
    return label;
  };

  return (
    <Pressable
      style={({ pressed }) => [
        styles.container,
        {
          opacity: disabled ? 0.5 : pressed ? 0.8 : 1,
        },
        style,
      ]}
      onPress={onPress}
      disabled={disabled}
      hitSlop={{ top: 12, bottom: 12, left: 8, right: 8 }}
      accessibilityRole="checkbox"
      accessibilityLabel={getAccessibilityLabel()}
      accessibilityHint={accessibilityHint}
      accessibilityState={{
        checked,
        disabled,
      }}
    >
      <View style={styles.content}>
        {/* Checkbox */}
        <View style={styles.checkboxContainer}>
          <View
            style={[
              styles.checkbox,
              {
                backgroundColor: checked ? theme.colors.primary : 'transparent',
                borderColor: checked ? theme.colors.primary : theme.colors.border.primary,
              },
            ]}
          >
            {checked && (
              <Text style={[styles.checkmark, { color: theme.colors.background.surface }]}>
                ✓
              </Text>
            )}
          </View>
        </View>

        {/* Text Content */}
        <View style={styles.textSection}>
          <Text
            style={[
              styles.title,
              {
                color: checked ? theme.colors.primary : theme.colors.text.dark,
                fontWeight: checked ? '600' : '400',
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
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    minHeight: 48,
    justifyContent: 'center',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkboxContainer: {
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
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
});

