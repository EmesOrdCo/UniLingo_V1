import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useAuth } from '../contexts/AuthContext';

/**
 * Avatar Maker Screen for UniLingo
 * This screen integrates the avatar customizer into the UniLingo app
 */
const AvatarMakerScreen: React.FC = () => {
  const { user } = useAuth();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Avatar Customizer</Text>
      <Text style={styles.subtitle}>Create your unique avatar</Text>
      
      {/* TODO: Integrate the avatar maker components here */}
      <View style={styles.avatarContainer}>
        <Text style={styles.placeholder}>
          Avatar will be displayed here
        </Text>
        <Text style={styles.userInfo}>
          User: {user?.email || 'Not logged in'}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
  },
  avatarContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e1e8ed',
  },
  placeholder: {
    fontSize: 18,
    color: '#007AFF',
    marginBottom: 10,
  },
  userInfo: {
    fontSize: 14,
    color: '#666',
  },
});

export default AvatarMakerScreen;
