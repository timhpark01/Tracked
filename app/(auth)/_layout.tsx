import { Redirect, Stack, usePathname } from 'expo-router'
import { useAuth } from '@/features/auth'

export default function AuthLayout() {
  const { session, loading, needsProfileSetup } = useAuth()
  const pathname = usePathname()

  // Show nothing while loading (prevents flash)
  if (loading) {
    return null
  }

  // If authenticated with complete profile, redirect to app
  if (session && !needsProfileSetup) {
    return <Redirect href="/(app)" />
  }

  // If authenticated but needs profile setup, redirect to username screen
  // (unless already there)
  const isOnUsernameScreen = pathname === '/(auth)/username' || pathname === '/username'
  if (session && needsProfileSetup && !isOnUsernameScreen) {
    return <Redirect href="/(auth)/username" />
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="login" />
      <Stack.Screen name="username" />
      <Stack.Screen name="email-login" />
      <Stack.Screen name="signup" />
    </Stack>
  )
}
