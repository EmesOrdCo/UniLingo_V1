import 'dotenv/config';

export default {
  expo: {
    name: "UniLingo Mobile",
    slug: "unilingo-mobile",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "light",
    splash: {
      image: "./assets/splash.png",
      resizeMode: "contain",
      backgroundColor: "#ffffff"
    },
    assetBundlePatterns: [
      "**/*"
    ],
    scheme: "unilingo",
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.unilingo.app",
      infoPlist: {
        UIBackgroundModes: ["background-fetch", "background-processing"],
        NSUserNotificationAlertStyle: "alert",
        NSMicrophoneUsageDescription: "UniLingo uses the microphone for speech recognition and pronunciation practice to help you learn languages more effectively.",
        NSSpeechRecognitionUsageDescription: "UniLingo uses speech recognition to analyze your pronunciation and provide feedback for language learning.",
        NSDocumentReadUsageDescription: "UniLingo needs to access your documents to import PDF files and generate flashcards from your study materials.",
        NSPhotoLibraryUsageDescription: "UniLingo may access your photo library to let you select images for your study materials.",
        CFBundleURLTypes: [
          {
            CFBundleURLName: "unilingo",
            CFBundleURLSchemes: ["unilingo"]
          }
        ]
      }
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#ffffff"
      },
      package: "com.unilingo.app",
      permissions: [
        "RECORD_AUDIO",
        "READ_EXTERNAL_STORAGE",
        "WRITE_EXTERNAL_STORAGE"
      ],
      intentFilters: [
        {
          action: "VIEW",
          autoVerify: true,
          data: [
            {
              scheme: "unilingo"
            }
          ],
          category: ["BROWSABLE", "DEFAULT"]
        }
      ]
    },
    web: {
      favicon: "./assets/favicon.png"
    },
    sdkVersion: "54.0.0",
    plugins: [
      "expo-web-browser",
      [
        "expo-notifications",
        {
          "icon": "./assets/notification-icon.png",
          "color": "#ffffff",
          "mode": "production"
        }
      ],
      [
        "@stripe/stripe-react-native",
        {
          "merchantIdentifier": "merchant.com.unilingo.app",
          "enableGooglePay": true
        }
      ]
    ],
    extra: {
      supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL,
      supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
      openaiApiKey: process.env.EXPO_PUBLIC_OPENAI_API_KEY,
      backendUrl: process.env.EXPO_PUBLIC_BACKEND_URL,
      stripePublishableKey: process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY,
    }
  }
};
