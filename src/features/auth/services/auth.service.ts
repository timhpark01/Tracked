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

// ============================================================================
// Phone Authentication
// ============================================================================

/**
 * Send OTP to phone number for sign in/up
 * @param phone - Phone number in E.164 format (e.g., +1234567890)
 */
export async function sendPhoneOtp(phone: string) {
  const { data, error } = await supabase.auth.signInWithOtp({
    phone,
  })

  if (error) throw error
  return data
}

/**
 * Verify phone OTP code
 * @param phone - Phone number used to request OTP
 * @param token - 6-digit OTP code
 */
export async function verifyPhoneOtp(phone: string, token: string) {
  const { data, error } = await supabase.auth.verifyOtp({
    phone,
    token,
    type: 'sms',
  })

  if (error) throw error

  return {
    session: data.session,
    user: data.user,
  }
}

/**
 * Complete phone signup by creating profile with chosen username
 * @param userId - User ID from auth
 * @param username - Chosen username
 */
export async function completePhoneSignup(userId: string, username: string) {
  const { error: profileError } = await supabase.from('profiles').insert({
    id: userId,
    username,
  })

  if (profileError) throw profileError
}

/**
 * Check if username is available
 * @param username - Username to check
 */
export async function checkUsernameAvailable(
  username: string
): Promise<boolean> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id')
    .eq('username', username)
    .maybeSingle()

  if (error) throw error
  return data === null
}

/**
 * Check if user has completed profile setup (has username)
 * @param userId - User ID to check
 */
export async function checkProfileComplete(userId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('profiles')
    .select('username')
    .eq('id', userId)
    .maybeSingle()

  if (error) throw error
  return data !== null && data.username !== null
}
