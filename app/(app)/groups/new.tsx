// app/(app)/groups/new.tsx
import { View, StyleSheet } from 'react-native'
import { router } from 'expo-router'
import { GroupForm, useCreateGroup } from '@/features/groups'

export default function NewGroupScreen() {
  const createMutation = useCreateGroup()

  const handleSubmit = async (data: {
    name: string
    description: string
    membership_type: 'open' | 'request' | 'invite'
    is_discoverable: boolean
  }) => {
    try {
      const group = await createMutation.mutateAsync(data)
      router.replace(`/groups/${group.id}`)
    } catch (error) {
      console.error('Failed to create group:', error)
    }
  }

  return (
    <View style={styles.container}>
      <GroupForm
        onSubmit={handleSubmit}
        isSubmitting={createMutation.isPending}
        submitLabel="Create Group"
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
})
