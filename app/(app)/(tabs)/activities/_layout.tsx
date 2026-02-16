// app/(app)/activities/_layout.tsx
import { Stack } from 'expo-router'

export default function ActivitiesLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="new" options={{ presentation: 'modal' }} />
      <Stack.Screen name="[id]/index" />
      <Stack.Screen name="[id]/edit" options={{ presentation: 'modal' }} />
      <Stack.Screen name="[id]/projects/new" options={{ presentation: 'modal' }} />
      <Stack.Screen name="[id]/projects/[projectId]" />
    </Stack>
  )
}
