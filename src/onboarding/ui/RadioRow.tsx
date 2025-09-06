import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ViewStyle,
} from 'react-native';
import { useThemeTokens } from '../../theme/useThemeTokens';

interface RadioRowProps {
  title: string;
  subtitle?: string;
  selected?: boolean;
  disabled?: boolean;
  onPress?: () => void;
  style?: ViewStyle;
  accessibilityLabel?: string;
  accessibilityHint?: string;
}

export function RadioRow({
  title,
  subtitle,
  selected = false,
  disabled = false,
  onPress,
  style,
  accessibilityLabel,
  accessibilityHint,
}: RadioRowProps) {
  const theme = useThemeTokens();

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
          opacity: disabled ? 0.5 : pressed ? 0.8 : 1,
        },
        style,
      ]}
      onPress={onPress}
      disabled={disabled}
      hitSlop={{ top: 12, bottom: 12, left: 8, right: 8 }}
      accessibilityRole="radio"
      accessibilityLabel={getAccessibilityLabel()}
      accessibilityHint={accessibilityHint}
      accessibilityState={{
        selected,
        disabled,
      }}
    >
      <View style={styles.content}>
        {/* Radio Button */}
        <View style={styles.radioContainer}>
          <View
            style={[
              styles.radioOuter,
              {
                borderColor: selected ? theme.colors.primary : theme.colors.border,
              },
            ]}
          >
            {selected && (
              <View
                style={[
                  styles.radioInner,
                  { backgroundColor: theme.colors.primary },
                ]}
              />
            )}
          </View>
        </View>

        {/* Text Content */}
        <View style={styles.textSection}>
          <Text
            style={[
              styles.title,
              {
                color: selected ? theme.colors.primary : theme.colors.textDark,
                fontWeight: selected ? '600' : '400',
              },
            ]}
          >
            {title}
          </Text>
          {subtitle && (
            <Text
              style={[
                styles.subtitle,
                { color: theme.colors.textMedium },
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
  radioContainer: {
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
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

