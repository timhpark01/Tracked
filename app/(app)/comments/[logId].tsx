// app/(app)/comments/[logId].tsx
import { useState, useRef } from 'react'
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  Pressable,
  Image,
  ActivityIndicator,
  Platform,
  Alert,
  Keyboard,
  KeyboardAvoidingView,
} from 'react-native'
import { router, useLocalSearchParams, Stack } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons'
import { useComments, useCreateComment, useDeleteComment, Comment } from '@/features/comments'
import { useLog, FeedLog } from '@/features/feed'
import { useReactions, useToggleReaction } from '@/features/reactions'
import { useAuth } from '@/features/auth'

function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffSeconds = Math.floor(diffMs / 1000)
  const diffMinutes = Math.floor(diffSeconds / 60)
  const diffHours = Math.floor(diffMinutes / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffSeconds < 60) return 'just now'
  if (diffMinutes < 60) return `${diffMinutes}m`
  if (diffHours < 24) return `${diffHours}h`
  if (diffDays < 7) return `${diffDays}d`

  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  })
}

function formatValue(value: number): string {
  if (value >= 60) {
    const hours = Math.floor(value / 60)
    const mins = value % 60
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`
  }
  return `${value} min`
}

interface OriginalPostProps {
  log: FeedLog
  commentCount: number
}

function OriginalPost({ log, commentCount }: OriginalPostProps) {
  const { user, activity } = log
  const avatarUri = user.avatar_url || undefined
  const displayValue = formatValue(log.value)

  const { data: reactionInfo } = useReactions(log.id)
  const toggleReaction = useToggleReaction()

  const handleGudoPress = () => {
    toggleReaction.mutate(log.id)
  }

  return (
    <View style={styles.originalPost}>
      {/* User Row */}
      <View style={styles.postUserRow}>
        {avatarUri ? (
          <Image source={{ uri: avatarUri }} style={styles.postAvatar} />
        ) : (
          <View style={styles.postAvatarFallback}>
            <Text style={styles.postAvatarText}>
              {user.username?.charAt(0).toUpperCase() || '?'}
            </Text>
          </View>
        )}
        <View style={styles.postUserInfo}>
          <Text style={styles.postUsername}>{user.username}</Text>
          <Text style={styles.postTimestamp}>{formatRelativeTime(log.logged_at)}</Text>
        </View>
      </View>

      {/* Activity & Value */}
      <View style={styles.postContentRow}>
        <Text style={styles.postActivityName}>{activity.name}</Text>
        <Text style={styles.postValue}>{displayValue}</Text>
      </View>

      {/* Note */}
      {log.note && <Text style={styles.postNote}>{log.note}</Text>}

      {/* Image */}
      {log.image_urls && log.image_urls.length > 0 && (
        <View style={styles.postImageContainer}>
          <Image source={{ uri: log.image_urls[0] }} style={styles.postImage} />
        </View>
      )}

      {/* Action Bar */}
      <View style={styles.postActionBar}>
        <Pressable
          style={styles.postActionButton}
          onPress={handleGudoPress}
          disabled={toggleReaction.isPending}
        >
          <MaterialCommunityIcons
            name="hand-clap"
            size={22}
            color={reactionInfo?.hasReacted ? '#007AFF' : '#6b7280'}
          />
          <Text style={[styles.postActionCount, reactionInfo?.hasReacted && styles.postActionCountActive]}>
            {reactionInfo?.count ?? 0}
          </Text>
        </Pressable>

        <View style={styles.postActionButton}>
          <Ionicons name="chatbubble-outline" size={20} color="#6b7280" />
          <Text style={styles.postActionCount}>{commentCount}</Text>
        </View>
      </View>

      {/* Comments Header */}
      <View style={styles.commentsHeader}>
        <Text style={styles.commentsHeaderText}>Comments</Text>
      </View>
    </View>
  )
}

interface CommentItemProps {
  comment: Comment
  activityLogId: string
  currentUserId?: string
  onReply: (parentId: string, username: string) => void
  depth?: number
}

function CommentItem({ comment, activityLogId, currentUserId, onReply, depth = 0 }: CommentItemProps) {
  const deleteComment = useDeleteComment()
  const isOwner = currentUserId === comment.user_id

  const handleDelete = () => {
    Alert.alert(
      'Delete Comment',
      'Are you sure you want to delete this comment?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteComment.mutate({ commentId: comment.id, activityLogId }),
        },
      ]
    )
  }

  return (
    <View style={[styles.commentItem, { marginLeft: depth * 24 }]}>
      <View style={styles.commentHeader}>
        {comment.user.avatar_url ? (
          <Image source={{ uri: comment.user.avatar_url }} style={styles.commentAvatar} />
        ) : (
          <View style={styles.commentAvatarFallback}>
            <Text style={styles.commentAvatarText}>
              {comment.user.username?.charAt(0).toUpperCase() || '?'}
            </Text>
          </View>
        )}
        <View style={styles.commentMeta}>
          <Text style={styles.commentUsername}>{comment.user.username}</Text>
          <Text style={styles.commentTime}>{formatRelativeTime(comment.created_at)}</Text>
        </View>
      </View>

      <Text style={styles.commentContent}>{comment.content}</Text>

      <View style={styles.commentActions}>
        <Pressable
          style={styles.commentActionButton}
          onPress={() => onReply(comment.id, comment.user.username)}
        >
          <Text style={styles.commentActionText}>Reply</Text>
        </Pressable>
        {isOwner && (
          <Pressable
            style={styles.commentActionButton}
            onPress={handleDelete}
            disabled={deleteComment.isPending}
          >
            <Text style={[styles.commentActionText, styles.deleteText]}>Delete</Text>
          </Pressable>
        )}
      </View>

      {/* Nested replies */}
      {comment.replies && comment.replies.length > 0 && (
        <View style={styles.replies}>
          {comment.replies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              activityLogId={activityLogId}
              currentUserId={currentUserId}
              onReply={onReply}
              depth={depth + 1}
            />
          ))}
        </View>
      )}
    </View>
  )
}

// Standard iOS nav bar height (44) + QuickType suggestions bar (~44)
const NAV_BAR_HEIGHT = 44
const QUICKTYPE_BAR_HEIGHT = 44

export default function CommentsScreen() {
  const { logId } = useLocalSearchParams<{ logId: string }>()
  const insets = useSafeAreaInsets()
  const { user } = useAuth()

  // Calculate keyboard offset: status bar + nav bar + QuickType suggestions bar
  const keyboardOffset = Platform.OS === 'ios'
    ? insets.top + NAV_BAR_HEIGHT + QUICKTYPE_BAR_HEIGHT
    : 0
  const flatListRef = useRef<FlatList>(null)
  const inputRef = useRef<TextInput>(null)

  const { data: log, isLoading: logLoading } = useLog(logId ?? '')
  const { data: comments, isLoading: commentsLoading, error } = useComments(logId ?? '')
  const createComment = useCreateComment()

  const isLoading = logLoading || commentsLoading

  const [inputText, setInputText] = useState('')
  const [replyTo, setReplyTo] = useState<{ parentId: string; username: string } | null>(null)

  const handleReply = (parentId: string, username: string) => {
    setReplyTo({ parentId, username })
    // Focus input after a brief delay to allow state update
    setTimeout(() => {
      inputRef.current?.focus()
    }, 100)
  }

  const cancelReply = () => {
    setReplyTo(null)
  }

  const handleSubmit = async () => {
    if (!inputText.trim() || !logId) return

    try {
      await createComment.mutateAsync({
        activityLogId: logId,
        content: inputText.trim(),
        parentId: replyTo?.parentId ?? null,
      })
      setInputText('')
      setReplyTo(null)
      Keyboard.dismiss()
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to post comment')
    }
  }

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    )
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Failed to load comments</Text>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </Pressable>
      </View>
    )
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={keyboardOffset}
    >
      <FlatList
        ref={flatListRef}
        data={comments}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <CommentItem
            comment={item}
            activityLogId={logId ?? ''}
            currentUserId={user?.id}
            onReply={handleReply}
          />
        )}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          log ? <OriginalPost log={log} commentCount={comments?.length ?? 0} /> : null
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No comments yet</Text>
            <Text style={styles.emptySubtext}>Be the first to comment!</Text>
          </View>
        }
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
      />

      <View style={[styles.inputContainer, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        {replyTo && (
          <View style={styles.replyIndicator}>
            <Text style={styles.replyText}>Replying to @{replyTo.username}</Text>
            <Pressable onPress={cancelReply}>
              <Text style={styles.cancelReply}>Cancel</Text>
            </Pressable>
          </View>
        )}
        <View style={styles.inputRow}>
          <TextInput
            ref={inputRef}
            style={styles.input}
            placeholder={replyTo ? 'Write a reply...' : 'Add a comment...'}
            placeholderTextColor="#9ca3af"
            value={inputText}
            onChangeText={setInputText}
            multiline
            maxLength={500}
          />
          <Pressable
            style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]}
            onPress={handleSubmit}
            disabled={!inputText.trim() || createComment.isPending}
          >
            {createComment.isPending ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.sendButtonText}>Post</Text>
            )}
          </Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorText: {
    fontSize: 16,
    color: '#ef4444',
    marginBottom: 16,
  },
  backButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
  },
  backButtonText: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  listContent: {
    padding: 16,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9ca3af',
  },
  commentItem: {
    marginBottom: 16,
  },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  commentAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f3f4f6',
  },
  commentAvatarFallback: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#e5e7eb',
    justifyContent: 'center',
    alignItems: 'center',
  },
  commentAvatarText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
  },
  commentMeta: {
    marginLeft: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  commentUsername: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  commentTime: {
    fontSize: 12,
    color: '#9ca3af',
  },
  commentContent: {
    fontSize: 15,
    color: '#374151',
    lineHeight: 22,
    marginLeft: 42,
  },
  commentActions: {
    flexDirection: 'row',
    marginLeft: 42,
    marginTop: 6,
    gap: 16,
  },
  commentActionButton: {
    paddingVertical: 4,
  },
  commentActionText: {
    fontSize: 13,
    color: '#6b7280',
    fontWeight: '500',
  },
  deleteText: {
    color: '#ef4444',
  },
  replies: {
    marginTop: 12,
    borderLeftWidth: 2,
    borderLeftColor: '#e5e7eb',
    paddingLeft: 12,
  },
  inputContainer: {
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  replyIndicator: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  replyText: {
    fontSize: 13,
    color: '#6b7280',
  },
  cancelReply: {
    fontSize: 13,
    color: '#007AFF',
    fontWeight: '500',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 12,
  },
  input: {
    flex: 1,
    backgroundColor: '#f3f4f6',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    maxHeight: 100,
    color: '#111827',
  },
  sendButton: {
    backgroundColor: '#007AFF',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 60,
  },
  sendButtonDisabled: {
    backgroundColor: '#93c5fd',
  },
  sendButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  // Original Post styles
  originalPost: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    marginBottom: 16,
  },
  postUserRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  postAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#f3f4f6',
  },
  postAvatarFallback: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#e5e7eb',
    justifyContent: 'center',
    alignItems: 'center',
  },
  postAvatarText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6b7280',
  },
  postUserInfo: {
    marginLeft: 12,
    flex: 1,
  },
  postUsername: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  postTimestamp: {
    fontSize: 13,
    color: '#9ca3af',
    marginTop: 2,
  },
  postContentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  postActivityName: {
    fontSize: 17,
    fontWeight: '500',
    color: '#374151',
  },
  postValue: {
    fontSize: 17,
    fontWeight: '700',
    color: '#007AFF',
  },
  postNote: {
    fontSize: 15,
    color: '#4b5563',
    lineHeight: 22,
    marginBottom: 12,
  },
  postImageContainer: {
    marginBottom: 12,
  },
  postImage: {
    width: '100%',
    height: 240,
    borderRadius: 12,
    backgroundColor: '#f3f4f6',
  },
  postActionBar: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    gap: 24,
  },
  postActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  postActionCount: {
    fontSize: 15,
    color: '#6b7280',
    fontWeight: '500',
  },
  postActionCountActive: {
    color: '#007AFF',
  },
  commentsHeader: {
    paddingTop: 16,
    paddingBottom: 8,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  commentsHeaderText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
})
