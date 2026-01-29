// src/features/auth/hooks/useAuth.ts
import { useEffect, useState } from 'react'
import { Session, User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [needsProfileSetup, setNeedsProfileSetup] = useState(false)

  useEffect(() => {
    // Get initial session
    supabase.auth
      .getSession()
      .then(async ({ data: { session } }) => {
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

            // Needs setup if no profile or no username
            setNeedsProfileSetup(!profile || !profile.username)
          } catch {
            // Profile check failed - assume needs setup
            setNeedsProfileSetup(true)
          }
        }

        setLoading(false)
      })
      .catch(() => {
        // Auth session fetch failed - continue without session
        setLoading(false)
      })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session)
      setUser(session?.user ?? null)

      if (session?.user) {
        try {
          const { data: profile } = await supabase
            .from('profiles')
            .select('username')
            .eq('id', session.user.id)
            .maybeSingle()

          setNeedsProfileSetup(!profile || !profile.username)
        } catch {
          setNeedsProfileSetup(true)
        }
      } else {
        setNeedsProfileSetup(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  return { session, user, loading, needsProfileSetup }
}
