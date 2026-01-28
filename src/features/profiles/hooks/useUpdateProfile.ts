// src/features/profiles/hooks/useUpdateProfile.ts
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/features/auth'
import { uploadAvatar } from '@/lib/storage'
import { updateProfile, createProfile } from '../services/profiles.service'
import type { ProfileUpdate } from '../services/profiles.service'

interface UpdateProfileInput {
  username?: string
  bio?: string
  avatarUri?: string // Local URI from image picker
  isPublic?: boolean
}

/**
 * Hook to update the current user's profile
 * Handles avatar upload and profile updates in one mutation
 */
export function useUpdateProfile() {
  const queryClient = useQueryClient()
  const { user } = useAuth()

  return useMutation({
    mutationFn: async (input: UpdateProfileInput) => {
      if (!user) throw new Error('User not authenticated')

      const updates: ProfileUpdate = {}

      // Handle avatar upload if provided
      if (input.avatarUri) {
        const avatarUrl = await uploadAvatar(user.id, input.avatarUri)
        updates.avatar_url = avatarUrl
      }

      // Add other fields to updates
      if (input.username !== undefined) {
        updates.username = input.username
      }
      if (input.bio !== undefined) {
        updates.bio = input.bio
      }
      if (input.isPublic !== undefined) {
        updates.is_public = input.isPublic
      }

      // Update profile
      return updateProfile(user.id, updates)
    },
    onSuccess: () => {
      // Invalidate both profile queries to refetch fresh data
      queryClient.invalidateQueries({ queryKey: ['my-profile'] })
      if (user) {
        queryClient.invalidateQueries({ queryKey: ['profile', user.id] })
      }
    },
  })
}

interface CreateProfileInput {
  username: string
  bio?: string
  avatarUri?: string
  isPublic?: boolean
}

/**
 * Hook to create a profile for a new user
 */
export function useCreateProfile() {
  const queryClient = useQueryClient()
  const { user } = useAuth()

  return useMutation({
    mutationFn: async (input: CreateProfileInput) => {
      if (!user) throw new Error('User not authenticated')

      let avatarUrl: string | undefined

      // Handle avatar upload if provided
      if (input.avatarUri) {
        avatarUrl = await uploadAvatar(user.id, input.avatarUri)
      }

      // Create profile
      return createProfile({
        id: user.id,
        username: input.username,
        bio: input.bio,
        avatar_url: avatarUrl,
        is_public: input.isPublic ?? true,
      })
    },
    onSuccess: () => {
      // Invalidate both profile queries to refetch fresh data
      queryClient.invalidateQueries({ queryKey: ['my-profile'] })
      if (user) {
        queryClient.invalidateQueries({ queryKey: ['profile', user.id] })
      }
    },
  })
}
