import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface XPDisplayProps {
  xp: number;
}

/**
 * XPDisplay - Shows user's current XP balance
 */
const XPDisplay: React.FC<XPDisplayProps> = ({ xp }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>XP</Text>
      <Text style={styles.value}>{xp.toLocaleString()}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007AFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    marginRight: 6,
  },
  value: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
});

export default XPDisplay;
