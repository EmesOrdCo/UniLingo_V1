import React, { useState } from 'react';
import { View, StyleSheet, Image, Text } from 'react-native';

interface ImageDiceBearProps {
  size?: number;
  style?: any;
}

const ImageDiceBear: React.FC<ImageDiceBearProps> = ({ 
  size = 200, 
  style 
}) => {
  const [imageError, setImageError] = useState(false);
  
  // Simple test URL - using PNG instead of SVG for better React Native compatibility
  const testUrl = 'https://api.dicebear.com/7.x/avataaars/png?mood=happy&backgroundColor=b6e3f4';
  
  if (imageError) {
    // Fallback: simple colored circle
    return (
      <View style={[styles.container, { width: size, height: size }, style]}>
        <View style={[styles.fallbackCircle, { width: size, height: size, borderRadius: size / 2 }]}>
          <Text style={styles.fallbackText}>👤</Text>
        </View>
      </View>
    );
  }
  
  return (
    <View style={[styles.container, { width: size, height: size }, style]}>
      <Text style={styles.debugText}>Testing DiceBear</Text>
      <Image
        source={{ uri: testUrl }}
        style={styles.image}
        onError={(error) => {
          console.log('Image load error:', error);
          setImageError(true);
        }}
        onLoad={() => {
          console.log('Image loaded successfully');
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
    borderColor: 'red',
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
    fontSize: 12,
    color: 'red',
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
});

export default ImageDiceBear;
