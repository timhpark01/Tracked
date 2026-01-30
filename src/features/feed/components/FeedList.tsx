// src/features/feed/components/FeedList.tsx
import { useRef, useCallback } from 'react'
import {
  FlatList,
  View,
  ActivityIndicator,
  RefreshControl,
  StyleSheet,
} from 'react-native'
import { useFeed } from '../hooks/useFeed'
import { FeedItem } from './FeedItem'
import { FeedEmpty } from './FeedEmpty'
import type { FeedLog, FeedType } from '../services/feed.service'

interface FeedListProps {
  feedType?: FeedType
}

export function FeedList({ feedType = 'following' }: FeedListProps) {
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    refetch,
    isRefetching,
  } = useFeed(feedType)

  // Prevents duplicate fetchNextPage calls during scroll momentum
  const onEndReachedCalledDuringMomentum = useRef(false)

  // Flatten all pages into single array
  const feedItems = data?.pages.flatMap((page) => page) ?? []

  // Memoized renderItem to prevent unnecessary re-renders
  const renderItem = useCallback(
    ({ item }: { item: FeedLog }) => <FeedItem log={item} />,
    []
  )

  // Memoized keyExtractor for performance
  const keyExtractor = useCallback((item: FeedLog) => item.id, [])

  // Handle reaching end of list for pagination
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

  // Reset momentum flag when scroll starts
  const handleMomentumScrollBegin = useCallback(() => {
    onEndReachedCalledDuringMomentum.current = false
  }, [])

  // Footer loading indicator
  const ListFooterComponent = useCallback(
    () =>
      isFetchingNextPage ? (
        <View style={styles.footer}>
          <ActivityIndicator size="small" color="#007AFF" />
        </View>
      ) : null,
    [isFetchingNextPage]
  )

  // Show loading state on initial load
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
      ListEmptyComponent={FeedEmpty}
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
      // Performance optimizations
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
    backgroundColor: '#f9fafb',
  },
  contentContainer: {
    paddingVertical: 12,
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
})
