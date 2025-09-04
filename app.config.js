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
    ios: {
      supportsTablet: true
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#ffffff"
      }
    },
    web: {
      favicon: "./assets/favicon.png"
    },
    sdkVersion: "53.0.0",
    plugins: [
      "expo-web-browser"
    ],
    extra: {
      supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL,
      supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
      openaiApiKey: process.env.EXPO_PUBLIC_OPENAI_API_KEY,
      backendUrl: process.env.EXPO_PUBLIC_BACKEND_URL,
    }
  }
};
