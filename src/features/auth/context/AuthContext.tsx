// src/features/auth/context/AuthContext.tsx
import { createContext, useContext, useEffect, useState, useRef, useCallback, ReactNode } from 'react'
import { Session, User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { queryClient } from '@/lib/query-client'
import { AUTH_TIMEOUTS } from '../constants'

// Auth state machine states
type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated' | 'signing-out'

interface AuthContextType {
  session: Session | null
  user: User | null
  loading: boolean
  needsProfileSetup: boolean
  signOut: () => Promise<void>
  refreshSession: () => Promise<void>
  setAuthenticatedSession: (session: Session, user: User) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [status, setStatus] = useState<AuthStatus>('loading')
  const [needsProfileSetup, setNeedsProfileSetup] = useState(false)
  const isSigningOut = useRef(false)

  // Derived loading state for backwards compatibility
  const loading = status === 'loading'

  // Check if profile has username
  const checkProfile = useCallback(async (userId: string) => {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('username')
        .eq('id', userId)
        .maybeSingle()

      setNeedsProfileSetup(!profile || !profile.username)
    } catch (error) {
      console.warn('[Auth] Profile check failed:', error)
      // On error, assume profile exists to avoid blocking login
      setNeedsProfileSetup(false)
    }
  }, [])

  // Manually refresh session - useful after OAuth when onAuthStateChange may not fire
  const refreshSession = useCallback(async () => {
    try {
      // First verify the session is actually working by making an authenticated request
      // This ensures Supabase's internal state is fully initialized
      const { data: { user: verifiedUser }, error: userError } = await supabase.auth.getUser()

      if (userError || !verifiedUser) {
        // Session not ready yet, try again after a delay
        await new Promise(resolve => setTimeout(resolve, 500))
        const { data: retryData } = await supabase.auth.getUser()
        if (!retryData.user) {
          // Still no user, give up and let onAuthStateChange handle it
          return
        }
      }

      // Now get the full session
      const { data, error } = await supabase.auth.getSession()
      if (error) return

      const sessionData = data?.session ?? null
      const newUser = sessionData?.user ?? null

      if (newUser) {
        // Reset all queries to clear stale data and return to loading state
        queryClient.resetQueries()

        await checkProfile(newUser.id)
        setSession(sessionData)
        setUser(newUser)
        setStatus('authenticated')
      } else {
        setSession(null)
        setUser(null)
        setNeedsProfileSetup(false)
        setStatus('unauthenticated')
      }
    } catch (error) {
      // Silently fail - onAuthStateChange should handle it
    }
  }, [checkProfile])

  // Sign out and clear all state
  const signOut = useCallback(async () => {
    isSigningOut.current = true
    setStatus('signing-out')

    try {
      queryClient.clear()

      // Sign out with timeout to prevent hanging
      const signOutPromise = supabase.auth.signOut()
      const timeoutPromise = new Promise<{ error: Error }>((resolve) =>
        setTimeout(() => resolve({ error: new Error('Sign out timeout') }), AUTH_TIMEOUTS.SIGN_OUT)
      )

      const { error } = await Promise.race([signOutPromise, timeoutPromise])
      if (error) {
        console.warn('[Auth] Sign out error:', error.message)
      }

      // Clear local state regardless of Supabase result
      setSession(null)
      setUser(null)
      setNeedsProfileSetup(false)
      setStatus('unauthenticated')
    } catch (error) {
      console.warn('[Auth] Sign out exception:', error)
      setSession(null)
      setUser(null)
      setNeedsProfileSetup(false)
      setStatus('unauthenticated')
    } finally {
      isSigningOut.current = false
    }
  }, [])

  // Directly set authenticated session - used by OAuth flows that handle tokens manually
  // This bypasses onAuthStateChange which may not fire reliably for exchangeCodeForSession
  const setAuthenticatedSession = useCallback(async (newSession: Session, newUser: User) => {
    // Reset all queries to clear stale data and return to loading state
    queryClient.resetQueries()

    await checkProfile(newUser.id)
    setSession(newSession)
    setUser(newUser)
    setStatus('authenticated')
  }, [checkProfile])

  useEffect(() => {
    // Use local variable instead of ref - scoped to THIS effect run only
    // This prevents stale closures when React StrictMode double-runs effects
    let isCancelled = false

    // Initialize session from local storage
    const initSession = async () => {
      try {
        const { data, error } = await supabase.auth.getSession()

        if (error) {
          console.warn('[Auth] getSession error:', error.message)
        }

        if (isCancelled) return

        const sessionData = data?.session ?? null
        const newUser = sessionData?.user ?? null

        setSession(sessionData)
        setUser(newUser)

        if (newUser) {
          // We have a session - check profile and set authenticated
          // Don't rely solely on onAuthStateChange as it may not fire for OAuth
          await checkProfile(newUser.id)
          if (isCancelled) return
          setStatus('authenticated')
        } else {
          setStatus('unauthenticated')
        }
      } catch (error) {
        console.warn('[Auth] Session init failed:', error)
        if (!isCancelled) {
          setStatus('unauthenticated')
        }
      }
    }

    initSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      if (isCancelled) return

      // Ignore SIGNED_IN events while signing out (stale token refresh events)
      if (isSigningOut.current && event === 'SIGNED_IN') {
        return
      }

      const newUser = newSession?.user ?? null
      setSession(newSession)
      setUser(newUser)

      if (newUser) {
        // Reset queries to clear stale data and return to loading state
        if (event === 'SIGNED_IN') {
          queryClient.resetQueries()
        }
        await checkProfile(newUser.id)
        if (isCancelled) return
        setStatus('authenticated')
      } else {
        setNeedsProfileSetup(false)
        setStatus('unauthenticated')
      }
    })

    return () => {
      isCancelled = true
      subscription.unsubscribe()
    }
  }, [checkProfile])

  return (
    <AuthContext.Provider value={{ session, user, loading, needsProfileSetup, signOut, refreshSession, setAuthenticatedSession }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuthContext() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider')
  }
  return context
}
