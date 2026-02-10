// app/(auth)/verifying.tsx
// Post-login verification screen that ensures session is fully ready before navigating to app
import { useEffect, useState, useRef } from 'react'
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native'
import { router } from 'expo-router'
import { supabase } from '@/lib/supabase'
import { queryClient } from '@/lib/query-client'
import { useAuth } from '@/features/auth'

const MAX_RETRIES = 10
const RETRY_DELAY = 500 // ms

export default function VerifyingScreen() {
  const [status, setStatus] = useState<'verifying' | 'error'>('verifying')
  const [errorMessage, setErrorMessage] = useState('')
  const mounted = useRef(true)
  const hasNavigated = useRef(false)
  const { refreshSession } = useAuth()

  useEffect(() => {
    mounted.current = true
    hasNavigated.current = false

    verifySession()

    return () => {
      mounted.current = false
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  async function verifySession() {
    console.log('[Verify] Starting session verification...')

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      if (!mounted.current || hasNavigated.current) return

      console.log(`[Verify] Attempt ${attempt}/${MAX_RETRIES}`)

      try {
        // Step 1: Check if session exists
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()

        if (sessionError) {
          console.log('[Verify] getSession error:', sessionError.message)
          await delay(RETRY_DELAY)
          continue
        }

        if (!session) {
          console.log('[Verify] No session found')
          // No session means login failed or was cancelled
          if (attempt === MAX_RETRIES) {
            if (mounted.current) {
              setStatus('error')
              setErrorMessage('No session found. Please try logging in again.')
            }
            return
          }
          await delay(RETRY_DELAY)
          continue
        }

        console.log('[Verify] Session found, verifying with getUser...')

        // Step 2: Verify session works by calling getUser()
        const { data: { user }, error: userError } = await supabase.auth.getUser()

        if (userError) {
          console.log('[Verify] getUser error:', userError.message)

          // Try refreshing the session
          console.log('[Verify] Attempting session refresh...')
          const { error: refreshError } = await supabase.auth.refreshSession()

          if (refreshError) {
            console.log('[Verify] Refresh failed:', refreshError.message)
            await delay(RETRY_DELAY)
            continue
          }

          // Retry getUser after refresh
          const { data: { user: refreshedUser }, error: retryError } = await supabase.auth.getUser()
          if (retryError || !refreshedUser) {
            console.log('[Verify] getUser still failing after refresh')
            await delay(RETRY_DELAY)
            continue
          }

          console.log('[Verify] Session verified after refresh!')
        }

        if (!user) {
          console.log('[Verify] getUser returned null')
          await delay(RETRY_DELAY)
          continue
        }

        console.log('[Verify] Session verified! User:', user.id.slice(0, 8))

        // Step 3: Update AuthContext state so queries can execute
        console.log('[Verify] Refreshing AuthContext...')
        await refreshSession()

        // Step 4: Clear any stale queries and prepare for fresh data
        console.log('[Verify] Clearing query cache...')
        queryClient.clear()

        // Step 5: Add a small delay to ensure everything is settled
        await delay(200)

        // Step 6: Navigate to the app
        if (mounted.current && !hasNavigated.current) {
          hasNavigated.current = true
          console.log('[Verify] Navigating to app...')
          router.replace('/(app)')
        }
        return

      } catch (error) {
        console.log('[Verify] Exception:', error)
        await delay(RETRY_DELAY)
      }
    }

    // All retries exhausted
    if (mounted.current && !hasNavigated.current) {
      console.log('[Verify] All retries exhausted')
      setStatus('error')
      setErrorMessage('Unable to verify your session. Please try again.')
    }
  }

  function handleRetry() {
    setStatus('verifying')
    setErrorMessage('')
    verifySession()
  }

  function handleBackToLogin() {
    // Sign out to clear any partial state
    supabase.auth.signOut().catch(() => {})
    queryClient.clear()
    router.replace('/(auth)/login')
  }

  if (status === 'error') {
    return (
      <View style={styles.container}>
        <Text style={styles.errorTitle}>Something went wrong</Text>
        <Text style={styles.errorMessage}>{errorMessage}</Text>

        <TouchableOpacity style={styles.primaryButton} onPress={handleRetry}>
          <Text style={styles.primaryButtonText}>Try Again</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.secondaryButton} onPress={handleBackToLogin}>
          <Text style={styles.secondaryButtonText}>Back to Login</Text>
        </TouchableOpacity>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#007AFF" />
      <Text style={styles.title}>Setting up your account...</Text>
      <Text style={styles.subtitle}>This will only take a moment</Text>
    </View>
  )
}

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    marginTop: 24,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
    marginTop: 8,
    textAlign: 'center',
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ef4444',
    marginBottom: 12,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 32,
    textAlign: 'center',
  },
  primaryButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 8,
    marginBottom: 12,
    minWidth: 200,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 8,
    minWidth: 200,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#6b7280',
    fontSize: 16,
    fontWeight: '500',
  },
})
