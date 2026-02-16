// app/(app)/(tabs)/_layout.tsx
import { Tabs, router, usePathname } from 'expo-router'
import { View, StyleSheet, DeviceEventEmitter } from 'react-native'
import { Ionicons } from '@expo/vector-icons'

export default function TabsLayout() {
  const pathname = usePathname()

  return (
    <Tabs
        screenOptions={{
          tabBarActiveTintColor: '#007AFF',
          headerShown: true,
          headerShadowVisible: false,
          headerTitle: '',
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            tabBarLabel: 'Home',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="home-outline" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="activities"
          options={{
            href: null, // Hide from tab bar but keep routes accessible
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
          listeners={{
            tabPress: () => {
              if (pathname.startsWith('/search')) {
                DeviceEventEmitter.emit('focusSearchInput')
              }
            },
          }}
        />
        <Tabs.Screen
          name="add"
          options={{
            title: 'Log Entry',
            tabBarLabel: '',
            tabBarIcon: () => (
              <View style={styles.addButton}>
                <Ionicons name="add" size={28} color="#fff" />
              </View>
            ),
          }}
          listeners={{
            tabPress: (e) => {
              // If already on the add page, navigate to log page
              if (pathname === '/add') {
                e.preventDefault()
                router.push('/log')
              }
            },
          }}
        />
        <Tabs.Screen
          name="inbox"
          options={{
            title: 'Inbox',
            tabBarLabel: 'Inbox',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="mail-outline" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Profile',
            tabBarLabel: 'Profile',
            headerShown: false, // Stack handles its own header
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="person-outline" size={size} color={color} />
            ),
          }}
        />
    </Tabs>
  )
}

const styles = StyleSheet.create({
  addButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
})
