import { Component, ErrorInfo, ReactNode, useEffect, useCallback } from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { Slot, SplashScreen } from 'expo-router'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient, useAppStateRefresh } from '@/lib/query-client'
import { useSupabaseAuthRefresh } from '@/lib/supabase'

// Prevent splash screen from auto-hiding
SplashScreen.preventAutoHideAsync().catch(() => {
  // Ignore errors - splash screen might have already hidden
})

// Error Boundary to catch rendering errors
class ErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: ReactNode }) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('App Error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Something went wrong</Text>
          <Text style={styles.errorMessage}>
            {this.state.error?.message || 'Unknown error'}
          </Text>
        </View>
      )
    }
    return this.props.children
  }
}

const styles = StyleSheet.create({
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#fff',
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ef4444',
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
  },
})

function RootLayoutContent() {
  useAppStateRefresh()
  useSupabaseAuthRefresh()

  const hideSplash = useCallback(async () => {
    try {
      await SplashScreen.hideAsync()
    } catch (e) {
      // Ignore - splash screen might already be hidden
      console.warn('Could not hide splash screen:', e)
    }
  }, [])

  useEffect(() => {
    // Hide splash screen after a brief delay to ensure render is complete
    // This runs unconditionally to prevent the app from being stuck
    const timer = setTimeout(hideSplash, 100)
    return () => clearTimeout(timer)
  }, [hideSplash])

  return (
    <QueryClientProvider client={queryClient}>
      <Slot />
    </QueryClientProvider>
  )
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <RootLayoutContent />
      </ErrorBoundary>
    </SafeAreaProvider>
  )
}
