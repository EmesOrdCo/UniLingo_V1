import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from "@supabase/supabase-js";
import { ENV } from './envConfig';

export const supabase = createClient(
  ENV.SUPABASE_URL as string,
  ENV.SUPABASE_ANON_KEY as string,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false, // IMPORTANT for native apps
      storage: AsyncStorage as any,
    },
  }
);