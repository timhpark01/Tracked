// src/lib/storage.ts
import * as ImagePicker from 'expo-image-picker'
import { readAsStringAsync, EncodingType } from 'expo-file-system/legacy'
import { decode } from 'base64-arraybuffer'
import { supabase } from './supabase'

/**
 * Request media library permissions and launch image picker.
 * @returns Selected image URI or null if cancelled/denied
 */
export async function pickImage(): Promise<string | null> {
  // Request permissions first
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
  if (status !== 'granted') {
    console.warn('Media library permission denied')
    return null
  }

  // Launch picker
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: true,
    quality: 0.8,
  })

  if (result.canceled || !result.assets[0]) {
    return null
  }

  return result.assets[0].uri
}

/**
 * Pick image specifically for avatar (square aspect ratio)
 * @returns Selected image URI or null if cancelled/denied
 */
export async function pickAvatarImage(): Promise<string | null> {
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
  if (status !== 'granted') {
    console.warn('Media library permission denied')
    return null
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: true,
    quality: 0.8,
    aspect: [1, 1], // Square for avatars
  })

  if (result.canceled || !result.assets[0]) {
    return null
  }

  return result.assets[0].uri
}

/**
 * Upload an image to Supabase Storage
 * @param bucket - Storage bucket name
 * @param path - Path within the bucket
 * @param uri - Local file URI from image picker
 * @returns Public URL of uploaded image
 */
export async function uploadImage(
  bucket: string,
  path: string,
  uri: string
): Promise<string> {
  // Read file as base64 using expo-file-system legacy API
  const base64 = await readAsStringAsync(uri, {
    encoding: EncodingType.Base64,
  })

  // Convert base64 to ArrayBuffer for Supabase
  const arrayBuffer = decode(base64)

  // Upload to Supabase Storage
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(path, arrayBuffer, {
      contentType: 'image/jpeg',
      upsert: true,
    })

  if (error) {
    throw error
  }

  // Get public URL
  const { data: urlData } = supabase.storage
    .from(bucket)
    .getPublicUrl(data.path)

  return urlData.publicUrl
}

/**
 * Upload user avatar to avatars bucket
 * @param userId - User ID for folder organization
 * @param uri - Local file URI from image picker
 * @returns Public URL of uploaded avatar
 */
export async function uploadAvatar(
  userId: string,
  uri: string
): Promise<string> {
  const path = `${userId}/avatar.jpg`
  return uploadImage('avatars', path, uri)
}

/**
 * Upload log photo to log-photos bucket
 * @param userId - User ID for folder organization
 * @param logId - Log ID for subfolder
 * @param uri - Local file URI from image picker
 * @returns Public URL of uploaded photo
 */
export async function uploadLogPhoto(
  userId: string,
  logId: string,
  uri: string
): Promise<string> {
  const path = `${userId}/${logId}/${Date.now()}.jpg`
  return uploadImage('log-photos', path, uri)
}
