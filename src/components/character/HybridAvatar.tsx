import React, { useState } from 'react';
import { View, StyleSheet, Image, Text } from 'react-native';

interface HybridAvatarProps {
  size?: number;
  style?: any;
}

const HybridAvatar: React.FC<HybridAvatarProps> = ({ 
  size = 200, 
  style 
}) => {
  const [imageError, setImageError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  
  // Try different DiceBear URLs
  const urls = [
    'https://api.dicebear.com/7.x/avataaars/png?mood=happy&backgroundColor=b6e3f4',
    'https://api.dicebear.com/7.x/avataaars/png?seed=test&backgroundColor=b6e3f4',
    'https://api.dicebear.com/7.x/avataaars/png?backgroundColor=b6e3f4',
    'https://api.dicebear.com/6.x/avataaars/png?mood=happy',
  ];
  
  const currentUrl = urls[attempt] || urls[0];
  
  if (imageError) {
    // Fallback: simple colored circle with emoji
    return (
      <View style={[styles.container, { width: size, height: size }, style]}>
        <View style={[styles.fallbackCircle, { width: size, height: size, borderRadius: size / 2 }]}>
          <Text style={styles.fallbackText}>👤</Text>
          <Text style={styles.errorText}>DiceBear Failed</Text>
        </View>
      </View>
    );
  }
  
  return (
    <View style={[styles.container, { width: size, height: size }, style]}>
      <Text style={styles.debugText}>Attempt {attempt + 1}: {currentUrl.includes('7.x') ? 'v7' : 'v6'}</Text>
      <Image
        source={{ uri: currentUrl }}
        style={styles.image}
        onError={(error) => {
          console.log(`Image load error (attempt ${attempt + 1}):`, error);
          if (attempt < urls.length - 1) {
            setAttempt(attempt + 1);
          } else {
            setImageError(true);
          }
        }}
        onLoad={() => {
          console.log(`Image loaded successfully (attempt ${attempt + 1})`);
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'blue',
    borderRadius: 10,
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
  debugText: {
    position: 'absolute',
    top: -20,
    fontSize: 10,
    color: 'blue',
    backgroundColor: 'white',
    paddingHorizontal: 4,
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
});

export default HybridAvatar;
