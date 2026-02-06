// src/features/auth/context/AuthContext.tsx
import { createContext, useContext, useEffect, useState, useRef, ReactNode } from 'react'
import { Session, User } from '@supabase/supabase-js'
import { useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

interface AuthContextType {
  session: Session | null
  user: User | null
  loading: boolean
  needsProfileSetup: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const SESSION_TIMEOUT = 5000 // 5 second timeout

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient()
  const [session, setSession] = useState<Session | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [needsProfileSetup, setNeedsProfileSetup] = useState(false)
  const mounted = useRef(true)

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
        setSession(sessionData)
        setUser(sessionData?.user ?? null)

        if (sessionData?.user) {
          await checkProfile(sessionData.user.id)
        }
      } catch (error) {
        console.warn('[Auth] Session init failed:', error)
        if (mounted.current) {
          setSession(null)
          setUser(null)
        }
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
      console.log('[Auth] State change:', event, !!newSession)
      if (!mounted.current) return

      setSession(newSession)
      setUser(newSession?.user ?? null)

      if (newSession?.user) {
        await checkProfile(newSession.user.id)
      } else {
        setNeedsProfileSetup(false)
      }

      // Invalidate all queries when auth state changes
      // This ensures queries refetch with the new auth state
      if (event === 'SIGNED_IN' || event === 'SIGNED_OUT' || event === 'TOKEN_REFRESHED') {
        queryClient.invalidateQueries()
      }

      // Ensure loading is false after any auth state change
      setLoading(false)
    })

    return () => {
      mounted.current = false
      subscription.unsubscribe()
    }
  }, [])

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
