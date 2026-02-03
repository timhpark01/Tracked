import { Component, ErrorInfo, ReactNode, useEffect, useCallback, useState } from 'react'
import { View, Text, StyleSheet, ScrollView } from 'react-native'
import { Slot, SplashScreen } from 'expo-router'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient, useAppStateRefresh } from '@/lib/query-client'
import { useSupabaseAuthRefresh, isSupabaseConfigured } from '@/lib/supabase'

// Debug mode - set to true to see startup info, false for production
const DEBUG_STARTUP = true

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
  debugContainer: {
    flex: 1,
    backgroundColor: '#1a1a2e',
    padding: 24,
    paddingTop: 60,
  },
  debugTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#00ff88',
    marginBottom: 16,
  },
  debugScroll: {
    flex: 1,
  },
  debugText: {
    fontSize: 14,
    color: '#ffffff',
    fontFamily: 'monospace',
    marginBottom: 4,
  },
  debugHint: {
    fontSize: 12,
    color: '#888',
    textAlign: 'center',
    marginTop: 16,
  },
})

function DebugScreen({ onContinue }: { onContinue: () => void }) {
  const [info, setInfo] = useState<string[]>(['Starting...'])

  useEffect(() => {
    const logs: string[] = []

    // Check environment
    logs.push(`Supabase configured: ${isSupabaseConfigured}`)
    logs.push(`URL exists: ${!!process.env.EXPO_PUBLIC_SUPABASE_URL}`)
    logs.push(`Key exists: ${!!process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY}`)
    logs.push(`__DEV__: ${__DEV__}`)

    setInfo(logs)

    // Auto-continue after 3 seconds
    const timer = setTimeout(onContinue, 3000)
    return () => clearTimeout(timer)
  }, [onContinue])

  return (
    <View style={styles.debugContainer}>
      <Text style={styles.debugTitle}>Startup Debug</Text>
      <ScrollView style={styles.debugScroll}>
        {info.map((line, i) => (
          <Text key={i} style={styles.debugText}>{line}</Text>
        ))}
      </ScrollView>
      <Text style={styles.debugHint}>Auto-continuing in 3s...</Text>
    </View>
  )
}

function RootLayoutContent() {
  const [showDebug, setShowDebug] = useState(DEBUG_STARTUP)

  useAppStateRefresh()
  useSupabaseAuthRefresh()

  const onLayoutRootView = useCallback(async () => {
    // Hide splash screen once layout is ready
    await SplashScreen.hideAsync()
  }, [])

  useEffect(() => {
    // Small delay to ensure everything is rendered
    const timer = setTimeout(() => {
      onLayoutRootView()
    }, 100)
    return () => clearTimeout(timer)
  }, [onLayoutRootView])

  if (showDebug) {
    return <DebugScreen onContinue={() => setShowDebug(false)} />
  }

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
