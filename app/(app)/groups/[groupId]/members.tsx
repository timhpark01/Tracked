// app/(app)/groups/[groupId]/members.tsx
import { View, StyleSheet } from 'react-native'
import { useLocalSearchParams } from 'expo-router'
import { useGroupMembers, MemberList } from '@/features/groups'

export default function GroupMembersScreen() {
  const { groupId } = useLocalSearchParams<{ groupId: string }>()
  const { data: members, isLoading } = useGroupMembers(groupId)

  return (
    <View style={styles.container}>
      <MemberList members={members ?? []} isLoading={isLoading} />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
})
