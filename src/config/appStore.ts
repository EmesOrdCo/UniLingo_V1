import { Platform } from 'react-native';

// App Store Configuration
// Update these links when your app is published to the app stores

export const APP_STORE_CONFIG = {
  // iOS App Store - UPDATE THESE BEFORE PUBLISHING
  iOS: {
    appStoreId: 'REPLACE_WITH_ACTUAL_APP_STORE_ID', // Get this from App Store Connect
    appStoreUrl: 'REPLACE_WITH_ACTUAL_APP_STORE_URL', // Get this from App Store Connect
    appName: 'UniLingo',
  },
  
  // Google Play Store - UPDATE THESE BEFORE PUBLISHING
  Android: {
    packageName: 'REPLACE_WITH_ACTUAL_PACKAGE_NAME', // Update in app.json
    playStoreUrl: 'REPLACE_WITH_ACTUAL_PLAY_STORE_URL', // Get this from Google Play Console
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
export const getPlatformIcon = (): any => {
  return Platform.OS === 'ios' ? 'logo-apple' : 'logo-google';
};

// Get platform-specific icon color
export const getPlatformIconColor = (): string => {
  return Platform.OS === 'ios' ? '#000000' : '#4285F4';
};
