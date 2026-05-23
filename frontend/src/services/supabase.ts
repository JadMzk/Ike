/**
 * Supabase client for Auth only (Google OAuth).
 *
 * Env vars (Expo — loaded at build time):
 *   EXPO_PUBLIC_SUPABASE_URL
 *   EXPO_PUBLIC_SUPABASE_ANON_KEY  (or EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY)
 *
 * Web/Vite aliases (if you add a Vite app later):
 *   VITE_SUPABASE_URL
 *   VITE_SUPABASE_ANON_KEY
 */
import 'react-native-url-polyfill/auto';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import Constants from 'expo-constants';

const extra =
  (Constants.expoConfig?.extra as {
    supabaseUrl?: string;
    supabaseAnonKey?: string;
  } | undefined) ?? {};

function readSupabaseUrl(): string {
  return (
    process.env.EXPO_PUBLIC_SUPABASE_URL ??
    process.env.VITE_SUPABASE_URL ??
    extra.supabaseUrl ??
    ''
  );
}

function readSupabaseAnonKey(): string {
  return (
    process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ??
    process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.VITE_SUPABASE_ANON_KEY ??
    extra.supabaseAnonKey ??
    ''
  );
}

const supabaseUrl = readSupabaseUrl();
const supabaseAnonKey = readSupabaseAnonKey();

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    '[supabase] Missing EXPO_PUBLIC_SUPABASE_URL or EXPO_PUBLIC_SUPABASE_ANON_KEY. ' +
      'Copy frontend/.env.example → frontend/.env',
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
