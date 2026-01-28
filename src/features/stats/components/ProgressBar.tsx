// src/features/stats/components/ProgressBar.tsx
import { View, Text, StyleSheet, type StyleProp, type ViewStyle } from 'react-native'

interface ProgressBarProps {
  progress: number // 0-100
  total: number
  current: number
  unit?: string
  style?: StyleProp<ViewStyle>
}

export function ProgressBar({ progress, total, current, unit, style }: ProgressBarProps) {
  const clampedProgress = Math.min(100, Math.max(0, progress))

  return (
    <View style={style}>
      <View style={styles.header}>
        <Text style={styles.label}>
          {current} / {total} {unit}
        </Text>
        <Text style={styles.percent}>{clampedProgress}%</Text>
      </View>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${clampedProgress}%` }]} />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  label: {
    fontSize: 14,
    color: '#6b7280',
  },
  percent: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  track: {
    height: 8,
    backgroundColor: '#e5e7eb',
    borderRadius: 4,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    backgroundColor: '#007AFF',
    borderRadius: 4,
  },
})
