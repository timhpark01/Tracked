// src/features/auth/context/AuthContext.tsx
import { createContext, useContext, useEffect, useState, useRef, useCallback, ReactNode } from 'react'
import { Session, User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

interface AuthContextType {
  session: Session | null
  user: User | null
  loading: boolean
  needsProfileSetup: boolean
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

  // Track user changes for logging
  const trackUserChange = useCallback((newUserId: string | null) => {
    if (previousUserId.current === newUserId) return

    console.log('[Auth] User changed from', previousUserId.current, 'to', newUserId)
    previousUserId.current = newUserId

    // No need to manually clear cache - query keys include user ID,
    // so React Query automatically treats different users as different queries
  }, [])

  useEffect(() => {
    mounted.current = true

    const checkProfile = async (userId: string) => {
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
    }

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
  }, [trackUserChange])

  return (
    <AuthContext.Provider value={{ session, user, loading, needsProfileSetup }}>
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
