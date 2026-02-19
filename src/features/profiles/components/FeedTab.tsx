// src/features/profiles/components/FeedTab.tsx
import { View, StyleSheet } from 'react-native'
import { FeedList } from '@/features/feed'

export function FeedTab() {
  return (
    <View style={styles.container}>
      <FeedList feedType="personal" />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
})
