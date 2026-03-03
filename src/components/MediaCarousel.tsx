// src/components/MediaCarousel.tsx
import { useState, useRef, useCallback } from 'react'
import {
  View,
  Image,
  StyleSheet,
  Dimensions,
  FlatList,
  TouchableOpacity,
  type ViewToken,
} from 'react-native'
import { Video, ResizeMode, type AVPlaybackStatus } from 'expo-av'
import { Ionicons } from '@expo/vector-icons'

const { width: SCREEN_WIDTH } = Dimensions.get('window')

interface MediaCarouselProps {
  urls: string[]
  width?: number
  height?: number
}

function isVideoUrl(url: string): boolean {
  const extension = url.split('.').pop()?.toLowerCase()
  return extension === 'mp4' || extension === 'mov' || extension === 'webm'
}

interface MediaItemRendererProps {
  url: string
  width: number
  height: number
  isVisible: boolean
}

function MediaItemRenderer({ url, width, height, isVisible }: MediaItemRendererProps) {
  const videoRef = useRef<Video>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const isVideo = isVideoUrl(url)

  const handlePlaybackStatusUpdate = (status: AVPlaybackStatus) => {
    if (status.isLoaded) {
      setIsPlaying(status.isPlaying)
    }
  }

  const togglePlayback = async () => {
    if (!videoRef.current) return

    if (isPlaying) {
      await videoRef.current.pauseAsync()
    } else {
      await videoRef.current.playAsync()
    }
  }

  // Pause video when not visible
  if (!isVisible && isPlaying && videoRef.current) {
    videoRef.current.pauseAsync()
  }

  if (isVideo) {
    return (
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={togglePlayback}
        style={[styles.mediaItem, { width, height }]}
      >
        <Video
          ref={videoRef}
          source={{ uri: url }}
          style={[styles.media, { width, height }]}
          resizeMode={ResizeMode.COVER}
          shouldPlay={false}
          isLooping
          isMuted={false}
          onPlaybackStatusUpdate={handlePlaybackStatusUpdate}
        />
        {!isPlaying && (
          <View style={styles.playOverlay}>
            <View style={styles.playButton}>
              <Ionicons name="play" size={32} color="#fff" />
            </View>
          </View>
        )}
      </TouchableOpacity>
    )
  }

  return (
    <View style={[styles.mediaItem, { width, height }]}>
      <Image
        source={{ uri: url }}
        style={[styles.media, { width, height }]}
        resizeMode="cover"
      />
    </View>
  )
}

export function MediaCarousel({
  urls,
  width = SCREEN_WIDTH,
  height = 300,
}: MediaCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0)

  const onViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0 && viewableItems[0].index !== null) {
        setActiveIndex(viewableItems[0].index)
      }
    },
    []
  )

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50,
  }).current

  if (!urls || urls.length === 0) {
    return null
  }

  if (urls.length === 1) {
    return (
      <View style={styles.container}>
        <MediaItemRenderer
          url={urls[0]}
          width={width}
          height={height}
          isVisible={true}
        />
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={urls}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item, index) => `${item}-${index}`}
        renderItem={({ item, index }) => (
          <MediaItemRenderer
            url={item}
            width={width}
            height={height}
            isVisible={index === activeIndex}
          />
        )}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        snapToInterval={width}
        decelerationRate="fast"
        getItemLayout={(_, index) => ({
          length: width,
          offset: width * index,
          index,
        })}
      />

      {/* Pagination dots */}
      <View style={styles.pagination}>
        {urls.map((_, index) => (
          <View
            key={index}
            style={[
              styles.dot,
              index === activeIndex ? styles.dotActive : styles.dotInactive,
            ]}
          />
        ))}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    marginTop: 12,
  },
  mediaItem: {
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: '#f3f4f6',
  },
  media: {},
  playOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  playButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingLeft: 4,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  dotActive: {
    backgroundColor: '#007AFF',
  },
  dotInactive: {
    backgroundColor: '#d1d5db',
  },
})
