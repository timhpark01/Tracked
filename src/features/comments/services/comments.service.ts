// src/features/comments/services/comments.service.ts
import { supabase } from '@/lib/supabase'

export type Comment = {
  id: string
  activity_log_id: string
  user_id: string
  parent_id: string | null
  content: string
  created_at: string
  user: {
    id: string
    username: string
    avatar_url: string | null
  }
  replies?: Comment[]
}

const COMMENT_SELECT = `
  id,
  activity_log_id,
  user_id,
  parent_id,
  content,
  created_at,
  user:profiles!inner (
    id,
    username,
    avatar_url
  )
`

/**
 * Get all comments for an activity log (flat list, client organizes into threads)
 */
export async function getComments(activityLogId: string): Promise<Comment[]> {
  const { data, error } = await supabase
    .from('comments')
    .select(COMMENT_SELECT)
    .eq('activity_log_id', activityLogId)
    .order('created_at', { ascending: true })

  if (error) throw error

  return (data ?? []) as unknown as Comment[]
}

/**
 * Organize flat comments into threaded structure
 */
export function organizeCommentsIntoThreads(comments: Comment[]): Comment[] {
  const commentMap = new Map<string, Comment>()
  const topLevel: Comment[] = []

  // First pass: create map with replies array
  comments.forEach(comment => {
    commentMap.set(comment.id, { ...comment, replies: [] })
  })

  // Second pass: organize into threads
  comments.forEach(comment => {
    const commentWithReplies = commentMap.get(comment.id)!
    if (comment.parent_id) {
      const parent = commentMap.get(comment.parent_id)
      if (parent) {
        parent.replies!.push(commentWithReplies)
      } else {
        // Parent was deleted, treat as top-level
        topLevel.push(commentWithReplies)
      }
    } else {
      topLevel.push(commentWithReplies)
    }
  })

  return topLevel
}

/**
 * Get comment count for an activity log
 */
export async function getCommentCount(activityLogId: string): Promise<number> {
  const { count, error } = await supabase
    .from('comments')
    .select('*', { count: 'exact', head: true })
    .eq('activity_log_id', activityLogId)

  if (error) throw error

  return count ?? 0
}

/**
 * Get comment counts for multiple logs (batch)
 */
export async function getCommentCountBatch(activityLogIds: string[]): Promise<Record<string, number>> {
  const { data, error } = await supabase
    .from('comments')
    .select('activity_log_id')
    .in('activity_log_id', activityLogIds)

  if (error) throw error

  const counts: Record<string, number> = {}
  activityLogIds.forEach(id => {
    counts[id] = data?.filter(c => c.activity_log_id === id).length ?? 0
  })

  return counts
}

/**
 * Create a new comment
 */
export async function createComment(input: {
  activityLogId: string
  content: string
  parentId?: string | null
}): Promise<Comment> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Must be logged in to comment')

  const { data, error } = await supabase
    .from('comments')
    .insert({
      activity_log_id: input.activityLogId,
      user_id: user.id,
      parent_id: input.parentId ?? null,
      content: input.content,
    })
    .select(COMMENT_SELECT)
    .single()

  if (error) throw error

  return data as unknown as Comment
}

/**
 * Delete a comment
 */
export async function deleteComment(commentId: string): Promise<void> {
  const { error } = await supabase
    .from('comments')
    .delete()
    .eq('id', commentId)

  if (error) throw error
}
