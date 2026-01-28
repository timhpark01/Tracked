// src/features/profiles/components/AvatarPicker.tsx
import { View, Image, Pressable, Text, StyleSheet } from 'react-native'
import { pickAvatarImage } from '@/lib/storage'

interface AvatarPickerProps {
  currentUrl: string | null
  onPick: (uri: string) => void
  size?: number
}

/**
 * Avatar picker component that displays current avatar and allows picking new one
 * Uses square aspect ratio cropping from pickAvatarImage
 */
export function AvatarPicker({ currentUrl, onPick, size = 96 }: AvatarPickerProps) {
  const handlePick = async () => {
    const uri = await pickAvatarImage()
    if (uri) onPick(uri)
  }

  return (
    <Pressable onPress={handlePick} style={styles.container}>
      {currentUrl ? (
        <Image
          source={{ uri: currentUrl }}
          style={[
            styles.avatar,
            { width: size, height: size, borderRadius: size / 2 },
          ]}
        />
      ) : (
        <View
          style={[
            styles.placeholder,
            { width: size, height: size, borderRadius: size / 2 },
          ]}
        >
          <Text style={styles.plusIcon}>+</Text>
        </View>
      )}
      <Text style={styles.changeText}>Change Photo</Text>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  avatar: {
    backgroundColor: '#e5e7eb', // gray-200
  },
  placeholder: {
    backgroundColor: '#e5e7eb', // gray-200
    alignItems: 'center',
    justifyContent: 'center',
  },
  plusIcon: {
    color: '#6b7280', // gray-500
    fontSize: 28,
    fontWeight: '300',
  },
  changeText: {
    color: '#3b82f6', // blue-500
    marginTop: 8,
    fontSize: 14,
  },
})
