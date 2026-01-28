import { Redirect } from 'expo-router'
import { View, ActivityIndicator, StyleSheet } from 'react-native'
import { useAuth } from '@/features/auth'

export default function Index() {
  const { session, loading, needsProfileSetup } = useAuth()

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    )
  }

  // Redirect based on auth state
  if (session) {
    // If user needs to complete profile setup (phone signup without username)
    if (needsProfileSetup) {
      return <Redirect href="/(auth)/username" />
    }
    return <Redirect href="/(app)" />
  }

  return <Redirect href="/(auth)/login" />
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
})
