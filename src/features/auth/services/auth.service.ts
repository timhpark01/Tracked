// src/features/auth/services/auth.service.ts
import { supabase } from '@/lib/supabase'
import * as WebBrowser from 'expo-web-browser'
import * as AppleAuthentication from 'expo-apple-authentication'
import { makeRedirectUri } from 'expo-auth-session'
import { Platform } from 'react-native'

/**
 * Get the redirect URI for OAuth and email confirmation
 */
export function getOAuthRedirectUri() {
  return makeRedirectUri({
    scheme: 'gudos',
    // Use native redirect for development builds, path for Expo Go
    native: 'gudos://auth/callback',
  })
}

export async function signUp(email: string, password: string) {
  const redirectUri = getOAuthRedirectUri()

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: redirectUri,
    },
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
 * Check if username is available (case-insensitive)
 * @param username - Username to check
 */
export async function checkUsernameAvailable(
  username: string
): Promise<boolean> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id')
    .ilike('username', username)
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

// ============================================================================
// Google OAuth Authentication
// ============================================================================

/**
 * Sign in with Google OAuth
 * Opens a browser window for Google authentication
 */
export async function signInWithGoogle() {
  const redirectUri = getOAuthRedirectUri()

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: redirectUri,
      skipBrowserRedirect: true,
    },
  })

  if (error) throw error
  if (!data.url) throw new Error('No OAuth URL returned')

  // Open the OAuth URL in a browser
  const result = await WebBrowser.openAuthSessionAsync(
    data.url,
    redirectUri,
    { showInRecents: true }
  )

  if (result.type === 'success') {

    // Extract tokens from the URL
    const url = new URL(result.url)

    // Try hash first (implicit flow), then search params (PKCE flow)
    let params = new URLSearchParams(url.hash.substring(1))
    let accessToken = params.get('access_token')
    let refreshToken = params.get('refresh_token')

    // If not in hash, check query params
    if (!accessToken) {
      params = new URLSearchParams(url.search)
      accessToken = params.get('access_token')
      refreshToken = params.get('refresh_token')
    }

    // Check for PKCE code parameter (Supabase may use PKCE flow)
    const code = params.get('code') || new URLSearchParams(url.search).get('code')

    // Handle PKCE flow - exchange code for session
    if (code && !accessToken) {
      const { data: sessionData, error: sessionError } =
        await supabase.auth.exchangeCodeForSession(code)

      if (sessionError) {
        throw sessionError
      }

      // Small delay to allow session to persist
      await new Promise(resolve => setTimeout(resolve, 100))

      // Verify the session is actually working
      const { data: { user: verifiedUser }, error: verifyError } = await supabase.auth.getUser()

      if (verifyError || !verifiedUser) {
        throw new Error('Session verification failed after PKCE exchange')
      }

      return { session: sessionData.session, user: verifiedUser }
    }

    if (accessToken || code) {
      const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
        access_token: accessToken!,
        refresh_token: refreshToken || '',
      })

      if (sessionError) throw sessionError
      if (!sessionData?.session?.user) throw new Error('No user in session')

      return { session: sessionData.session, user: sessionData.session.user }
    } else {
      throw new Error('No access token or code in callback')
    }
  }

  // For Expo Go: browser was dismissed, check if session was set via deep link
  if (result.type === 'dismiss') {
    // Give Supabase a moment to process the deep link
    await new Promise(resolve => setTimeout(resolve, 1000))

    const { data: { session } } = await supabase.auth.getSession()
    if (session) {
      return { session, user: session.user }
    }
  }

  if (result.type === 'cancel') {
    throw new Error('Google sign-in was cancelled')
  }
  throw new Error('Google sign-in failed')
}

// ============================================================================
// Apple Sign In Authentication (iOS only)
// ============================================================================

/**
 * Check if Apple Sign In is available on this device
 * Only available on iOS 13+
 */
export async function isAppleSignInAvailable(): Promise<boolean> {
  if (Platform.OS !== 'ios') {
    return false
  }
  return await AppleAuthentication.isAvailableAsync()
}

/**
 * Sign in with Apple (iOS only)
 * Uses native Apple Sign In and exchanges the credential with Supabase
 */
export async function signInWithApple() {
  // Check availability first
  const isAvailable = await isAppleSignInAvailable()
  if (!isAvailable) {
    throw new Error('Apple Sign In is not available on this device')
  }

  try {
    // Request Apple credential with required scopes
    const credential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
    })

    // The identityToken is a JWT that Supabase can verify
    if (!credential.identityToken) {
      throw new Error('No identity token returned from Apple')
    }

    // Sign in to Supabase using the Apple ID token
    const { data, error } = await supabase.auth.signInWithIdToken({
      provider: 'apple',
      token: credential.identityToken,
    })

    if (error) {
      throw error
    }

    if (!data.session || !data.user) {
      throw new Error('No session returned from Supabase')
    }

    // Small delay to allow session to persist (matching Google pattern)
    await new Promise(resolve => setTimeout(resolve, 100))

    // Verify the session is working
    const { data: { user: verifiedUser }, error: verifyError } = await supabase.auth.getUser()

    if (verifyError || !verifiedUser) {
      throw new Error('Session verification failed after Apple Sign In')
    }

    return { session: data.session, user: verifiedUser }
  } catch (error: any) {
    // Handle specific Apple Sign In errors
    if (error.code === 'ERR_REQUEST_CANCELED') {
      throw new Error('Apple sign-in was cancelled')
    }
    throw error
  }
}
