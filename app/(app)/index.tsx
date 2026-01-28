import { View, StyleSheet } from 'react-native'
import { FeedList } from '@/features/feed'

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <FeedList />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
})
