import { useState, useCallback, useRef } from 'react'
import { View, Text, StyleSheet, Pressable, LayoutChangeEvent } from 'react-native'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated'
import { FeedList } from '@/features/feed'

const TABS = ['Discover', 'Following'] as const

export default function HomeScreen() {
  const [activeTab, setActiveTab] = useState(0)
  const [trackWidth, setTrackWidth] = useState(0)
  const pillX = useSharedValue(0)

  const handleTrackLayout = (e: LayoutChangeEvent) => {
    setTrackWidth(e.nativeEvent.layout.width)
  }

  const handleTabPress = useCallback((index: number) => {
    setActiveTab(index)
    pillX.value = withSpring(index, {
      damping: 20,
      stiffness: 250,
      mass: 0.8,
    })
  }, [pillX])

  const pillStyle = useAnimatedStyle(() => {
    const halfWidth = trackWidth / 2
    return {
      transform: [{ translateX: pillX.value * halfWidth }],
    }
  })

  return (
    <View style={styles.container}>
      {/* Pill Tab Switcher */}
      <View style={styles.tabWrapper}>
        <View style={styles.tabTrack} onLayout={handleTrackLayout}>
          {trackWidth > 0 && (
            <Animated.View style={[styles.pill, { width: trackWidth / 2 }, pillStyle]} />
          )}
          {TABS.map((tab, index) => (
            <Pressable
              key={tab}
              style={styles.tabButton}
              onPress={() => handleTabPress(index)}
            >
              <Text style={[styles.tabText, activeTab === index && styles.tabTextActive]}>
                {tab}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {/* Feed */}
      <View style={styles.content}>
        <FeedList feedType={activeTab === 0 ? 'public' : 'following'} />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
  tabWrapper: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#f3f4f6',
  },
  tabTrack: {
    flexDirection: 'row',
    backgroundColor: '#e5e7eb',
    borderRadius: 12,
    padding: 3,
    position: 'relative',
  },
  pill: {
    position: 'absolute',
    top: 3,
    bottom: 3,
    backgroundColor: '#ffffff',
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    zIndex: 1,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
  },
  tabTextActive: {
    color: '#111827',
    fontWeight: '700',
  },
  content: {
    flex: 1,
  },
})
