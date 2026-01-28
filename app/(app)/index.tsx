import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native'
import { router } from 'expo-router'
import { useAuth, signOut } from '@/features/auth'

export default function HomeScreen() {
  const { user } = useAuth()

  const handleLogout = async () => {
    try {
      await signOut()
      router.replace('/(auth)/login')
    } catch (error: any) {
      Alert.alert('Error', error.message)
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome!</Text>
      <Text style={styles.subtitle}>Logged in as: {user?.email}</Text>

      <View style={styles.buttonsContainer}>
        {/* Hobbies button */}
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => router.push('/hobbies')}
        >
          <Text style={styles.primaryButtonText}>My Hobbies</Text>
        </TouchableOpacity>

        {/* Profile button */}
        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => router.push('/profile')}
        >
          <Text style={styles.secondaryButtonText}>View Profile</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutText}>Sign Out</Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginTop: 48,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 32,
  },
  buttonsContainer: {
    flex: 1,
    justifyContent: 'center',
    gap: 16,
    padding: 24,
  },
  primaryButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: '#f3f4f6',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#374151',
    fontSize: 16,
    fontWeight: '600',
  },
  logoutButton: {
    padding: 16,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  logoutText: {
    color: '#FF3B30',
    fontSize: 16,
    fontWeight: '600',
  },
})
