// src/features/profiles/components/FeedTab.tsx
import { useRef, useCallback, useMemo } from 'react'
import {
  FlatList,
  View,
  Text,
  ActivityIndicator,
  RefreshControl,
  StyleSheet,
} from 'react-native'
import { useFeed, type FeedLog } from '@/features/feed'
import { useReactionsBatch } from '@/features/reactions'
import { useCommentCountBatch } from '@/features/comments'
import { ProfileFeedItem } from './ProfileFeedItem'

interface FeedTabProps {
  userId?: string
}

export function FeedTab({ userId }: FeedTabProps) {
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    refetch,
    isRefetching,
  } = useFeed('personal', userId)

  const onEndReachedCalledDuringMomentum = useRef(false)

  const feedItems = useMemo(
    () => data?.pages.flatMap((page) => page) ?? [],
    [data?.pages]
  )

  const logIds = useMemo(
    () => feedItems.map((item) => item.id),
    [feedItems]
  )

  const { data: reactionsMap } = useReactionsBatch(logIds)
  const { data: commentCountsMap } = useCommentCountBatch(logIds)

  const renderItem = useCallback(
    ({ item }: { item: FeedLog }) => (
      <ProfileFeedItem
        log={item}
        reactionInfo={reactionsMap?.[item.id]}
        commentCount={commentCountsMap?.[item.id]}
      />
    ),
    [reactionsMap, commentCountsMap]
  )

  const keyExtractor = useCallback((item: FeedLog) => item.id, [])

  const handleEndReached = useCallback(() => {
    if (
      !onEndReachedCalledDuringMomentum.current &&
      hasNextPage &&
      !isFetchingNextPage
    ) {
      onEndReachedCalledDuringMomentum.current = true
      fetchNextPage()
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage])

  const handleMomentumScrollBegin = useCallback(() => {
    onEndReachedCalledDuringMomentum.current = false
  }, [])

  const ListFooterComponent = useCallback(
    () =>
      isFetchingNextPage ? (
        <View style={styles.footer}>
          <ActivityIndicator size="small" color="#007AFF" />
        </View>
      ) : null,
    [isFetchingNextPage]
  )

  const ListEmptyComponent = useCallback(
    () => (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No activity yet</Text>
        <Text style={styles.emptySubtext}>Start logging to see your progress here</Text>
      </View>
    ),
    []
  )

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    )
  }

  return (
    <FlatList
      data={feedItems}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      ListEmptyComponent={ListEmptyComponent}
      ListFooterComponent={ListFooterComponent}
      onEndReached={handleEndReached}
      onMomentumScrollBegin={handleMomentumScrollBegin}
      onEndReachedThreshold={0.5}
      refreshControl={
        <RefreshControl
          refreshing={isRefetching}
          onRefresh={refetch}
          tintColor="#007AFF"
        />
      }
      maxToRenderPerBatch={10}
      windowSize={21}
      removeClippedSubviews={true}
      initialNumToRender={10}
      contentContainerStyle={styles.contentContainer}
      style={styles.list}
    />
  )
}

const styles = StyleSheet.create({
  list: {
    flex: 1,
    backgroundColor: '#fff',
  },
  contentContainer: {
    paddingTop: 16,
    paddingBottom: 16,
    flexGrow: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  footer: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
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
    textAlign: 'center',
  },
})
