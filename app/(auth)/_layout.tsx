import { Redirect, Stack } from 'expo-router'
import { useAuth } from '@/features/auth'

export default function AuthLayout() {
  const { session, loading, needsProfileSetup } = useAuth()

  // Show nothing while loading (prevents flash)
  if (loading) {
    return null
  }

  // Redirect to app if already authenticated and profile is complete
  if (session && !needsProfileSetup) {
    return <Redirect href="/(app)" />
  }

  // If authenticated but needs profile setup, allow access to username screen
  // (handled by keeping them in auth flow)

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="login" />
      <Stack.Screen name="username" />
      <Stack.Screen name="email-login" />
      <Stack.Screen name="signup" />
      {/* Phone auth screens hidden for now */}
      {/* <Stack.Screen name="phone" /> */}
      {/* <Stack.Screen name="verify-otp" /> */}
    </Stack>
  )
}
