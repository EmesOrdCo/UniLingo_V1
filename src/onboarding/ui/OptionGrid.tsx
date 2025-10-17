import React from 'react';
import {
  View,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { useThemeTokens } from '../../theme/useThemeTokens';
import { CardOption } from './CardOption';

interface Option {
  id: string;
  title: string;
  subtitle?: string;
  leftEmoji?: string;
  leftIcon?: React.ReactNode;
  disabled?: boolean;
  highlighted?: boolean;
}

interface OptionGridProps {
  options: Option[];
  selectedIds?: string[];
  multiSelect?: boolean;
  onSelectionChange: (selectedIds: string[]) => void;
  style?: ViewStyle;
  accessibilityLabel?: string;
}

export function OptionGrid({
  options,
  selectedIds = [],
  multiSelect = false,
  onSelectionChange,
  style,
  accessibilityLabel,
}: OptionGridProps) {
  const theme = useThemeTokens();

  const handleOptionPress = (optionId: string) => {
    if (multiSelect) {
      // Multi-select logic
      const isSelected = selectedIds.includes(optionId);
      const newSelection = isSelected
        ? selectedIds.filter(id => id !== optionId)
        : [...selectedIds, optionId];
      onSelectionChange(newSelection);
    } else {
      // Single-select logic
      onSelectionChange([optionId]);
    }
  };

  const getRightIcon = (optionId: string) => {
    if (multiSelect) {
      return 'checkbox';
    }
    return 'chevron';
  };

  return (
    <View
      style={[styles.container, style]}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole={multiSelect ? 'list' : 'radiogroup'}
    >
      {options.map((option, index) => {
        const isSelected = selectedIds.includes(option.id);
        
        return (
          <CardOption
            key={option.id}
            title={option.title}
            subtitle={option.subtitle}
            selected={isSelected}
            disabled={option.disabled}
            highlighted={option.highlighted}
            onPress={() => handleOptionPress(option.id)}
            leftEmoji={option.leftEmoji}
            leftIcon={option.leftIcon}
            rightIcon={getRightIcon(option.id)}
            accessibilityLabel={`${option.title}${option.subtitle ? `, ${option.subtitle}` : ''}`}
            accessibilityHint={
              multiSelect
                ? isSelected
                  ? 'Tap to deselect'
                  : 'Tap to select'
                : isSelected
                  ? 'Currently selected'
                  : 'Tap to select'
            }
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 8,
  },
});

