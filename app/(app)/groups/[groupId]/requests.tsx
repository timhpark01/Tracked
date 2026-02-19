// app/(app)/groups/[groupId]/requests.tsx
import { View, StyleSheet } from 'react-native'
import { useLocalSearchParams } from 'expo-router'
import { usePendingRequests, JoinRequestList } from '@/features/groups'

export default function GroupRequestsScreen() {
  const { groupId } = useLocalSearchParams<{ groupId: string }>()
  const { data: requests, isLoading } = usePendingRequests(groupId)

  return (
    <View style={styles.container}>
      <JoinRequestList
        requests={requests ?? []}
        groupId={groupId}
        isLoading={isLoading}
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
