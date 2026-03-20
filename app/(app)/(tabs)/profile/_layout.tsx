// app/(app)/profile/_layout.tsx
import { Stack, router } from 'expo-router'
import { Pressable, View, StyleSheet, Text } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

function ProfileHeader() {
  const insets = useSafeAreaInsets()
  return (
    <View style={[styles.header, { paddingTop: insets.top }]}>
      <View style={styles.headerContent}>
        <Text style={styles.title}>Profile</Text>
        <Pressable
          onPress={() => router.push('/profile/settings')}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          style={styles.iconButton}
        >
          <Ionicons name="settings-outline" size={22} color="#007AFF" />
        </Pressable>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  headerContent: {
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingLeft: 20,
    paddingRight: 16,
  },
  title: {
    fontSize: 17,
    fontWeight: '600',
    color: '#111827',
  },
  iconButton: {
    padding: 4,
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
        name="activity/[id]"
        options={{
          title: '',
        }}
      />
    </Stack>
  )
}
