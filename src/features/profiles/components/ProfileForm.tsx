// src/features/profiles/components/ProfileForm.tsx
import { View, Text, Pressable, StyleSheet, ActivityIndicator } from 'react-native'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ControlledInput, ControlledTextArea } from '@/components/forms'

const profileSchema = z.object({
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(30, 'Username must be at most 30 characters')
    .regex(
      /^[a-zA-Z0-9_]+$/,
      'Username can only contain letters, numbers, and underscores'
    ),
  bio: z
    .string()
    .max(500, 'Bio must be at most 500 characters')
    .optional()
    .or(z.literal('')),
})

export type ProfileFormData = z.infer<typeof profileSchema>

interface ProfileFormProps {
  initialData?: {
    username?: string
    bio?: string | null
  }
  onSubmit: (data: ProfileFormData) => void
  isLoading?: boolean
  submitLabel?: string
}

/**
 * Profile form with username and bio fields
 * Uses Zod validation for username (3-30 chars, alphanumeric + underscore)
 * and bio (optional, max 500 chars)
 */
export function ProfileForm({
  initialData,
  onSubmit,
  isLoading = false,
  submitLabel = 'Save',
}: ProfileFormProps) {
  const { control, handleSubmit } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      username: initialData?.username ?? '',
      bio: initialData?.bio ?? '',
    },
  })

  return (
    <View style={styles.form}>
      <ControlledInput
        control={control}
        name="username"
        label="Username"
        placeholder="Enter your username"
        style={styles.field}
      />

      <ControlledTextArea
        control={control}
        name="bio"
        label="Bio"
        placeholder="Tell us about yourself..."
        style={styles.field}
      />

      <Pressable
        style={[styles.button, isLoading && styles.buttonDisabled]}
        onPress={handleSubmit(onSubmit)}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>{submitLabel}</Text>
        )}
      </Pressable>
    </View>
  )
}

const styles = StyleSheet.create({
  form: {
    width: '100%',
  },
  field: {
    marginBottom: 16,
  },
  button: {
    backgroundColor: '#3b82f6', // blue-500
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
})
