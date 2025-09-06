import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from "@supabase/supabase-js";

export const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL as string,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY as string,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false, // IMPORTANT for native apps
      storage: AsyncStorage as any,
    },
  }
);