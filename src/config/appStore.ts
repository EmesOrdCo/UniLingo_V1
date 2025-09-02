import { Platform } from 'react-native';

// App Store Configuration
// Update these links when your app is published to the app stores

export const APP_STORE_CONFIG = {
  // iOS App Store
  iOS: {
    appStoreId: '1234567890', // Replace with your actual iOS App Store ID
    appStoreUrl: 'https://apps.apple.com/app/unilingo/id1234567890', // Replace with actual URL
    appName: 'UniLingo',
  },
  
  // Google Play Store
  Android: {
    packageName: 'com.unilingo.app', // Replace with your actual package name
    playStoreUrl: 'https://play.google.com/store/apps/details?id=com.unilingo.app', // Replace with actual URL
    appName: 'UniLingo',
  },
};

// Get the appropriate app store link for the current platform
export const getAppStoreLink = (): string => {
  if (Platform.OS === 'ios') {
    return APP_STORE_CONFIG.iOS.appStoreUrl;
  } else {
    return APP_STORE_CONFIG.Android.playStoreUrl;
  }
};

// Get the app name for the current platform
export const getAppName = (): string => {
  if (Platform.OS === 'ios') {
    return APP_STORE_CONFIG.iOS.appName;
  } else {
    return APP_STORE_CONFIG.Android.appName;
  }
};

// Get platform-specific icon name
export const getPlatformIcon = (): string => {
  return Platform.OS === 'ios' ? 'logo-apple' : 'logo-google';
};

// Get platform-specific icon color
export const getPlatformIconColor = (): string => {
  return Platform.OS === 'ios' ? '#000000' : '#4285F4';
};
