// src/components/MediaPicker.tsx
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  ScrollView,
} from 'react-native'
import { Video, ResizeMode } from 'expo-av'
import { Ionicons } from '@expo/vector-icons'
import { pickOrCaptureMedia, type MediaItem } from '@/lib/storage'

const MAX_MEDIA_ITEMS = 5

interface MediaPickerProps {
  items: MediaItem[]
  onItemsChange: (items: MediaItem[]) => void
}

export function MediaPicker({ items, onItemsChange }: MediaPickerProps) {
  const handleAddMedia = async () => {
    const newItems = await pickOrCaptureMedia(items.length)
    if (newItems.length > 0) {
      onItemsChange([...items, ...newItems])
    }
  }

  const handleRemoveItem = (index: number) => {
    const newItems = items.filter((_, i) => i !== index)
    onItemsChange(newItems)
  }

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.label}>Media (optional)</Text>
        <Text style={styles.counter}>{items.length}/{MAX_MEDIA_ITEMS}</Text>
      </View>

      {items.length > 0 ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.mediaList}
        >
          {items.map((item, index) => (
            <View key={`${item.uri}-${index}`} style={styles.mediaItem}>
              {item.type === 'video' ? (
                <View style={styles.thumbnailContainer}>
                  <Video
                    source={{ uri: item.uri }}
                    style={styles.thumbnail}
                    resizeMode={ResizeMode.COVER}
                    shouldPlay={false}
                    isMuted
                  />
                  <View style={styles.videoOverlay}>
                    <Ionicons name="play-circle" size={24} color="#fff" />
                  </View>
                  {item.duration && (
                    <View style={styles.durationBadge}>
                      <Text style={styles.durationText}>
                        {formatDuration(item.duration)}
                      </Text>
                    </View>
                  )}
                </View>
              ) : (
                <Image source={{ uri: item.uri }} style={styles.thumbnail} />
              )}
              <TouchableOpacity
                style={styles.removeButton}
                onPress={() => handleRemoveItem(index)}
              >
                <Ionicons name="close-circle" size={22} color="#ef4444" />
              </TouchableOpacity>
            </View>
          ))}

          {items.length < MAX_MEDIA_ITEMS && (
            <TouchableOpacity style={styles.addButton} onPress={handleAddMedia}>
              <Ionicons name="add" size={28} color="#007AFF" />
            </TouchableOpacity>
          )}
        </ScrollView>
      ) : (
        <TouchableOpacity style={styles.emptyButton} onPress={handleAddMedia}>
          <Ionicons name="camera-outline" size={24} color="#007AFF" />
          <Text style={styles.emptyButtonText}>Add Photos or Videos</Text>
        </TouchableOpacity>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    gap: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  counter: {
    fontSize: 12,
    color: '#6b7280',
  },
  mediaList: {
    gap: 8,
    paddingVertical: 4,
  },
  mediaItem: {
    position: 'relative',
  },
  thumbnailContainer: {
    position: 'relative',
  },
  thumbnail: {
    width: 100,
    height: 100,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
  },
  videoOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: 8,
  },
  durationBadge: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  durationText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
  },
  removeButton: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: '#fff',
    borderRadius: 11,
  },
  addButton: {
    width: 100,
    height: 100,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderStyle: 'dashed',
    borderRadius: 8,
  },
  emptyButtonText: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '500',
  },
})
