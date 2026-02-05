// src/lib/supabase.ts
import 'react-native-url-polyfill/auto'
import { useEffect } from 'react'
import { AppState, Platform } from 'react-native'
import { createClient, SupabaseClient } from '@supabase/supabase-js'
import AsyncStorage from '@react-native-async-storage/async-storage'
import type { Database } from '@/types/database'

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY

// Flag to track if Supabase is properly configured
export const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey)

// Log configuration status (helpful for debugging TestFlight issues)
if (!isSupabaseConfigured) {
  console.warn('[Supabase] Not configured - URL:', !!supabaseUrl, 'Key:', !!supabaseAnonKey)
}

// Create the Supabase client - use real config or placeholder
// The placeholder allows the app to load without crashing when unconfigured
export const supabase: SupabaseClient<Database> = createClient<Database>(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key',
  {
    auth: {
      ...(Platform.OS !== 'web' ? { storage: AsyncStorage } : {}),
      autoRefreshToken: isSupabaseConfigured,
      persistSession: isSupabaseConfigured,
      detectSessionInUrl: false,
    },
  }
)

// Hook to handle auth refresh on app state changes (React Native only)
export function useSupabaseAuthRefresh() {
  useEffect(() => {
    if (Platform.OS === 'web') return

    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        supabase.auth.startAutoRefresh()
      } else {
        supabase.auth.stopAutoRefresh()
      }
    })

    return () => subscription.remove()
  }, [])
}
