import { useEffect, useRef, useState } from 'react'
import * as Notifications from 'expo-notifications'
import { router } from 'expo-router'
import { useAuth } from '@/features/auth'
import {
  registerForPushNotifications,
  savePushToken,
  removePushToken,
} from '../services/pushTokens.service'

// Configure how notifications appear when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
})

export function usePushNotifications() {
  const { user } = useAuth()
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null)
  const notificationListener = useRef<Notifications.EventSubscription | null>(null)
  const responseListener = useRef<Notifications.EventSubscription | null>(null)

  useEffect(() => {
    if (!user) return

    // Register for push notifications
    registerForPushNotifications().then(async (token) => {
      if (token) {
        setExpoPushToken(token)
        await savePushToken(user.id, token)
      }
    })

    // Handle notification received while app is foregrounded
    notificationListener.current = Notifications.addNotificationReceivedListener(
      (notification) => {
        console.log('Notification received:', notification)
      }
    )

    // Handle notification tap (deep link)
    responseListener.current = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        const data = response.notification.request.content.data
        handleNotificationNavigation(data)
      }
    )

    return () => {
      if (notificationListener.current) {
        notificationListener.current.remove()
      }
      if (responseListener.current) {
        responseListener.current.remove()
      }
    }
  }, [user])

  // Cleanup on logout
  useEffect(() => {
    return () => {
      if (expoPushToken) {
        removePushToken(expoPushToken)
      }
    }
  }, [expoPushToken])

  return { expoPushToken }
}

function handleNotificationNavigation(data: Record<string, unknown>) {
  const type = data.type as string
  const activityLogId = data.activity_log_id as string | undefined
  const actorId = data.actor_id as string | undefined

  switch (type) {
    case 'like':
    case 'comment':
    case 'mention':
      if (activityLogId) {
        router.push(`/comments/${activityLogId}`)
      }
      break
    case 'follow':
      if (actorId) {
        router.push(`/user/${actorId}`)
      }
      break
    default:
      router.push('/inbox')
  }
}
