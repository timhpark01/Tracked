import { Redirect, Stack } from 'expo-router'
import { useAuth } from '@/features/auth'

export default function AuthLayout() {
  const { session, loading } = useAuth()

  // Show nothing while loading (prevents flash)
  if (loading) {
    return null
  }

  // Redirect to app if already authenticated
  if (session) {
    return <Redirect href="/(app)" />
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="login" />
      <Stack.Screen name="signup" />
    </Stack>
  )
}
