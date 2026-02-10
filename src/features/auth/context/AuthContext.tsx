// src/features/auth/context/AuthContext.tsx
import { createContext, useContext, useEffect, useState, useRef, useCallback, ReactNode } from 'react'
import { Session, User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { queryClient } from '@/lib/query-client'

interface AuthContextType {
  session: Session | null
  user: User | null
  loading: boolean
  needsProfileSetup: boolean
  refreshSession: () => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const SESSION_TIMEOUT = 10000 // 10 second timeout (increased for slow networks)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [needsProfileSetup, setNeedsProfileSetup] = useState(false)
  const mounted = useRef(true)
  const previousUserId = useRef<string | null>(null)
  const isSigningOut = useRef(false)

  // Track user changes for logging
  const trackUserChange = useCallback((newUserId: string | null) => {
    if (previousUserId.current === newUserId) return

    console.log('[Auth] User changed from', previousUserId.current, 'to', newUserId)
    previousUserId.current = newUserId

    // No need to manually clear cache - query keys include user ID,
    // so React Query automatically treats different users as different queries
  }, [])

  // Check profile for a given user
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
        // The app will handle missing profile gracefully
        setNeedsProfileSetup(false)
      }
    }
  }, [])

  // Force refresh session from Supabase - call this after OAuth login
  // to ensure AuthContext state is updated even if onAuthStateChange doesn't fire
  const refreshSession = useCallback(async () => {
    console.log('[Auth] Forcing session refresh...')
    // Clear signing out flag since we're explicitly refreshing (e.g., after login)
    isSigningOut.current = false

    try {
      // First, get the session from storage/memory
      const { data: { session: currentSession } } = await supabase.auth.getSession()

      if (!mounted.current) return

      const newUser = currentSession?.user ?? null
      console.log('[Auth] Refresh got session:', !!currentSession, 'user:', newUser?.id?.slice(0, 8))

      // If we have a session, verify it works by calling getUser()
      // This ensures the Supabase client is properly initialized
      if (currentSession) {
        console.log('[Auth] Verifying session with getUser()...')
        const { data: { user: verifiedUser }, error: userError } = await supabase.auth.getUser()

        if (userError) {
          console.warn('[Auth] getUser() failed:', userError.message)
          // Session might be invalid, try to refresh it
          const { data: { session: refreshedSession }, error: refreshError } = await supabase.auth.refreshSession()
          if (refreshError || !refreshedSession) {
            console.warn('[Auth] Session refresh failed, clearing session')
            setSession(null)
            setUser(null)
            setNeedsProfileSetup(false)
            setLoading(false)
            return
          }
          // Use the refreshed session
          setSession(refreshedSession)
          setUser(refreshedSession.user)
          if (refreshedSession.user) {
            await checkProfile(refreshedSession.user.id)
            trackUserChange(refreshedSession.user.id)
          }
        } else {
          console.log('[Auth] Session verified, user:', verifiedUser?.id?.slice(0, 8))
          setSession(currentSession)
          setUser(verifiedUser)
          if (verifiedUser) {
            await checkProfile(verifiedUser.id)
            trackUserChange(verifiedUser.id)
          }
        }

        // Invalidate all queries to force refetch with new auth state
        console.log('[Auth] Invalidating all queries...')
        await queryClient.invalidateQueries()
      } else {
        setSession(null)
        setUser(null)
        setNeedsProfileSetup(false)
        trackUserChange(null)
      }

      setLoading(false)
    } catch (error) {
      console.warn('[Auth] Session refresh failed:', error)
      if (mounted.current) {
        setLoading(false)
      }
    }
  }, [checkProfile, trackUserChange])

  // Sign out and clear all state
  const signOut = useCallback(async () => {
    console.log('[Auth] Signing out...')
    // Set flag to ignore any SIGNED_IN events that fire during/after signOut
    isSigningOut.current = true

    try {
      // Clear React Query cache first
      queryClient.clear()

      // Sign out from Supabase with timeout to prevent hanging
      const signOutPromise = supabase.auth.signOut()
      const timeoutPromise = new Promise<{ error: Error }>((resolve) =>
        setTimeout(() => resolve({ error: new Error('Sign out timeout') }), 5000)
      )

      const { error } = await Promise.race([signOutPromise, timeoutPromise])
      if (error) {
        console.warn('[Auth] Sign out error:', error.message)
        // Even if signOut fails, clear local state
      }

      // Clear local state regardless of Supabase result
      if (mounted.current) {
        setSession(null)
        setUser(null)
        setNeedsProfileSetup(false)
        trackUserChange(null)
      }

      console.log('[Auth] Sign out complete')
    } catch (error) {
      console.warn('[Auth] Sign out exception:', error)
      // Still clear local state on error
      if (mounted.current) {
        setSession(null)
        setUser(null)
        setNeedsProfileSetup(false)
        trackUserChange(null)
      }
      // Don't throw - we want logout to succeed even if Supabase fails
    }
  }, [trackUserChange])

  useEffect(() => {
    mounted.current = true

    const initSession = async () => {
      try {
        // Add timeout to prevent infinite loading
        const sessionPromise = supabase.auth.getSession()
        const timeoutPromise = new Promise<null>((_, reject) =>
          setTimeout(() => reject(new Error('Session timeout')), SESSION_TIMEOUT)
        )

        const result = await Promise.race([sessionPromise, timeoutPromise])

        if (!mounted.current) return

        const sessionData = result?.data?.session ?? null
        const newUser = sessionData?.user ?? null

        setSession(sessionData)
        setUser(newUser)
        previousUserId.current = newUser?.id ?? null

        if (newUser) {
          await checkProfile(newUser.id)
        }
      } catch (error) {
        console.warn('[Auth] Session init failed:', error)
        // Don't set session/user to null on timeout - let onAuthStateChange handle it
        // This prevents race conditions where timeout fires but session is actually valid
      } finally {
        if (mounted.current) {
          setLoading(false)
        }
      }
    }

    initSession()

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      console.log('[Auth] State change:', event, 'hasSession:', !!newSession, 'userId:', newSession?.user?.id?.slice(0, 8))
      if (!mounted.current) return

      // Ignore SIGNED_IN events while we're signing out - these are stale events
      // from pending token refreshes that fire after signOut clears the session
      if (isSigningOut.current && event === 'SIGNED_IN') {
        console.log('[Auth] Ignoring SIGNED_IN event during sign out')
        return
      }

      // Clear the signing out flag on SIGNED_OUT event
      if (event === 'SIGNED_OUT') {
        isSigningOut.current = false
      }

      const newUser = newSession?.user ?? null

      // Update state
      console.log('[Auth] Updating state, user:', newUser?.id?.slice(0, 8) ?? 'null')
      setSession(newSession)
      setUser(newUser)

      if (newUser) {
        await checkProfile(newUser.id)
      } else {
        setNeedsProfileSetup(false)
      }

      // Track user changes for debugging
      if (event === 'SIGNED_IN' || event === 'SIGNED_OUT' || event === 'TOKEN_REFRESHED') {
        trackUserChange(newUser?.id ?? null)
      }

      // Ensure loading is false after any auth state change
      console.log('[Auth] Setting loading to false')
      setLoading(false)
    })

    return () => {
      mounted.current = false
      subscription.unsubscribe()
    }
  }, [trackUserChange, checkProfile])

  return (
    <AuthContext.Provider value={{ session, user, loading, needsProfileSetup, refreshSession, signOut }}>
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
