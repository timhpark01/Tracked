import { useState, useCallback } from 'react'
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Dimensions,
  Animated,
} from 'react-native'
import { FeedList } from '@/features/feed'

const { width: SCREEN_WIDTH } = Dimensions.get('window')
const TABS = ['Discover', 'Following'] as const

export default function HomeScreen() {
  const [activeTab, setActiveTab] = useState(0)
  const [indicatorPosition] = useState(() => new Animated.Value(0))

  const handleTabPress = useCallback((index: number) => {
    setActiveTab(index)
    Animated.spring(indicatorPosition, {
      toValue: index,
      useNativeDriver: true,
    }).start()
  }, [indicatorPosition])

  const indicatorTranslateX = indicatorPosition.interpolate({
    inputRange: [0, 1],
    outputRange: [0, SCREEN_WIDTH / 2],
  })

  return (
    <View style={styles.container}>
      {/* Tab Bar */}
      <View style={styles.tabBar}>
        {TABS.map((tab, index) => (
          <Pressable
            key={tab}
            style={styles.tab}
            onPress={() => handleTabPress(index)}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === index && styles.tabTextActive,
              ]}
            >
              {tab}
            </Text>
          </Pressable>
        ))}
        <Animated.View
          style={[
            styles.indicator,
            {
              transform: [{ translateX: indicatorTranslateX }],
            },
          ]}
        />
      </View>

      {/* Tab Content - Only active tab is rendered */}
      <View style={styles.content}>
        <FeedList feedType={activeTab === 0 ? 'public' : 'following'} key={activeTab} />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    position: 'relative',
  },
  tab: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
  },
  tabText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#6b7280',
  },
  tabTextActive: {
    color: '#007AFF',
    fontWeight: '600',
  },
  indicator: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: SCREEN_WIDTH / 2,
    height: 2,
    backgroundColor: '#007AFF',
  },
  content: {
    flex: 1,
  },
})
