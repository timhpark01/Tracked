// src/features/feed/components/FeedSkeleton.tsx
import { View, StyleSheet, Dimensions } from 'react-native'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated'
import { useEffect } from 'react'

const { width: SCREEN_WIDTH } = Dimensions.get('window')

function SkeletonBlock({ width, height, radius = 6 }: { width: number | string; height: number; radius?: number }) {
  const opacity = useSharedValue(0.4)

  useEffect(() => {
    opacity.value = withRepeat(
      withTiming(1, { duration: 900, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    )
  }, [])

  const animStyle = useAnimatedStyle(() => ({ opacity: opacity.value }))

  return (
    <Animated.View
      style={[
        animStyle,
        {
          width: width as number,
          height,
          borderRadius: radius,
          backgroundColor: '#e5e7eb',
        },
      ]}
    />
  )
}

function SkeletonCard() {
  return (
    <View style={styles.card}>
      <View style={styles.accentBar} />
      <View style={styles.cardContent}>
        {/* User row */}
        <View style={styles.userRow}>
          <SkeletonBlock width={46} height={46} radius={23} />
          <View style={styles.userInfo}>
            <SkeletonBlock width={100} height={13} />
            <View style={{ marginTop: 5 }}>
              <SkeletonBlock width={60} height={11} />
            </View>
          </View>
          <SkeletonBlock width={56} height={30} radius={20} />
        </View>

        {/* Activity row */}
        <View style={styles.activityRow}>
          <SkeletonBlock width={120} height={14} />
          <SkeletonBlock width={60} height={22} radius={6} />
        </View>

        {/* Note */}
        <View style={{ marginTop: 8 }}>
          <SkeletonBlock width={SCREEN_WIDTH - 80} height={12} />
          <View style={{ marginTop: 5 }}>
            <SkeletonBlock width={(SCREEN_WIDTH - 80) * 0.7} height={12} />
          </View>
        </View>

        {/* Action bar */}
        <View style={styles.actionBar}>
          <SkeletonBlock width={44} height={14} />
          <SkeletonBlock width={44} height={14} />
        </View>
      </View>
    </View>
  )
}

export function FeedSkeleton() {
  return (
    <View>
      <SkeletonCard />
      <SkeletonCard />
      <SkeletonCard />
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    marginHorizontal: 12,
    marginVertical: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
    overflow: 'hidden',
  },
  accentBar: {
    width: 4,
    backgroundColor: '#e5e7eb',
  },
  cardContent: {
    flex: 1,
    padding: 14,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 10,
  },
  userInfo: {
    flex: 1,
  },
  activityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  actionBar: {
    flexDirection: 'row',
    marginTop: 18,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    gap: 20,
  },
})
