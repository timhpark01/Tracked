// app/(app)/groups/_layout.tsx
import { Stack, router } from 'expo-router'
import { Pressable, Text, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'

export default function GroupsLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerShadowVisible: false,
        headerStyle: {
          backgroundColor: '#fff',
        },
        headerTitleStyle: {
          fontWeight: '600',
          fontSize: 17,
        },
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: 'My Groups',
          headerLeft: () => (
            <Pressable onPress={() => router.back()} style={styles.backButton}>
              <Ionicons name="chevron-back" size={24} color="#007AFF" />
              <Text style={styles.backText}>Back</Text>
            </Pressable>
          ),
        }}
      />
      <Stack.Screen
        name="new"
        options={{
          title: 'Create Group',
          presentation: 'modal',
          headerLeft: () => (
            <Pressable onPress={() => router.back()} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#007AFF" />
            </Pressable>
          ),
        }}
      />
      <Stack.Screen
        name="[groupId]/index"
        options={{
          title: '',
          headerLeft: () => (
            <Pressable onPress={() => router.back()} style={styles.backButton}>
              <Ionicons name="chevron-back" size={24} color="#007AFF" />
              <Text style={styles.backText}>Back</Text>
            </Pressable>
          ),
        }}
      />
      <Stack.Screen
        name="[groupId]/members"
        options={{
          title: 'Members',
          headerLeft: () => (
            <Pressable onPress={() => router.back()} style={styles.backButton}>
              <Ionicons name="chevron-back" size={24} color="#007AFF" />
              <Text style={styles.backText}>Back</Text>
            </Pressable>
          ),
        }}
      />
      <Stack.Screen
        name="[groupId]/requests"
        options={{
          title: 'Join Requests',
          headerLeft: () => (
            <Pressable onPress={() => router.back()} style={styles.backButton}>
              <Ionicons name="chevron-back" size={24} color="#007AFF" />
              <Text style={styles.backText}>Back</Text>
            </Pressable>
          ),
        }}
      />
    </Stack>
  )
}

const styles = StyleSheet.create({
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    marginLeft: -8,
  },
  backText: {
    fontSize: 17,
    color: '#007AFF',
  },
  closeButton: {
    padding: 8,
    marginLeft: -8,
  },
})
