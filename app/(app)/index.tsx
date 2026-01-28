import { View, Text, ScrollView, Pressable, ActivityIndicator, Alert, StyleSheet } from 'react-native'
import { Link } from 'expo-router'
import { useAuth, signOut } from '@/features/auth'
import { useMyProfile } from '@/features/profiles'
import { useHobbies } from '@/features/hobbies'

export default function HomeScreen() {
  const { user } = useAuth()
  const { data: profile, isLoading: profileLoading } = useMyProfile()
  const { data: hobbies, isLoading: hobbiesLoading } = useHobbies()

  const isLoading = profileLoading || hobbiesLoading

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    )
  }

  const recentHobbies = hobbies?.slice(0, 3) ?? []
  const hasProfile = !!profile?.username

  const handleSignOut = async () => {
    try {
      await signOut()
    } catch (error: any) {
      Alert.alert('Error', error.message)
    }
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        {/* Welcome Section */}
        <Text style={styles.welcomeText}>
          Welcome{profile?.username ? `, ${profile.username}` : ''}!
        </Text>

        {/* Profile CTA if not set up */}
        {!hasProfile && (
          <Link href="/profile/edit" asChild>
            <Pressable style={styles.profileCta}>
              <Text style={styles.profileCtaTitle}>Complete your profile</Text>
              <Text style={styles.profileCtaSubtitle}>Add a username and avatar to get started</Text>
            </Pressable>
          </Link>
        )}

        {/* Quick Stats */}
        <View style={styles.statsCard}>
          <Text style={styles.sectionTitle}>Your Progress</Text>
          <Text style={styles.statsText}>
            {hobbies?.length ?? 0} hobbies tracked
          </Text>
        </View>

        {/* Recent Hobbies */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Hobbies</Text>
            <Link href="/hobbies" asChild>
              <Pressable>
                <Text style={styles.seeAllText}>See all</Text>
              </Pressable>
            </Link>
          </View>

          {recentHobbies.length === 0 ? (
            <Link href="/hobbies/new" asChild>
              <Pressable style={styles.emptyHobbiesCard}>
                <Text style={styles.emptyHobbiesText}>
                  No hobbies yet. Tap to create your first!
                </Text>
              </Pressable>
            </Link>
          ) : (
            recentHobbies.map((hobby) => (
              <Link key={hobby.id} href={`/hobbies/${hobby.id}`} asChild>
                <Pressable style={styles.hobbyCard}>
                  <Text style={styles.hobbyName}>{hobby.name}</Text>
                  <Text style={styles.hobbyType}>
                    {hobby.tracking_type} tracking
                  </Text>
                </Pressable>
              </Link>
            ))
          )}
        </View>

        {/* Quick Actions */}
        <View style={styles.actionsRow}>
          <Link href="/hobbies/new" asChild>
            <Pressable style={styles.primaryButton}>
              <Text style={styles.primaryButtonText}>New Hobby</Text>
            </Pressable>
          </Link>
          <Pressable style={styles.secondaryButton} onPress={handleSignOut}>
            <Text style={styles.secondaryButtonText}>Sign Out</Text>
          </Pressable>
        </View>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: 16,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  profileCta: {
    backgroundColor: '#EBF5FF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  profileCtaTitle: {
    color: '#1D4ED8',
    fontWeight: '600',
    fontSize: 16,
  },
  profileCtaSubtitle: {
    color: '#3B82F6',
    fontSize: 14,
    marginTop: 4,
  },
  statsCard: {
    backgroundColor: '#F9FAFB',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  statsText: {
    color: '#6B7280',
    fontSize: 16,
  },
  section: {
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  seeAllText: {
    color: '#007AFF',
    fontSize: 14,
  },
  emptyHobbiesCard: {
    backgroundColor: '#F9FAFB',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#D1D5DB',
  },
  emptyHobbiesText: {
    color: '#6B7280',
    textAlign: 'center',
  },
  hobbyCard: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 8,
  },
  hobbyName: {
    fontWeight: '500',
    fontSize: 16,
  },
  hobbyType: {
    color: '#6B7280',
    fontSize: 14,
    textTransform: 'capitalize',
    marginTop: 2,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  primaryButton: {
    flex: 1,
    backgroundColor: '#007AFF',
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: '#E5E7EB',
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#374151',
    fontWeight: '600',
    fontSize: 16,
  },
})
