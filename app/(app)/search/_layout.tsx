import { Stack } from 'expo-router'

export default function SearchLayout() {
  return (
    <Stack screenOptions={{ headerShown: true, headerShadowVisible: false, headerTitle: '' }}>
      <Stack.Screen name="index" />
    </Stack>
  )
}
