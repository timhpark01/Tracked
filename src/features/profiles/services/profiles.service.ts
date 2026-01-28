// src/features/profiles/services/profiles.service.ts
import { supabase } from '@/lib/supabase'
import type { Database } from '@/types/database'

type Profile = Database['public']['Tables']['profiles']['Row']
type ProfileUpdate = Database['public']['Tables']['profiles']['Update']
type ProfileInsert = Database['public']['Tables']['profiles']['Insert']

export type { Profile, ProfileUpdate, ProfileInsert }

/**
 * Get a user's profile by ID
 * @param userId - The user ID to fetch profile for
 * @returns Profile or null if not found
 */
export async function getProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()

  // PGRST116 = not found, which is expected for new users
  if (error && error.code !== 'PGRST116') throw error
  return data
}

/**
 * Update a user's profile
 * @param userId - The user ID to update profile for
 * @param updates - Partial profile updates
 * @returns Updated profile
 */
export async function updateProfile(
  userId: string,
  updates: ProfileUpdate
): Promise<Profile> {
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId)
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Create a new profile (for new users)
 * @param profile - Profile data to insert
 * @returns Created profile
 */
export async function createProfile(
  profile: ProfileInsert
): Promise<Profile> {
  const { data, error } = await supabase
    .from('profiles')
    .insert(profile)
    .select()
    .single()

  if (error) throw error
  return data
}
