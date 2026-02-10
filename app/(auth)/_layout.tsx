import { Redirect, Stack, usePathname } from 'expo-router'
import { useAuth } from '@/features/auth'

export default function AuthLayout() {
  const { session, loading, needsProfileSetup } = useAuth()
  const pathname = usePathname()

  // Show nothing while loading (prevents flash)
  if (loading) {
    return null
  }

  // Allow verifying screen to show even with a session
  // (it handles its own navigation after verification)
  const isVerifying = pathname === '/(auth)/verifying' || pathname === '/verifying'

  // Redirect to app if already authenticated and profile is complete
  // BUT not if we're on the verifying screen
  if (session && !needsProfileSetup && !isVerifying) {
    return <Redirect href="/(app)" />
  }

  // If authenticated but needs profile setup, allow access to username screen
  // (handled by keeping them in auth flow)

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="login" />
      <Stack.Screen name="verifying" />
      <Stack.Screen name="username" />
      <Stack.Screen name="email-login" />
      <Stack.Screen name="signup" />
      {/* Phone auth screens hidden for now */}
      {/* <Stack.Screen name="phone" /> */}
      {/* <Stack.Screen name="verify-otp" /> */}
    </Stack>
  )
}
