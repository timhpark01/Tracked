// app/(app)/groups/[groupId]/index.tsx
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native'
import { useLocalSearchParams, router, Stack } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import {
  useGroup,
  useGroupMembership,
  useGroupMembers,
  MembershipButton,
} from '@/features/groups'

export default function GroupDetailScreen() {
  const { groupId } = useLocalSearchParams<{ groupId: string }>()
  const { data: group, isLoading } = useGroup(groupId)
  const { data: membership, isLoading: membershipLoading } = useGroupMembership(groupId)
  const { data: members } = useGroupMembers(groupId)

  if (isLoading || !group) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    )
  }

  const isAdmin = membership?.role === 'admin'
  const previewMembers = members?.slice(0, 5) ?? []

  return (
    <>
      <Stack.Screen
        options={{
          title: group.name,
          headerRight: isAdmin
            ? () => (
                <TouchableOpacity
                  onPress={() => router.push(`/groups/${groupId}/requests`)}
                  style={styles.headerButton}
                >
                  <Ionicons name="people-outline" size={24} color="#007AFF" />
                </TouchableOpacity>
              )
            : undefined,
        }}
      />
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          {group.avatar_url ? (
            <Image source={{ uri: group.avatar_url }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Ionicons name="people" size={48} color="#6b7280" />
            </View>
          )}
          <Text style={styles.name}>{group.name}</Text>
          <View style={styles.metaRow}>
            <Ionicons
              name={
                group.membership_type === 'open'
                  ? 'globe-outline'
                  : group.membership_type === 'request'
                  ? 'hand-right-outline'
                  : 'lock-closed-outline'
              }
              size={16}
              color="#6b7280"
            />
            <Text style={styles.metaText}>
              {group.membership_type === 'open'
                ? 'Open group'
                : group.membership_type === 'request'
                ? 'Request to join'
                : 'Invite only'}
            </Text>
            <Text style={styles.metaDot}>·</Text>
            <Text style={styles.metaText}>
              {group.member_count} {group.member_count === 1 ? 'member' : 'members'}
            </Text>
          </View>
          <MembershipButton group={group} membership={membership} isLoadingMembership={membershipLoading} />
        </View>

        {group.description && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>About</Text>
            <Text style={styles.description}>{group.description}</Text>
          </View>
        )}

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Members</Text>
            <TouchableOpacity
              onPress={() => router.push(`/groups/${groupId}/members`)}
            >
              <Text style={styles.seeAll}>See all</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.membersPreview}>
            {previewMembers.map((member) => (
              <TouchableOpacity
                key={member.id}
                style={styles.memberPreviewItem}
                onPress={() => router.push(`/user/${member.user_id}`)}
              >
                {member.profile.avatar_url ? (
                  <Image
                    source={{ uri: member.profile.avatar_url }}
                    style={styles.memberAvatar}
                  />
                ) : (
                  <View style={styles.memberAvatarPlaceholder}>
                    <Text style={styles.memberAvatarInitial}>
                      {member.profile.username?.[0]?.toUpperCase() || '?'}
                    </Text>
                  </View>
                )}
                <Text style={styles.memberUsername} numberOfLines={1}>
                  @{member.profile.username}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>
    </>
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
    backgroundColor: '#fff',
  },
  headerButton: {
    padding: 8,
  },
  header: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 24,
    backgroundColor: '#e5e7eb',
  },
  avatarPlaceholder: {
    width: 96,
    height: 96,
    borderRadius: 24,
    backgroundColor: '#e5e7eb',
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginTop: 16,
    textAlign: 'center',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
  metaText: {
    fontSize: 14,
    color: '#6b7280',
    marginLeft: 4,
  },
  metaDot: {
    fontSize: 14,
    color: '#6b7280',
    marginHorizontal: 8,
  },
  section: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  seeAll: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
  },
  description: {
    fontSize: 15,
    color: '#374151',
    lineHeight: 22,
  },
  membersPreview: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  memberPreviewItem: {
    alignItems: 'center',
    width: 60,
  },
  memberAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#e5e7eb',
  },
  memberAvatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#e5e7eb',
    alignItems: 'center',
    justifyContent: 'center',
  },
  memberAvatarInitial: {
    fontSize: 18,
    color: '#6b7280',
    fontWeight: '600',
  },
  memberUsername: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
    textAlign: 'center',
  },
})
