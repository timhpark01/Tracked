// src/features/profiles/components/ProfileTabs.tsx
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'

type TabKey = 'skills' | 'feed' | 'activities'

interface Tab {
  key: TabKey
  label: string
  icon: keyof typeof Ionicons.glyphMap
  activeIcon: keyof typeof Ionicons.glyphMap
}

const TABS: Tab[] = [
  { key: 'feed', label: 'Posts', icon: 'newspaper-outline', activeIcon: 'newspaper' },
  { key: 'skills', label: 'Skills', icon: 'trophy-outline', activeIcon: 'trophy' },
  { key: 'activities', label: 'Activities', icon: 'list-outline', activeIcon: 'list' },
]

interface ProfileTabsProps {
  activeTab: TabKey
  onTabChange: (tab: TabKey) => void
}

export function ProfileTabs({ activeTab, onTabChange }: ProfileTabsProps) {
  return (
    <View style={styles.container}>
      {TABS.map((tab) => {
        const isActive = activeTab === tab.key
        return (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, isActive && styles.activeTab]}
            onPress={() => onTabChange(tab.key)}
            activeOpacity={0.7}
          >
            <Ionicons
              name={isActive ? tab.activeIcon : tab.icon}
              size={18}
              color={isActive ? '#007AFF' : '#9ca3af'}
            />
            <Text style={[styles.tabLabel, isActive && styles.activeTabLabel]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        )
      })}
    </View>
  )
}

export type { TabKey }

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  tab: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    gap: 3,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#007AFF',
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: '#9ca3af',
  },
  activeTabLabel: {
    color: '#007AFF',
    fontWeight: '600',
  },
})
