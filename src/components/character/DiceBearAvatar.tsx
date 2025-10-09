import React, { useRef } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { WebView } from 'react-native-webview';
import { CharacterAppearance } from '../../types/character';

interface DiceBearAvatarProps {
  appearance: CharacterAppearance;
  size?: number;
  style?: any;
}

const DiceBearAvatar: React.FC<DiceBearAvatarProps> = ({ 
  appearance, 
  size = 200, 
  style 
}) => {
  const webViewRef = useRef<WebView>(null);
  
  // Convert our character appearance to DiceBear style parameters
  const getDiceBearStyle = () => {
    const { faceShape, skinTone, hairStyle, hairColor, eyeColor, shirtStyle, shirtColor } = appearance;
    
    // Map our properties to DiceBear style parameters
    const styleParams = new URLSearchParams();
    
    // Face shape
    switch (faceShape) {
      case 'round': styleParams.append('mood', 'happy'); break;
      case 'oval': styleParams.append('mood', 'neutral'); break;
      case 'square': styleParams.append('mood', 'sad'); break;
      case 'heart': styleParams.append('mood', 'excited'); break;
      default: styleParams.append('mood', 'happy');
    }
    
    // Skin tone
    switch (skinTone) {
      case 'light': styleParams.append('skinColor', 'light'); break;
      case 'medium': styleParams.append('skinColor', 'tanned'); break;
      case 'tan': styleParams.append('skinColor', 'yellow'); break;
      case 'dark': styleParams.append('skinColor', 'dark'); break;
      default: styleParams.append('skinColor', 'tanned');
    }
    
    // Hair style and color
    switch (hairStyle) {
      case 'short': styleParams.append('top', 'shortHair'); break;
      case 'medium': styleParams.append('top', 'longHair'); break;
      case 'long': styleParams.append('top', 'longHairFroBand'); break;
      case 'curly': styleParams.append('top', 'longHairCurly'); break;
      case 'afro': styleParams.append('top', 'longHairFro'); break;
      case 'bald': styleParams.append('top', 'noHair'); break;
      default: styleParams.append('top', 'shortHair');
    }
    
    // Hair color
    switch (hairColor) {
      case 'black': styleParams.append('hairColor', 'black'); break;
      case 'brown': styleParams.append('hairColor', 'brown'); break;
      case 'blonde': styleParams.append('hairColor', 'blonde'); break;
      case 'red': styleParams.append('hairColor', 'red'); break;
      case 'gray': styleParams.append('hairColor', 'gray'); break;
      case 'blue': styleParams.append('hairColor', 'auburn'); break;
      case 'pink': styleParams.append('hairColor', 'blonde'); break;
      default: styleParams.append('hairColor', 'brown');
    }
    
    // Eye color
    switch (eyeColor) {
      case 'brown': styleParams.append('eyeColor', 'brown'); break;
      case 'blue': styleParams.append('eyeColor', 'blue'); break;
      case 'green': styleParams.append('eyeColor', 'green'); break;
      case 'hazel': styleParams.append('eyeColor', 'hazel'); break;
      case 'gray': styleParams.append('eyeColor', 'gray'); break;
      default: styleParams.append('eyeColor', 'brown');
    }
    
    // Shirt/clothing
    switch (shirtStyle) {
      case 'casual': styleParams.append('clothing', 'shirtCrewNeck'); break;
      case 'formal': styleParams.append('clothing', 'blazerShirt'); break;
      case 'hoodie': styleParams.append('clothing', 'hoodie'); break;
      case 'dress': styleParams.append('clothing', 'dress'); break;
      case 'tank': styleParams.append('clothing', 'tankTop'); break;
      default: styleParams.append('clothing', 'shirtCrewNeck');
    }
    
    // Shirt color
    switch (shirtColor) {
      case 'white': styleParams.append('clothingColor', 'white'); break;
      case 'black': styleParams.append('clothingColor', 'black'); break;
      case 'blue': styleParams.append('clothingColor', 'blue'); break;
      case 'red': styleParams.append('clothingColor', 'red'); break;
      case 'green': styleParams.append('clothingColor', 'green'); break;
      case 'yellow': styleParams.append('clothingColor', 'yellow'); break;
      case 'purple': styleParams.append('clothingColor', 'purple'); break;
      default: styleParams.append('clothingColor', 'blue');
    }
    
    // Accessories
    if (appearance.accessories.includes('glasses')) {
      styleParams.append('accessories', 'eyewear');
    }
    if (appearance.accessories.includes('hat')) {
      styleParams.append('top', 'hat');
    }
    
    return styleParams.toString();
  };

  const diceBearUrl = `https://api.dicebear.com/7.x/avataaars/svg?${getDiceBearStyle()}&backgroundColor=b6e3f4`;
  
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body {
          margin: 0;
          padding: 0;
          display: flex;
          justify-content: center;
          align-items: center;
          height: 100vh;
          background: transparent;
        }
        .avatar-container {
          width: ${size}px;
          height: ${size}px;
          display: flex;
          justify-content: center;
          align-items: center;
        }
        .avatar-container img {
          width: 100%;
          height: 100%;
          object-fit: contain;
        }
      </style>
    </head>
    <body>
      <div class="avatar-container">
        <img src="${diceBearUrl}" alt="Avatar" />
      </div>
    </body>
    </html>
  `;

  return (
    <View style={[styles.container, { width: size, height: size }, style]}>
      <WebView
        ref={webViewRef}
        source={{ html: htmlContent }}
        style={styles.webview}
        scrollEnabled={false}
        bounces={false}
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={false}
        scalesPageToFit={false}
        mixedContentMode="compatibility"
        allowsInlineMediaPlayback={true}
        mediaPlaybackRequiresUserAction={false}
        onError={(syntheticEvent) => {
          const { nativeEvent } = syntheticEvent;
          console.warn('WebView error: ', nativeEvent);
        }}
        onHttpError={(syntheticEvent) => {
          const { nativeEvent } = syntheticEvent;
          console.warn('WebView HTTP error: ', nativeEvent);
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    borderRadius: 100,
  },
  webview: {
    backgroundColor: 'transparent',
    flex: 1,
  },
});

export default DiceBearAvatar;
