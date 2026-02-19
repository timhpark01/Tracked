import { useMutation, useQueryClient } from '@tanstack/react-query'
import { markAsRead, markAllAsRead } from '../services/notifications.service'
import { useAuth } from '@/features/auth'

export function useMarkAsRead() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: markAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', user?.id] })
      queryClient.invalidateQueries({ queryKey: ['notifications-unread-count', user?.id] })
    },
  })
}

export function useMarkAllAsRead() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => markAllAsRead(user!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', user?.id] })
      queryClient.invalidateQueries({ queryKey: ['notifications-unread-count', user?.id] })
    },
  })
}
