// src/features/auth/services/auth.service.ts
import { supabase } from '@/lib/supabase'

export async function signUp(email: string, password: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  })

  if (error) throw error

  // Check if email confirmation is required
  if (!data.session) {
    return { requiresConfirmation: true, user: data.user }
  }

  return { session: data.session, user: data.user }
}

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) throw error
  return { session: data.session, user: data.user }
}

export async function signOut() {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}
