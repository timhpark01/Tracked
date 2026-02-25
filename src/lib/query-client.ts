// src/lib/query-client.ts
// TanStack Query configuration for React Native
// Source: https://tanstack.com/query/latest/docs/framework/react/react-native
import { useEffect, useRef, useCallback } from 'react'
import { AppState, Platform } from 'react-native'
import type { AppStateStatus } from 'react-native'
import NetInfo from '@react-native-community/netinfo'
import { QueryClient, focusManager, onlineManager } from '@tanstack/react-query'
import { useFocusEffect } from '@react-navigation/native'

// Configure focus detection for app state changes
function onAppStateChange(status: AppStateStatus) {
  if (Platform.OS !== 'web') {
    focusManager.setFocused(status === 'active')
  }
}

// Hook to initialize app state listener and online manager
export function useAppStateRefresh() {
  useEffect(() => {
    // Configure online status detection (inside useEffect to avoid issues in release builds)
    const unsubscribeNetInfo = NetInfo.addEventListener((state) => {
      onlineManager.setOnline(!!state.isConnected)
    })

    const subscription = AppState.addEventListener('change', onAppStateChange)

    return () => {
      subscription.remove()
      unsubscribeNetInfo()
    }
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

/**
 * Hook to refetch data when a screen gains focus.
 * Use this for screens where data may change while navigated away.
 * Source: https://tanstack.com/query/latest/docs/framework/react/react-native#refetch-on-screen-focus
 */
export function useRefreshOnFocus(refetch: () => void) {
  const firstTimeRef = useRef(true)

  useFocusEffect(
    useCallback(() => {
      // Skip the first focus event (initial mount)
      if (firstTimeRef.current) {
        firstTimeRef.current = false
        return
      }
      refetch()
    }, [refetch])
  )
}

/**
 * Alternative hook that always refetches on focus (including initial mount).
 * Use this when you need guaranteed fresh data every time the screen is visible.
 */
export function useAlwaysRefreshOnFocus(refetch: () => void) {
  useFocusEffect(
    useCallback(() => {
      refetch()
    }, [refetch])
  )
}
