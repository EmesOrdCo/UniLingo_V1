import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { WebView } from 'react-native-webview';

interface SimpleDiceBearProps {
  size?: number;
  style?: any;
}

const SimpleDiceBear: React.FC<SimpleDiceBearProps> = ({ 
  size = 200, 
  style 
}) => {
  // Simple test URL - just basic avatar
  const testUrl = 'https://api.dicebear.com/7.x/avataaars/svg?mood=happy&backgroundColor=b6e3f4';
  
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
          background: #f0f0f0;
        }
        .avatar-container {
          width: ${size}px;
          height: ${size}px;
          display: flex;
          justify-content: center;
          align-items: center;
          border: 2px solid red;
        }
        .avatar-container img {
          width: 100%;
          height: 100%;
          object-fit: contain;
        }
        .fallback {
          color: red;
          font-size: 14px;
          text-align: center;
        }
      </style>
    </head>
    <body>
      <div class="avatar-container">
        <img src="${testUrl}" alt="Avatar" onerror="this.style.display='none'; document.querySelector('.fallback').style.display='block';" />
        <div class="fallback" style="display: none;">Avatar failed to load</div>
      </div>
    </body>
    </html>
  `;

  return (
    <View style={[styles.container, { width: size, height: size }, style]}>
      <WebView
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
        onLoadEnd={() => {
          console.log('WebView loaded');
        }}
        onMessage={(event) => {
          console.log('WebView message: ', event.nativeEvent.data);
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    borderRadius: 100,
    borderWidth: 2,
    borderColor: 'blue',
  },
  webview: {
    backgroundColor: 'transparent',
    flex: 1,
  },
});

export default SimpleDiceBear;
