import { Redirect, Tabs } from 'expo-router'
import { View, ActivityIndicator, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useAuth } from '@/features/auth'

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

  // Render tab navigation
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#007AFF',
        headerShown: true,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarLabel: 'Home',
        }}
      />
      <Tabs.Screen
        name="hobbies"
        options={{
          title: 'Hobbies',
          tabBarLabel: 'Hobbies',
          headerShown: false, // Stack handles its own header
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: 'Search',
          tabBarLabel: 'Search',
          headerShown: false, // Stack handles its own header
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="search" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarLabel: 'Profile',
          headerShown: false, // Stack handles its own header
        }}
      />
    </Tabs>
  )
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
})
