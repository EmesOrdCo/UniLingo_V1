# App Store Links Setup Guide

## Overview

The invite friends feature now includes automatic App Store links that will take users directly to download UniLingo from the appropriate app store.

## How It Works

1. **Platform Detection**: The app automatically detects if the user is on iOS or Android
2. **App Store Links**: Shows the appropriate App Store or Google Play Store link
3. **Native Sharing**: Users can share the invitation with the app store link included
4. **Direct Downloads**: Recipients can tap the link to go directly to the app store

## Current Configuration

The app store links are configured in `src/config/appStore.ts`:

```typescript
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
```

## When You Publish Your App

### For iOS App Store:

1. **Get your App Store ID**:
   - Go to App Store Connect
   - Find your app
   - Copy the App Store ID (numbers after `/id` in the URL)

2. **Update the configuration**:
   ```typescript
   iOS: {
     appStoreId: 'YOUR_ACTUAL_APP_STORE_ID',
     appStoreUrl: 'https://apps.apple.com/app/unilingo/YOUR_ACTUAL_APP_STORE_ID',
     appName: 'UniLingo',
   },
   ```

### For Google Play Store:

1. **Get your package name**:
   - Go to Google Play Console
   - Find your app
   - Copy the package name

2. **Update the configuration**:
   ```typescript
   Android: {
     packageName: 'com.yourcompany.unilingo', // Your actual package name
     playStoreUrl: 'https://play.google.com/store/apps/details?id=com.yourcompany.unilingo',
     appName: 'UniLingo',
   },
   ```

## Features

### ✅ What's Included:

- **Platform-specific links**: iOS users get App Store link, Android users get Play Store link
- **Visual indicators**: Shows Apple or Google icon based on platform
- **Native sharing**: Works with any app (WhatsApp, Messages, Email, etc.)
- **Pre-written message**: Includes app description and features
- **Hashtags**: Social media friendly with relevant hashtags

### 📱 User Experience:

1. User taps "Invite friends"
2. Modal opens with share button
3. User taps "Share Invitation"
4. Device's native share sheet opens
5. User chooses app (WhatsApp, Email, etc.)
6. Message includes app store link
7. Recipient taps link to download app

## Testing

### Before Publishing:
- The current links are placeholders
- Users will see the invitation message but links won't work
- Perfect for testing the sharing functionality

### After Publishing:
- Update the links in `src/config/appStore.ts`
- Test on both iOS and Android devices
- Verify links take users to the correct app store

## Benefits

- **No backend required**: Uses native device capabilities
- **Universal compatibility**: Works with any sharing app
- **Platform optimized**: Shows appropriate app store for each platform
- **Easy to update**: Single configuration file for all app store links
- **User friendly**: Seamless sharing experience

The invite friends feature is now ready for production! Just update the app store links when you publish your app. 🚀
