import { supabase } from '@/lib/supabase'

export type NotificationType = 'like' | 'comment' | 'follow' | 'mention'

export type Notification = {
  id: string
  recipient_id: string
  actor_id: string
  type: NotificationType
  activity_log_id: string | null
  comment_id: string | null
  title: string
  body: string
  read: boolean
  created_at: string
  actor: {
    id: string
    username: string
    avatar_url: string | null
  }
}

const NOTIFICATION_SELECT = `
  id,
  recipient_id,
  actor_id,
  type,
  activity_log_id,
  comment_id,
  title,
  body,
  read,
  created_at,
  actor:profiles!notifications_actor_id_fkey (
    id,
    username,
    avatar_url
  )
`

export async function getNotifications(
  userId: string,
  start: number = 0,
  end: number = 19
): Promise<Notification[]> {
  const { data, error } = await supabase
    .from('notifications')
    .select(NOTIFICATION_SELECT)
    .eq('recipient_id', userId)
    .order('created_at', { ascending: false })
    .range(start, end)

  if (error) throw error

  return (data ?? []) as unknown as Notification[]
}

export async function getUnreadCount(userId: string): Promise<number> {
  const { count, error } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('recipient_id', userId)
    .eq('read', false)

  if (error) throw error

  return count ?? 0
}

export async function markAsRead(notificationId: string): Promise<void> {
  const { error } = await supabase
    .from('notifications')
    .update({ read: true })
    .eq('id', notificationId)

  if (error) throw error
}

export async function markAllAsRead(userId: string): Promise<void> {
  const { error } = await supabase
    .from('notifications')
    .update({ read: true })
    .eq('recipient_id', userId)
    .eq('read', false)

  if (error) throw error
}
