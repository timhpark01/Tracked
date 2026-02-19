import { Platform } from 'react-native'
import * as Device from 'expo-device'
import * as Notifications from 'expo-notifications'
import Constants from 'expo-constants'
import { supabase } from '@/lib/supabase'

export async function registerForPushNotifications(): Promise<string | null> {
  // Only works on physical devices
  if (!Device.isDevice) {
    console.log('Push notifications only work on physical devices')
    return null
  }

  // Check/request permissions
  const { status: existingStatus } = await Notifications.getPermissionsAsync()
  let finalStatus = existingStatus

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync()
    finalStatus = status
  }

  if (finalStatus !== 'granted') {
    console.log('Push notification permission denied')
    return null
  }

  // Get Expo push token
  const projectId = Constants.expoConfig?.extra?.eas?.projectId
  const token = await Notifications.getExpoPushTokenAsync({
    projectId,
  })

  // Configure notification channel for Android
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#007AFF',
    })
  }

  return token.data
}

export async function savePushToken(userId: string, token: string): Promise<void> {
  const { error } = await supabase
    .from('push_tokens')
    .upsert(
      {
        user_id: userId,
        token,
        platform: Platform.OS as 'ios' | 'android',
      },
      {
        onConflict: 'user_id,token',
      }
    )

  if (error) throw error
}

export async function removePushToken(token: string): Promise<void> {
  const { error } = await supabase
    .from('push_tokens')
    .delete()
    .eq('token', token)

  if (error) console.warn('Failed to remove push token:', error)
}
