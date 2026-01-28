// app/(app)/hobbies/_layout.tsx
import { Stack } from 'expo-router'

export default function HobbiesLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          title: 'My Hobbies',
        }}
      />
      <Stack.Screen
        name="new"
        options={{
          title: 'New Hobby',
          presentation: 'modal',
        }}
      />
      <Stack.Screen
        name="[id]/index"
        options={{
          title: 'Hobby Details',
        }}
      />
      <Stack.Screen
        name="[id]/edit"
        options={{
          title: 'Edit Hobby',
          presentation: 'modal',
        }}
      />
    </Stack>
  )
}
