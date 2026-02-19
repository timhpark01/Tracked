// app/auth/callback.tsx
// Handles deep link callbacks from email confirmation and OAuth
import { useEffect, useState } from 'react'
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native'
import { useLocalSearchParams, router } from 'expo-router'
import { supabase } from '@/lib/supabase'

export default function AuthCallbackScreen() {
  const params = useLocalSearchParams()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    handleCallback()
  }, [])

  async function handleCallback() {
    try {
      // Get all URL parameters - they may come as hash fragments or query params
      const accessToken = params.access_token as string | undefined
      const refreshToken = params.refresh_token as string | undefined
      const code = params.code as string | undefined
      const errorParam = params.error as string | undefined
      const errorDescription = params.error_description as string | undefined

      // Check for errors
      if (errorParam) {
        setError(errorDescription || errorParam)
        return
      }

      // Handle PKCE code exchange
      if (code) {
        const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
        if (exchangeError) {
          setError(exchangeError.message)
          return
        }
      }
      // Handle token-based auth (implicit flow)
      else if (accessToken) {
        const { error: sessionError } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken || '',
        })
        if (sessionError) {
          setError(sessionError.message)
          return
        }
      }

      // Check if we have a valid session now
      const { data: { session } } = await supabase.auth.getSession()

      if (session) {
        // Successfully authenticated - redirect to main app
        router.replace('/')
      } else {
        // No session but no error - might be email confirmation
        // Try to refresh the session
        const { data: { session: refreshedSession } } = await supabase.auth.refreshSession()

        if (refreshedSession) {
          router.replace('/')
        } else {
          // Email confirmed but user needs to log in
          router.replace('/login')
        }
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed')
    }
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorTitle}>Authentication Error</Text>
        <Text style={styles.errorMessage}>{error}</Text>
        <Text
          style={styles.link}
          onPress={() => router.replace('/login')}
        >
          Go to Login
        </Text>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#007AFF" />
      <Text style={styles.text}>Completing authentication...</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 24,
  },
  text: {
    marginTop: 16,
    fontSize: 16,
    color: '#6b7280',
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#ef4444',
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  link: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '500',
  },
})
