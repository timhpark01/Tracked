// src/features/auth/hooks/useAuth.ts
import { useEffect, useState, useRef } from 'react'
import { Session, User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

const SESSION_TIMEOUT = 5000 // 5 second timeout

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [needsProfileSetup, setNeedsProfileSetup] = useState(false)
  const mounted = useRef(true)

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

        const session = result?.data?.session ?? null
        setSession(session)
        setUser(session?.user ?? null)

        // Check if user needs to complete profile setup
        if (session?.user) {
          try {
            const { data: profile } = await supabase
              .from('profiles')
              .select('username')
              .eq('id', session.user.id)
              .maybeSingle()

            if (mounted.current) {
              setNeedsProfileSetup(!profile || !profile.username)
            }
          } catch {
            if (mounted.current) {
              setNeedsProfileSetup(true)
            }
          }
        }
      } catch {
        // Timeout or error - continue without session
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
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!mounted.current) return

      setSession(session)
      setUser(session?.user ?? null)

      if (session?.user) {
        try {
          const { data: profile } = await supabase
            .from('profiles')
            .select('username')
            .eq('id', session.user.id)
            .maybeSingle()

          if (mounted.current) {
            setNeedsProfileSetup(!profile || !profile.username)
          }
        } catch {
          if (mounted.current) {
            setNeedsProfileSetup(true)
          }
        }
      } else {
        setNeedsProfileSetup(false)
      }
    })

    return () => {
      mounted.current = false
      subscription.unsubscribe()
    }
  }, [])

  return { session, user, loading, needsProfileSetup }
}
