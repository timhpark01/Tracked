// src/features/feed/components/FeedEmpty.tsx
import { View, Text, StyleSheet } from 'react-native'

export function FeedEmpty() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>No activity yet</Text>
      <Text style={styles.subtitle}>
        Follow some users to see their progress here
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 64,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
    lineHeight: 20,
  },
})
