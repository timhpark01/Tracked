// src/features/profiles/components/FeedTab.tsx
import { View, StyleSheet } from 'react-native'
import { FeedList } from '@/features/feed'

interface FeedTabProps {
  userId?: string
}

export function FeedTab({ userId }: FeedTabProps) {
  return (
    <View style={styles.container}>
      <FeedList feedType="personal" targetUserId={userId} />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
})
