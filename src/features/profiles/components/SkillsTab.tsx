// src/features/profiles/components/SkillsTab.tsx
import { useState, useMemo } from 'react'
import { View, Text, StyleSheet, ScrollView, Dimensions, Pressable } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useActivities } from '@/features/activities'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/features/auth'
import Svg, { Polygon, Circle, Line, Text as SvgText, G, Rect } from 'react-native-svg'

interface ActivityStats {
  activityId: string
  activityName: string
  totalLogs: number
  totalMinutes: number
}

const CHART_SIZE = Dimensions.get('window').width - 80
const CENTER = CHART_SIZE / 2
const RADIUS = CHART_SIZE / 2 - 40

// Heat map constants
const HEAT_MAP_WEEKS = 16
const DAY_LABEL_WIDTH = 28
const HEAT_MAP_PADDING = 32 + 32 // container padding (16*2) + section padding (16*2)
const CELL_GAP = 2
const CELL_SIZE = (Dimensions.get('window').width - HEAT_MAP_PADDING - DAY_LABEL_WIDTH - 8) / HEAT_MAP_WEEKS - CELL_GAP

interface SkillsTabProps {
  userId?: string
}

export function SkillsTab({ userId }: SkillsTabProps) {
  const { user } = useAuth()
  const targetUserId = userId || user?.id
  const { data: activities } = useActivities(userId)
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
  const [selectedHeatMapDay, setSelectedHeatMapDay] = useState<{
    date: string
    count: number
    minutes: number
  } | null>(null)

  // Fetch aggregated stats for all activities
  const { data: activityStats } = useQuery({
    queryKey: ['activity-stats', targetUserId],
    queryFn: async () => {
      if (!activities || !targetUserId) return []

      const stats: ActivityStats[] = []

      for (const activity of activities) {
        const { data: logs } = await supabase
          .from('activity_logs')
          .select('value')
          .eq('user_id', targetUserId)
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
    enabled: !!targetUserId && !!activities,
  })

  // Fetch log history for heat map (past 16 weeks)
  const { data: logHistory } = useQuery({
    queryKey: ['log-history-heatmap', targetUserId],
    queryFn: async () => {
      if (!targetUserId) return []

      const startDate = new Date()
      startDate.setDate(startDate.getDate() - 16 * 7) // 16 weeks ago

      const { data: logs } = await supabase
        .from('activity_logs')
        .select('created_at, value')
        .eq('user_id', targetUserId)
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: true })

      return logs ?? []
    },
    enabled: !!targetUserId,
  })

  // Process log data for heat map
  const heatMapData = useMemo(() => {
    const today = new Date()
    const dayOfWeek = today.getDay() // 0 = Sunday
    const weeks = 16
    const totalDays = weeks * 7

    // Create a map of date strings to log counts/minutes
    const logsByDate: Record<string, { count: number; minutes: number }> = {}
    logHistory?.forEach((log) => {
      const date = new Date(log.created_at).toISOString().split('T')[0]
      if (!logsByDate[date]) {
        logsByDate[date] = { count: 0, minutes: 0 }
      }
      logsByDate[date].count++
      logsByDate[date].minutes += log.value || 0
    })

    // Generate array of days (16 weeks, starting from Sunday of earliest week)
    const days: Array<{
      date: string
      count: number
      minutes: number
      level: number
    }> = []

    // Start from today and go back, then reverse
    const startOffset = totalDays - 1 - dayOfWeek
    for (let i = startOffset; i >= -dayOfWeek; i--) {
      const d = new Date(today)
      d.setDate(d.getDate() - i)
      const dateStr = d.toISOString().split('T')[0]
      const data = logsByDate[dateStr] || { count: 0, minutes: 0 }

      // Calculate intensity level (0-4)
      let level = 0
      if (data.count > 0) {
        if (data.minutes >= 120) level = 4
        else if (data.minutes >= 60) level = 3
        else if (data.minutes >= 30) level = 2
        else level = 1
      }

      days.push({
        date: dateStr,
        count: data.count,
        minutes: data.minutes,
        level,
      })
    }

    return days
  }, [logHistory])

  // Heat map colors (light to dark blue)
  const heatMapColors = ['#ebedf0', '#c6e48b', '#7bc96f', '#239a3b', '#196127']

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
      {/* Activity Heat Map Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Activity History</Text>
        {heatMapData.length > 0 ? (
          <Pressable onPress={() => setSelectedHeatMapDay(null)}>
            {/* Day labels */}
            <View style={styles.heatMapContainer}>
              <View style={styles.dayLabels}>
                <Text style={styles.dayLabel}>Mon</Text>
                <Text style={styles.dayLabel}>Wed</Text>
                <Text style={styles.dayLabel}>Fri</Text>
              </View>
              <View style={styles.heatMapGrid}>
                <Svg
                  width={HEAT_MAP_WEEKS * (CELL_SIZE + CELL_GAP)}
                  height={7 * (CELL_SIZE + CELL_GAP)}
                >
                  {heatMapData.map((day, index) => {
                    const week = Math.floor(index / 7)
                    const dayOfWeek = index % 7
                    const isSelected = selectedHeatMapDay?.date === day.date

                    return (
                      <Rect
                        key={day.date}
                        x={week * (CELL_SIZE + CELL_GAP)}
                        y={dayOfWeek * (CELL_SIZE + CELL_GAP)}
                        width={CELL_SIZE}
                        height={CELL_SIZE}
                        rx={2}
                        fill={heatMapColors[day.level]}
                        stroke={isSelected ? '#007AFF' : 'transparent'}
                        strokeWidth={isSelected ? 2 : 0}
                        onPress={() =>
                          setSelectedHeatMapDay({
                            date: day.date,
                            count: day.count,
                            minutes: day.minutes,
                          })
                        }
                      />
                    )
                  })}
                </Svg>
              </View>
            </View>

            {/* Legend */}
            <View style={styles.heatMapLegend}>
              <Text style={styles.legendText}>Less</Text>
              {heatMapColors.map((color, i) => (
                <View
                  key={i}
                  style={[styles.legendCell, { backgroundColor: color }]}
                />
              ))}
              <Text style={styles.legendText}>More</Text>
            </View>

            {/* Selected day tooltip */}
            {selectedHeatMapDay && (
              <View style={styles.heatMapTooltip}>
                <Text style={styles.heatMapTooltipDate}>
                  {new Date(selectedHeatMapDay.date + 'T12:00:00').toLocaleDateString(
                    undefined,
                    {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                    }
                  )}
                </Text>
                <Text style={styles.heatMapTooltipStats}>
                  {selectedHeatMapDay.count === 0
                    ? 'No activity'
                    : `${selectedHeatMapDay.count} log${selectedHeatMapDay.count !== 1 ? 's' : ''} • ${formatTime(selectedHeatMapDay.minutes)}`}
                </Text>
              </View>
            )}
          </Pressable>
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="calendar-outline" size={48} color="#d1d5db" />
            <Text style={styles.emptyText}>No activity yet</Text>
            <Text style={styles.emptySubtext}>
              Start logging to see your activity history
            </Text>
          </View>
        )}
      </View>

      {/* Skill Radar Chart Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Skill Progress</Text>
        {radarStats.length >= 3 ? (
          <Pressable
            style={styles.chartContainer}
            onPress={() => setSelectedIndex(null)}
          >
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

              {/* Data points - with larger touch targets */}
              {radarStats.map((stat, i) => {
                const value = maxMinutes > 0 ? (stat.totalMinutes / maxMinutes) * 100 : 0
                const point = getPoint(i, Math.max(value, 5))
                const isSelected = selectedIndex === i
                return (
                  <G key={`point-${i}`}>
                    {/* Invisible larger touch target */}
                    <Circle
                      cx={point.x}
                      cy={point.y}
                      r={20}
                      fill="transparent"
                      onPress={() => setSelectedIndex(i)}
                    />
                    {/* Visible point */}
                    <Circle
                      cx={point.x}
                      cy={point.y}
                      r={isSelected ? 8 : 5}
                      fill={isSelected ? '#0056b3' : '#007AFF'}
                      stroke={isSelected ? '#fff' : 'none'}
                      strokeWidth={isSelected ? 2 : 0}
                      onPress={() => setSelectedIndex(i)}
                    />
                  </G>
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
                    fill={selectedIndex === i ? '#007AFF' : '#6b7280'}
                    fontWeight={selectedIndex === i ? 'bold' : 'normal'}
                    textAnchor="middle"
                    alignmentBaseline="middle"
                  >
                    {name}
                  </SvgText>
                )
              })}
            </Svg>

            {/* Selected skill tooltip */}
            {selectedIndex !== null && radarStats[selectedIndex] && (
              <View style={styles.tooltip}>
                <Text style={styles.tooltipTitle}>
                  {radarStats[selectedIndex].activityName}
                </Text>
                <View style={styles.tooltipStats}>
                  <View style={styles.tooltipStat}>
                    <Text style={styles.tooltipValue}>
                      {formatTime(radarStats[selectedIndex].totalMinutes)}
                    </Text>
                    <Text style={styles.tooltipLabel}>Total Time</Text>
                  </View>
                  <View style={styles.tooltipDivider} />
                  <View style={styles.tooltipStat}>
                    <Text style={styles.tooltipValue}>
                      {radarStats[selectedIndex].totalLogs}
                    </Text>
                    <Text style={styles.tooltipLabel}>Logs</Text>
                  </View>
                </View>
              </View>
            )}

            {/* Tap hint when no selection */}
            {selectedIndex === null && (
              <Text style={styles.tapHint}>Tap a point for details</Text>
            )}
          </Pressable>
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
    fontSize: 11,
    color: '#9ca3af',
    marginHorizontal: 4,
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
  tooltip: {
    marginTop: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    width: '100%',
  },
  tooltipTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 12,
  },
  tooltipStats: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tooltipStat: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  tooltipValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#007AFF',
  },
  tooltipLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  tooltipDivider: {
    width: 1,
    height: 32,
    backgroundColor: '#e5e7eb',
  },
  tapHint: {
    marginTop: 12,
    fontSize: 13,
    color: '#9ca3af',
    textAlign: 'center',
  },
  heatMapContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    overflow: 'hidden',
  },
  dayLabels: {
    width: DAY_LABEL_WIDTH,
    marginRight: 8,
    justifyContent: 'space-around',
    height: 7 * (CELL_SIZE + CELL_GAP) - CELL_GAP,
    paddingVertical: CELL_SIZE / 4,
  },
  dayLabel: {
    fontSize: 10,
    color: '#9ca3af',
    height: CELL_SIZE,
    lineHeight: CELL_SIZE,
  },
  heatMapGrid: {
    flex: 1,
  },
  heatMapLegend: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 12,
    gap: 4,
  },
  legendCell: {
    width: 12,
    height: 12,
    borderRadius: 2,
  },
  heatMapTooltip: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    alignItems: 'center',
  },
  heatMapTooltipDate: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  heatMapTooltipStats: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 2,
  },
})
