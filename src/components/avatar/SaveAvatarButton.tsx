import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native';

interface SaveAvatarButtonProps {
  onSave: () => void;
  loading?: boolean;
  disabled?: boolean;
}

/**
 * SaveAvatarButton - Button for saving avatar configuration
 */
const SaveAvatarButton: React.FC<SaveAvatarButtonProps> = ({
  onSave,
  loading = false,
  disabled = false,
}) => {
  return (
    <TouchableOpacity
      style={[
        styles.button,
        (disabled || loading) && styles.disabledButton,
      ]}
      onPress={onSave}
      disabled={disabled || loading}
    >
      {loading ? (
        <ActivityIndicator color="#fff" size="small" />
      ) : (
        <Text style={[
          styles.buttonText,
          (disabled || loading) && styles.disabledButtonText,
        ]}>
          Save Avatar
        </Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#28a745',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    alignItems: 'center',
    margin: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  disabledButton: {
    backgroundColor: '#e9ecef',
  },
  buttonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  disabledButtonText: {
    color: '#6c757d',
  },
});

export default SaveAvatarButton;
