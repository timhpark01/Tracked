// src/lib/query-client.ts
// TanStack Query configuration for React Native
// Source: https://tanstack.com/query/latest/docs/framework/react/react-native
import { useEffect } from 'react'
import { AppState, Platform } from 'react-native'
import type { AppStateStatus } from 'react-native'
import NetInfo from '@react-native-community/netinfo'
import { QueryClient, focusManager, onlineManager } from '@tanstack/react-query'

// Configure online status detection
onlineManager.setEventListener((setOnline) => {
  return NetInfo.addEventListener((state) => {
    setOnline(!!state.isConnected)
  })
})

// Configure focus detection for app state changes
function onAppStateChange(status: AppStateStatus) {
  if (Platform.OS !== 'web') {
    focusManager.setFocused(status === 'active')
  }
}

// Hook to initialize app state listener
export function useAppStateRefresh() {
  useEffect(() => {
    const subscription = AppState.addEventListener('change', onAppStateChange)
    return () => subscription.remove()
  }, [])
}

// QueryClient with mobile-optimized defaults
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      gcTime: 1000 * 60 * 60 * 24,   // 24 hours
      staleTime: 1000 * 60 * 5,       // 5 minutes
      retry: 2,
      networkMode: 'always',
      refetchOnWindowFocus: true,
    },
    mutations: {
      networkMode: 'always',
    },
  },
})
