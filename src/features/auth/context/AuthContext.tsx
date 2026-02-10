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
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [status, setStatus] = useState<AuthStatus>('loading')
  const [needsProfileSetup, setNeedsProfileSetup] = useState(false)
  const mounted = useRef(true)

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

      if (mounted.current) {
        setNeedsProfileSetup(!profile || !profile.username)
      }
    } catch (error) {
      console.warn('[Auth] Profile check failed:', error)
      if (mounted.current) {
        // On error, assume profile exists to avoid blocking login
        setNeedsProfileSetup(false)
      }
    }
  }, [])

  // Sign out and clear all state
  const signOut = useCallback(async () => {
    console.log('[Auth] Signing out...')
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
      if (mounted.current) {
        setSession(null)
        setUser(null)
        setNeedsProfileSetup(false)
        setStatus('unauthenticated')
      }

      console.log('[Auth] Sign out complete')
    } catch (error) {
      console.warn('[Auth] Sign out exception:', error)
      if (mounted.current) {
        setSession(null)
        setUser(null)
        setNeedsProfileSetup(false)
        setStatus('unauthenticated')
      }
    }
  }, [])

  useEffect(() => {
    mounted.current = true

    // Initialize session
    const initSession = async () => {
      try {
        const sessionPromise = supabase.auth.getSession()
        const timeoutPromise = new Promise<null>((_, reject) =>
          setTimeout(() => reject(new Error('Session timeout')), AUTH_TIMEOUTS.SESSION_INIT)
        )

        const result = await Promise.race([sessionPromise, timeoutPromise])
        if (!mounted.current) return

        const sessionData = result?.data?.session ?? null
        const newUser = sessionData?.user ?? null

        setSession(sessionData)
        setUser(newUser)

        if (newUser) {
          await checkProfile(newUser.id)
          setStatus('authenticated')
        } else {
          setStatus('unauthenticated')
        }
      } catch (error) {
        console.warn('[Auth] Session init failed:', error)
        if (mounted.current) {
          setStatus('unauthenticated')
        }
      }
    }

    initSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      console.log('[Auth] State change:', event, 'hasSession:', !!newSession)
      if (!mounted.current) return

      // Ignore SIGNED_IN events while signing out (stale token refresh events)
      if (status === 'signing-out' && event === 'SIGNED_IN') {
        console.log('[Auth] Ignoring SIGNED_IN during sign out')
        return
      }

      const newUser = newSession?.user ?? null
      setSession(newSession)
      setUser(newUser)

      if (newUser) {
        await checkProfile(newUser.id)
        setStatus('authenticated')
      } else {
        setNeedsProfileSetup(false)
        setStatus('unauthenticated')
      }
    })

    return () => {
      mounted.current = false
      subscription.unsubscribe()
    }
  }, [checkProfile, status])

  return (
    <AuthContext.Provider value={{ session, user, loading, needsProfileSetup, signOut }}>
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
