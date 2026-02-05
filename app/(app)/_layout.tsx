// app/(app)/_layout.tsx
import { Redirect, Stack } from 'expo-router'
import { View, ActivityIndicator, StyleSheet } from 'react-native'
import { useAuth } from '@/features/auth'
import { LogModalProvider } from '@/features/logs'

export default function AppLayout() {
  const { session, loading } = useAuth()

  // Show loading screen while checking session
  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    )
  }

  // Redirect to login if not authenticated
  if (!session) {
    return <Redirect href="/(auth)/login" />
  }

  // Render stack navigation with log modal provider
  return (
    <LogModalProvider>
      <Stack
        initialRouteName="(tabs)"
        screenOptions={{
          headerShown: false,
        }}
      >
        <Stack.Screen name="(tabs)" />
        <Stack.Screen
          name="comments"
          options={{
            headerShown: false,
            presentation: 'card',
          }}
        />
      </Stack>
    </LogModalProvider>
  )
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
})
