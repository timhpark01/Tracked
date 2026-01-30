// src/lib/supabase.ts
import 'react-native-url-polyfill/auto'
import { useEffect } from 'react'
import { AppState, Platform, Alert } from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { createClient, SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY

// Flag to track if Supabase is properly configured
export const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey)

// Create client only if configured, otherwise create a dummy that will fail gracefully
export const supabase: SupabaseClient<Database> = isSupabaseConfigured
  ? createClient<Database>(supabaseUrl!, supabaseAnonKey!, {
      auth: {
        ...(Platform.OS !== 'web' ? { storage: AsyncStorage } : {}),
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
      },
    })
  : createClient<Database>('https://placeholder.supabase.co', 'placeholder', {
      auth: {
        ...(Platform.OS !== 'web' ? { storage: AsyncStorage } : {}),
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false,
      },
    })

// Show alert if not configured (only in production builds)
if (!isSupabaseConfigured && !__DEV__) {
  setTimeout(() => {
    Alert.alert(
      'Configuration Error',
      'The app is not properly configured. Please contact support.',
      [{ text: 'OK' }]
    )
  }, 1000)
}

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
