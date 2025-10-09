import React, { useState } from 'react';
import { View, StyleSheet, Image, Text } from 'react-native';

interface SimpleTestAvatarProps {
  size?: number;
  style?: any;
}

const SimpleTestAvatar: React.FC<SimpleTestAvatarProps> = ({ 
  size = 200, 
  style 
}) => {
  const [imageError, setImageError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  
  // Test with very simple URLs first
  const testUrls = [
    'https://api.dicebear.com/7.x/avataaars/png?backgroundColor=b6e3f4',
    'https://api.dicebear.com/7.x/avataaars/png',
    'https://api.dicebear.com/6.x/avataaars/png',
    'https://api.dicebear.com/7.x/avataaars/png?mood=happy',
    'https://api.dicebear.com/7.x/avataaars/png?mood=happy&skinColor=tanned',
  ];
  
  const currentUrl = testUrls[attempt] || testUrls[0];
  
  if (imageError) {
    // Fallback: simple colored circle with emoji
    return (
      <View style={[styles.container, { width: size, height: size }, style]}>
        <View style={[styles.fallbackCircle, { width: size, height: size, borderRadius: size / 2 }]}>
          <Text style={styles.fallbackText}>👤</Text>
          <Text style={styles.errorText}>All attempts failed</Text>
        </View>
        <Text style={styles.debugText} numberOfLines={3}>
          Failed URL: {currentUrl}
        </Text>
      </View>
    );
  }
  
  return (
    <View style={[styles.container, { width: size, height: size }, style]}>
      <Text style={styles.attemptText}>Attempt {attempt + 1}</Text>
      <Image
        source={{ uri: currentUrl }}
        style={styles.image}
        onError={(error) => {
          console.log(`Image load error (attempt ${attempt + 1}):`, error);
          console.log('Failed URL:', currentUrl);
          if (attempt < testUrls.length - 1) {
            setAttempt(attempt + 1);
          } else {
            setImageError(true);
          }
        }}
        onLoad={() => {
          console.log(`Image loaded successfully (attempt ${attempt + 1})`);
          console.log('Success URL:', currentUrl);
        }}
      />
      <Text style={styles.urlText} numberOfLines={2}>
        {currentUrl}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 100,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'green',
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
  fallbackCircle: {
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fallbackText: {
    fontSize: 40,
    color: 'white',
  },
  errorText: {
    fontSize: 10,
    color: 'white',
    marginTop: 4,
  },
  debugText: {
    position: 'absolute',
    bottom: -60,
    fontSize: 8,
    color: 'red',
    backgroundColor: 'white',
    padding: 4,
    maxWidth: 300,
  },
  attemptText: {
    position: 'absolute',
    top: -20,
    fontSize: 12,
    color: 'green',
    backgroundColor: 'white',
    padding: 2,
  },
  urlText: {
    position: 'absolute',
    bottom: -40,
    fontSize: 6,
    color: 'blue',
    backgroundColor: 'white',
    padding: 2,
    maxWidth: 250,
  },
});

export default SimpleTestAvatar;
