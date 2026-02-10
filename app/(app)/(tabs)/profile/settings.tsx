import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useAuth } from '@/features/auth'

export default function SettingsScreen() {
  const { signOut } = useAuth()

  const handleLogout = () => {
    Alert.alert('Log Out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log Out',
        style: 'destructive',
        onPress: async () => {
          try {
            await signOut()
            // Navigation is handled automatically by (app)/_layout.tsx
            // when session becomes null - no manual navigation needed
          } catch (error: any) {
            Alert.alert('Error', error.message || 'Failed to log out')
          }
        },
      },
    ])
  }

  return (
    <View style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account</Text>

        <TouchableOpacity style={styles.menuItem} onPress={handleLogout}>
          <View style={styles.menuItemLeft}>
            <Ionicons name="log-out-outline" size={22} color="#ef4444" />
            <Text style={[styles.menuItemText, styles.logoutText]}>Log Out</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
        </TouchableOpacity>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  section: {
    marginTop: 24,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#e5e7eb',
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6b7280',
    textTransform: 'uppercase',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#f9fafb',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuItemText: {
    fontSize: 16,
    color: '#111827',
    marginLeft: 12,
  },
  logoutText: {
    color: '#ef4444',
  },
})
