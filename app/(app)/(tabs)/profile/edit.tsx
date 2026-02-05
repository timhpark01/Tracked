// app/(app)/profile/edit.tsx
import { useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native'
import { router } from 'expo-router'
import {
  useMyProfile,
  useUpdateProfile,
  useCreateProfile,
  AvatarPicker,
  ProfileForm,
  type ProfileFormData,
} from '@/features/profiles'

export default function EditProfileScreen() {
  const { data: profile, isLoading: isLoadingProfile } = useMyProfile()
  const updateProfile = useUpdateProfile()
  const createProfile = useCreateProfile()

  // Local state for pending avatar upload
  const [pendingAvatarUri, setPendingAvatarUri] = useState<string | null>(null)

  // Determine if this is a new profile or an update
  const isNewProfile = !profile

  const handleSubmit = async (data: ProfileFormData) => {
    try {
      if (isNewProfile) {
        // Create new profile
        await createProfile.mutateAsync({
          username: data.username,
          bio: data.bio || undefined,
          avatarUri: pendingAvatarUri || undefined,
        })
      } else {
        // Update existing profile
        await updateProfile.mutateAsync({
          username: data.username,
          bio: data.bio || undefined,
          avatarUri: pendingAvatarUri || undefined,
        })
      }

      // Navigate back to profile on success
      router.back()
    } catch (error: any) {
      Alert.alert(
        'Error',
        error.message || 'Failed to save profile. Please try again.'
      )
    }
  }

  if (isLoadingProfile) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    )
  }

  // Show the avatar that will be displayed:
  // 1. Pending local URI (new selection)
  // 2. Current profile avatar URL
  // 3. null (no avatar)
  const displayAvatarUrl = pendingAvatarUri || profile?.avatar_url || null

  const isSubmitting = updateProfile.isPending || createProfile.isPending

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header text */}
        <Text style={styles.title}>
          {isNewProfile ? 'Set Up Your Profile' : 'Edit Profile'}
        </Text>
        <Text style={styles.subtitle}>
          {isNewProfile
            ? 'Choose a username and tell others about yourself'
            : 'Update your profile information'}
        </Text>

        {/* Avatar picker */}
        <View style={styles.avatarSection}>
          <AvatarPicker
            currentUrl={displayAvatarUrl}
            onPick={setPendingAvatarUri}
            size={120}
          />
        </View>

        {/* Profile form */}
        <ProfileForm
          initialData={{
            username: profile?.username || '',
            bio: profile?.bio,
          }}
          onSubmit={handleSubmit}
          isLoading={isSubmitting}
          submitLabel={isNewProfile ? 'Create Profile' : 'Save Changes'}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    padding: 24,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 32,
    textAlign: 'center',
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
})
