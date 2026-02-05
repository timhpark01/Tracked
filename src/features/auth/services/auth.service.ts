// src/features/auth/services/auth.service.ts
import { supabase } from '@/lib/supabase'
import * as WebBrowser from 'expo-web-browser'
import { makeRedirectUri } from 'expo-auth-session'

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
 * Get the redirect URI for OAuth
 */
export function getOAuthRedirectUri() {
  return makeRedirectUri({
    scheme: 'gudos',
    // Use native redirect for development builds, path for Expo Go
    native: 'gudos://auth/callback',
  })
}

/**
 * Sign in with Google OAuth
 * Opens a browser window for Google authentication
 */
export async function signInWithGoogle() {
  const redirectUri = getOAuthRedirectUri()
  console.log('[Auth] Redirect URI:', redirectUri)

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: redirectUri,
      skipBrowserRedirect: true,
    },
  })

  console.log('[Auth] OAuth response:', { url: data?.url, error })

  if (error) throw error
  if (!data.url) throw new Error('No OAuth URL returned')

  console.log('[Auth] Opening OAuth URL:', data.url)

  // Open the OAuth URL in a browser
  const result = await WebBrowser.openAuthSessionAsync(
    data.url,
    redirectUri,
    { showInRecents: true }
  )

  console.log('[Auth] WebBrowser result type:', result.type)
  console.log('[Auth] WebBrowser result:', JSON.stringify(result, null, 2))

  if (result.type === 'success') {
    console.log('[Auth] Success! Callback URL:', result.url)

    // Extract tokens from the URL
    const url = new URL(result.url)
    console.log('[Auth] URL hash:', url.hash)
    console.log('[Auth] URL search:', url.search)

    // Try hash first (implicit flow), then search params (PKCE flow)
    let params = new URLSearchParams(url.hash.substring(1))
    let accessToken = params.get('access_token')
    let refreshToken = params.get('refresh_token')

    // If not in hash, check query params
    if (!accessToken) {
      console.log('[Auth] No token in hash, checking query params...')
      params = new URLSearchParams(url.search)
      accessToken = params.get('access_token')
      refreshToken = params.get('refresh_token')
    }

    // Check for PKCE code parameter (Supabase may use PKCE flow)
    const code = params.get('code') || new URLSearchParams(url.search).get('code')
    console.log('[Auth] Access token found:', !!accessToken)
    console.log('[Auth] Refresh token found:', !!refreshToken)
    console.log('[Auth] PKCE code found:', !!code)

    // Handle PKCE flow - exchange code for session
    if (code && !accessToken) {
      console.log('[Auth] Exchanging PKCE code for session...')
      const { data: sessionData, error: sessionError } =
        await supabase.auth.exchangeCodeForSession(code)

      if (sessionError) {
        console.log('[Auth] PKCE exchange error:', sessionError)
        throw sessionError
      }

      console.log('[Auth] PKCE session set successfully!')
      return { session: sessionData.session, user: sessionData.user }
    }

    if (accessToken) {
      // Set the session with the tokens from the OAuth callback
      console.log('[Auth] Setting session...')
      const { data: sessionData, error: sessionError } =
        await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken || '',
        })

      if (sessionError) {
        console.log('[Auth] Session error:', sessionError)
        throw sessionError
      }

      console.log('[Auth] Session set successfully!')
      return { session: sessionData.session, user: sessionData.user }
    } else {
      console.log('[Auth] No access token found in callback URL')
      throw new Error('No access token in callback')
    }
  }

  // For Expo Go: browser was dismissed, check if session was set via deep link
  if (result.type === 'dismiss') {
    console.log('[Auth] Browser dismissed, checking for session...')
    // Give Supabase a moment to process the deep link
    await new Promise(resolve => setTimeout(resolve, 1000))

    const { data: { session } } = await supabase.auth.getSession()
    if (session) {
      console.log('[Auth] Session found after dismiss!')
      return { session, user: session.user }
    }
  }

  if (result.type === 'cancel') {
    console.log('[Auth] User cancelled')
    throw new Error('Google sign-in was cancelled')
  }

  console.log('[Auth] Unknown result type:', result.type)
  throw new Error('Google sign-in failed')
}
