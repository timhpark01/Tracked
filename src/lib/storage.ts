// src/lib/storage.ts
import * as ImagePicker from 'expo-image-picker'
import { readAsStringAsync, EncodingType } from 'expo-file-system/legacy'
import { decode } from 'base64-arraybuffer'
import { ActionSheetIOS, Platform, Alert } from 'react-native'
import { supabase } from './supabase'

const MAX_MEDIA_ITEMS = 5
const VIDEO_MAX_DURATION = 30 // seconds

export interface MediaItem {
  uri: string
  type: 'image' | 'video'
  duration?: number // Video duration in seconds
}

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
 * Request camera permissions and take a photo.
 * @returns Captured image URI or null if cancelled/denied
 */
export async function takePhoto(): Promise<string | null> {
  const { status } = await ImagePicker.requestCameraPermissionsAsync()
  if (status !== 'granted') {
    console.warn('Camera permission denied')
    return null
  }

  const result = await ImagePicker.launchCameraAsync({
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
 * Show action sheet to pick image from library or take a photo.
 * @returns Selected/captured image URI or null if cancelled
 */
export function pickOrTakeImage(): Promise<string | null> {
  return new Promise((resolve) => {
    const options = ['Take Photo', 'Choose from Library', 'Cancel']
    const cancelButtonIndex = 2

    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options,
          cancelButtonIndex,
        },
        async (buttonIndex) => {
          if (buttonIndex === 0) {
            resolve(await takePhoto())
          } else if (buttonIndex === 1) {
            resolve(await pickImage())
          } else {
            resolve(null)
          }
        }
      )
    } else {
      // Android: use Alert with buttons
      Alert.alert(
        'Add Photo',
        'Choose an option',
        [
          {
            text: 'Take Photo',
            onPress: async () => resolve(await takePhoto()),
          },
          {
            text: 'Choose from Library',
            onPress: async () => resolve(await pickImage()),
          },
          {
            text: 'Cancel',
            style: 'cancel',
            onPress: () => resolve(null),
          },
        ],
        { cancelable: true, onDismiss: () => resolve(null) }
      )
    }
  })
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

/**
 * Pick multiple media items (photos and videos) from library
 * @param currentCount - Number of already selected items
 * @returns Array of selected media items
 */
export async function pickMedia(currentCount: number = 0): Promise<MediaItem[]> {
  const remainingSlots = MAX_MEDIA_ITEMS - currentCount
  if (remainingSlots <= 0) {
    Alert.alert('Limit Reached', `Maximum ${MAX_MEDIA_ITEMS} media items allowed per post.`)
    return []
  }

  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
  if (status !== 'granted') {
    console.warn('Media library permission denied')
    return []
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images', 'videos'],
    allowsMultipleSelection: true,
    selectionLimit: remainingSlots,
    quality: 0.8,
    videoMaxDuration: VIDEO_MAX_DURATION,
  })

  if (result.canceled || !result.assets) {
    return []
  }

  return result.assets.map((asset) => ({
    uri: asset.uri,
    type: asset.type === 'video' ? 'video' : 'image',
    duration: asset.duration ? Math.round(asset.duration / 1000) : undefined,
  }))
}

/**
 * Take a photo or video with the camera
 * @returns Single media item or null if cancelled
 */
export async function captureMedia(): Promise<MediaItem | null> {
  const { status } = await ImagePicker.requestCameraPermissionsAsync()
  if (status !== 'granted') {
    console.warn('Camera permission denied')
    return null
  }

  const result = await ImagePicker.launchCameraAsync({
    mediaTypes: ['images', 'videos'],
    allowsEditing: true,
    quality: 0.8,
    videoMaxDuration: VIDEO_MAX_DURATION,
  })

  if (result.canceled || !result.assets[0]) {
    return null
  }

  const asset = result.assets[0]
  return {
    uri: asset.uri,
    type: asset.type === 'video' ? 'video' : 'image',
    duration: asset.duration ? Math.round(asset.duration / 1000) : undefined,
  }
}

/**
 * Show action sheet to pick media from library or capture with camera
 * @param currentCount - Number of already selected items
 * @returns Array of selected media items
 */
export function pickOrCaptureMedia(currentCount: number = 0): Promise<MediaItem[]> {
  return new Promise((resolve) => {
    const remainingSlots = MAX_MEDIA_ITEMS - currentCount
    if (remainingSlots <= 0) {
      Alert.alert('Limit Reached', `Maximum ${MAX_MEDIA_ITEMS} media items allowed per post.`)
      resolve([])
      return
    }

    const options = ['Take Photo/Video', 'Choose from Library', 'Cancel']
    const cancelButtonIndex = 2

    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options,
          cancelButtonIndex,
        },
        async (buttonIndex) => {
          if (buttonIndex === 0) {
            const item = await captureMedia()
            resolve(item ? [item] : [])
          } else if (buttonIndex === 1) {
            resolve(await pickMedia(currentCount))
          } else {
            resolve([])
          }
        }
      )
    } else {
      Alert.alert(
        'Add Media',
        'Choose an option',
        [
          {
            text: 'Take Photo/Video',
            onPress: async () => {
              const item = await captureMedia()
              resolve(item ? [item] : [])
            },
          },
          {
            text: 'Choose from Library',
            onPress: async () => resolve(await pickMedia(currentCount)),
          },
          {
            text: 'Cancel',
            style: 'cancel',
            onPress: () => resolve([]),
          },
        ],
        { cancelable: true, onDismiss: () => resolve([]) }
      )
    }
  })
}

/**
 * Upload a media item (image or video) to log-photos bucket
 * @param userId - User ID for folder organization
 * @param logId - Log ID for subfolder
 * @param item - Media item to upload
 * @param index - Unique index to avoid filename collisions
 * @returns Public URL of uploaded media
 */
export async function uploadLogMedia(
  userId: string,
  logId: string,
  item: MediaItem,
  index: number = 0
): Promise<string> {
  const extension = item.type === 'video' ? 'mp4' : 'jpg'
  const contentType = item.type === 'video' ? 'video/mp4' : 'image/jpeg'
  // Use timestamp + index to ensure unique filenames even in parallel uploads
  const path = `${userId}/${logId}/${Date.now()}_${index}.${extension}`

  const base64 = await readAsStringAsync(item.uri, {
    encoding: EncodingType.Base64,
  })

  const arrayBuffer = decode(base64)

  const { data, error } = await supabase.storage
    .from('log-photos')
    .upload(path, arrayBuffer, {
      contentType,
      upsert: true,
    })

  if (error) {
    throw error
  }

  const { data: urlData } = supabase.storage
    .from('log-photos')
    .getPublicUrl(data.path)

  return urlData.publicUrl
}

/**
 * Upload multiple media items sequentially to avoid overwhelming the server
 * @param userId - User ID for folder organization
 * @param logId - Log ID for subfolder
 * @param items - Array of media items to upload
 * @returns Array of public URLs
 */
export async function uploadLogMediaItems(
  userId: string,
  logId: string,
  items: MediaItem[]
): Promise<string[]> {
  // Upload sequentially to avoid rate limiting and ensure reliability
  const urls: string[] = []
  for (let i = 0; i < items.length; i++) {
    const url = await uploadLogMedia(userId, logId, items[i], i)
    urls.push(url)
  }
  return urls
}
