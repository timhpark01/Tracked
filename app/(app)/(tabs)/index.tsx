import { useState, useRef } from 'react'
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Dimensions,
  Animated,
} from 'react-native'
import { FeedList } from '@/features/feed'

const { width: SCREEN_WIDTH } = Dimensions.get('window')
const TABS = ['Discover', 'Following'] as const

export default function HomeScreen() {
  const [activeTab, setActiveTab] = useState(0)
  const scrollViewRef = useRef<ScrollView>(null)
  const indicatorPosition = useRef(new Animated.Value(0)).current

  const handleTabPress = (index: number) => {
    setActiveTab(index)
    scrollViewRef.current?.scrollTo({ x: index * SCREEN_WIDTH, animated: true })
    Animated.spring(indicatorPosition, {
      toValue: index,
      useNativeDriver: true,
    }).start()
  }

  const handleScroll = (event: any) => {
    const scrollX = event.nativeEvent.contentOffset.x
    const newIndex = Math.round(scrollX / SCREEN_WIDTH)
    if (newIndex !== activeTab && newIndex >= 0 && newIndex < TABS.length) {
      setActiveTab(newIndex)
    }
    // Animate indicator based on scroll position
    const position = scrollX / SCREEN_WIDTH
    indicatorPosition.setValue(position)
  }

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

      {/* Swipable Content */}
      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        <View style={styles.page}>
          <FeedList feedType="public" />
        </View>
        <View style={styles.page}>
          <FeedList feedType="following" />
        </View>
      </ScrollView>
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
  page: {
    width: SCREEN_WIDTH,
    flex: 1,
  },
})
