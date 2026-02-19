// src/features/profiles/components/SkillsTab.tsx
import { View, Text, StyleSheet, ScrollView, Dimensions } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useActivities } from '@/features/activities'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/features/auth'
import Svg, { Polygon, Circle, Line, Text as SvgText, G } from 'react-native-svg'

interface ActivityStats {
  activityId: string
  activityName: string
  totalLogs: number
  totalMinutes: number
}

const CHART_SIZE = Dimensions.get('window').width - 80
const CENTER = CHART_SIZE / 2
const RADIUS = CHART_SIZE / 2 - 40

export function SkillsTab() {
  const { user } = useAuth()
  const { data: activities } = useActivities()

  // Fetch aggregated stats for all activities
  const { data: activityStats } = useQuery({
    queryKey: ['activity-stats', user?.id],
    queryFn: async () => {
      if (!activities) return []

      const stats: ActivityStats[] = []

      for (const activity of activities) {
        const { data: logs } = await supabase
          .from('activity_logs')
          .select('value')
          .eq('user_id', user!.id)
          .in(
            'project_id',
            (
              await supabase
                .from('projects')
                .select('id')
                .eq('activity_id', activity.id)
            ).data?.map((p) => p.id) ?? []
          )

        const totalMinutes = logs?.reduce((sum, log) => sum + log.value, 0) ?? 0

        stats.push({
          activityId: activity.id,
          activityName: activity.name,
          totalLogs: logs?.length ?? 0,
          totalMinutes,
        })
      }

      return stats.sort((a, b) => b.totalMinutes - a.totalMinutes)
    },
    enabled: !!user?.id && !!activities,
  })

  const maxMinutes = Math.max(...(activityStats?.map((s) => s.totalMinutes) ?? [1]), 1)

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    if (hours === 0) return `${mins}m`
    if (mins === 0) return `${hours}h`
    return `${hours}h ${mins}m`
  }

  // Prepare data for radar chart (use top 6 activities for best visual)
  const radarStats = activityStats?.slice(0, 6) ?? []
  const numPoints = radarStats.length

  // Calculate polygon points for the data
  const getPoint = (index: number, value: number) => {
    const angle = (Math.PI * 2 * index) / numPoints - Math.PI / 2
    const r = (value / 100) * RADIUS
    return {
      x: CENTER + r * Math.cos(angle),
      y: CENTER + r * Math.sin(angle),
    }
  }

  // Get label position (slightly outside the chart)
  const getLabelPoint = (index: number) => {
    const angle = (Math.PI * 2 * index) / numPoints - Math.PI / 2
    const r = RADIUS + 25
    return {
      x: CENTER + r * Math.cos(angle),
      y: CENTER + r * Math.sin(angle),
    }
  }

  // Create polygon points string
  const dataPoints = radarStats.map((stat, i) => {
    const value = maxMinutes > 0 ? (stat.totalMinutes / maxMinutes) * 100 : 0
    const point = getPoint(i, Math.max(value, 5)) // Min 5% so it's visible
    return `${point.x},${point.y}`
  }).join(' ')

  // Create grid polygon points for each level
  const gridLevels = [25, 50, 75, 100]
  const gridPolygons = gridLevels.map(level => {
    return radarStats.map((_, i) => {
      const point = getPoint(i, level)
      return `${point.x},${point.y}`
    }).join(' ')
  })

  // Generate badges based on activity stats
  const badges = activityStats
    ?.filter((s) => s.totalMinutes >= 60)
    .map((s) => {
      let tier: 'bronze' | 'silver' | 'gold' = 'bronze'
      let icon: keyof typeof Ionicons.glyphMap = 'ribbon-outline'

      if (s.totalMinutes >= 6000) {
        tier = 'gold'
        icon = 'trophy'
      } else if (s.totalMinutes >= 1200) {
        tier = 'silver'
        icon = 'medal-outline'
      }

      return {
        id: s.activityId,
        name: s.activityName,
        tier,
        icon,
        hours: Math.floor(s.totalMinutes / 60),
      }
    })

  const tierColors = {
    bronze: '#CD7F32',
    silver: '#C0C0C0',
    gold: '#FFD700',
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Skill Radar Chart Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Skill Progress</Text>
        {radarStats.length >= 3 ? (
          <View style={styles.chartContainer}>
            <Svg width={CHART_SIZE} height={CHART_SIZE}>
              {/* Grid circles/polygons */}
              {gridPolygons.map((points, i) => (
                <Polygon
                  key={`grid-${i}`}
                  points={points}
                  fill="none"
                  stroke="#e5e7eb"
                  strokeWidth={1}
                />
              ))}

              {/* Axis lines */}
              {radarStats.map((_, i) => {
                const point = getPoint(i, 100)
                return (
                  <Line
                    key={`axis-${i}`}
                    x1={CENTER}
                    y1={CENTER}
                    x2={point.x}
                    y2={point.y}
                    stroke="#e5e7eb"
                    strokeWidth={1}
                  />
                )
              })}

              {/* Data polygon */}
              <Polygon
                points={dataPoints}
                fill="rgba(0, 122, 255, 0.3)"
                stroke="#007AFF"
                strokeWidth={2}
              />

              {/* Data points */}
              {radarStats.map((stat, i) => {
                const value = maxMinutes > 0 ? (stat.totalMinutes / maxMinutes) * 100 : 0
                const point = getPoint(i, Math.max(value, 5))
                return (
                  <Circle
                    key={`point-${i}`}
                    cx={point.x}
                    cy={point.y}
                    r={4}
                    fill="#007AFF"
                  />
                )
              })}

              {/* Labels */}
              {radarStats.map((stat, i) => {
                const labelPoint = getLabelPoint(i)
                const name = stat.activityName.length > 8
                  ? stat.activityName.substring(0, 8) + '...'
                  : stat.activityName
                return (
                  <SvgText
                    key={`label-${i}`}
                    x={labelPoint.x}
                    y={labelPoint.y}
                    fontSize={11}
                    fill="#6b7280"
                    textAnchor="middle"
                    alignmentBaseline="middle"
                  >
                    {name}
                  </SvgText>
                )
              })}
            </Svg>

            {/* Legend */}
            <View style={styles.legend}>
              {radarStats.map((stat) => (
                <View key={stat.activityId} style={styles.legendItem}>
                  <View style={styles.legendDot} />
                  <Text style={styles.legendText} numberOfLines={1}>
                    {stat.activityName}: {formatTime(stat.totalMinutes)}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        ) : activityStats && activityStats.length > 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="analytics-outline" size={48} color="#d1d5db" />
            <Text style={styles.emptyText}>Need more activities</Text>
            <Text style={styles.emptySubtext}>
              Add at least 3 activities to see the radar chart
            </Text>
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="analytics-outline" size={48} color="#d1d5db" />
            <Text style={styles.emptyText}>No progress yet</Text>
            <Text style={styles.emptySubtext}>Start logging to see your skills</Text>
          </View>
        )}
      </View>

      {/* Badges Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Badges</Text>
        {badges && badges.length > 0 ? (
          <View style={styles.badgesGrid}>
            {badges.map((badge) => (
              <View key={badge.id} style={styles.badgeCard}>
                <View
                  style={[
                    styles.badgeIcon,
                    { backgroundColor: `${tierColors[badge.tier]}20` },
                  ]}
                >
                  <Ionicons
                    name={badge.icon}
                    size={28}
                    color={tierColors[badge.tier]}
                  />
                </View>
                <Text style={styles.badgeName} numberOfLines={1}>
                  {badge.name}
                </Text>
                <Text style={styles.badgeHours}>{badge.hours}h logged</Text>
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="ribbon-outline" size={48} color="#d1d5db" />
            <Text style={styles.emptyText}>No badges yet</Text>
            <Text style={styles.emptySubtext}>
              Log 1+ hours in an activity to earn a badge
            </Text>
          </View>
        )}
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  chartContainer: {
    alignItems: 'center',
  },
  legend: {
    marginTop: 16,
    width: '100%',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#007AFF',
    marginRight: 8,
  },
  legendText: {
    fontSize: 13,
    color: '#6b7280',
    flex: 1,
  },
  badgesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  badgeCard: {
    width: '30%',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f9fafb',
    borderRadius: 12,
  },
  badgeIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  badgeName: {
    fontSize: 13,
    fontWeight: '500',
    color: '#374151',
    textAlign: 'center',
  },
  badgeHours: {
    fontSize: 11,
    color: '#9ca3af',
    marginTop: 2,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6b7280',
    marginTop: 12,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9ca3af',
    marginTop: 4,
    textAlign: 'center',
  },
})
