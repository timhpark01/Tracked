// app/(app)/profile/_layout.tsx
import { Stack, router } from 'expo-router'
import { Pressable, View, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

function ProfileHeader() {
  const insets = useSafeAreaInsets()
  return (
    <View style={[styles.header, { paddingTop: insets.top }]}>
      <View style={styles.headerContent}>
        <View style={{ width: 24 }} />
        <View />
        <Pressable
          onPress={() => router.push('/profile/settings')}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="settings-outline" size={24} color="#007AFF" />
        </Pressable>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: '#fff',
  },
  headerContent: {
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingLeft: 16,
    paddingRight: 20,
  },
})

export default function ProfileLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerShadowVisible: false,
        headerTitle: '',
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          header: () => <ProfileHeader />,
        }}
      />
      <Stack.Screen
        name="edit"
        options={{
          title: 'Edit Profile',
        }}
      />
      <Stack.Screen
        name="settings"
        options={{
          title: 'Settings',
        }}
      />
      <Stack.Screen
        name="[userId]"
        options={{
          title: 'Profile',
        }}
      />
      <Stack.Screen
        name="followers"
        options={{
          title: 'Followers',
        }}
      />
      <Stack.Screen
        name="following"
        options={{
          title: 'Following',
        }}
      />
      <Stack.Screen
        name="activity/[id]"
        options={{
          title: '',
        }}
      />
    </Stack>
  )
}
