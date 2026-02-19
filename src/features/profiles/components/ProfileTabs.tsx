// src/features/profiles/components/ProfileTabs.tsx
import { useState } from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'

type TabKey = 'skills' | 'feed' | 'activities'

interface Tab {
  key: TabKey
  label: string
  icon: keyof typeof Ionicons.glyphMap
}

const TABS: Tab[] = [
  { key: 'skills', label: 'Skills', icon: 'trophy-outline' },
  { key: 'feed', label: 'Feed', icon: 'newspaper-outline' },
  { key: 'activities', label: 'Activities', icon: 'list-outline' },
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
          >
            <Ionicons
              name={tab.icon}
              size={20}
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
    borderBottomColor: '#f3f4f6',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 6,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#007AFF',
  },
  tabLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#9ca3af',
  },
  activeTabLabel: {
    color: '#007AFF',
  },
})
