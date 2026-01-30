// src/features/profiles/components/ProfileForm.tsx
import { useState, useEffect, useRef } from 'react'
import { View, Text, Pressable, StyleSheet, ActivityIndicator } from 'react-native'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ControlledInput, ControlledTextArea } from '@/components/forms'
import { checkUsernameAvailable } from '@/features/auth'

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
  const [checkingUsername, setCheckingUsername] = useState(false)
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null)
  const [usernameError, setUsernameError] = useState<string | null>(null)
  const debounceRef = useRef<NodeJS.Timeout | null>(null)

  const { control, handleSubmit, watch } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      username: initialData?.username ?? '',
      bio: initialData?.bio ?? '',
    },
  })

  const username = watch('username')
  const originalUsername = initialData?.username

  // Check username availability when it changes
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }

    // Reset state
    setUsernameError(null)

    // Don't check if username is too short or same as original
    if (username.length < 3 || username === originalUsername) {
      setUsernameAvailable(null)
      setCheckingUsername(false)
      return
    }

    setCheckingUsername(true)
    debounceRef.current = setTimeout(async () => {
      try {
        const available = await checkUsernameAvailable(username)
        setUsernameAvailable(available)
        if (!available) {
          setUsernameError('This username is already taken')
        }
      } catch {
        setUsernameAvailable(null)
      } finally {
        setCheckingUsername(false)
      }
    }, 500)

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
    }
  }, [username, originalUsername])

  const handleFormSubmit = (data: ProfileFormData) => {
    if (usernameAvailable === false) {
      return // Don't submit if username is taken
    }
    onSubmit(data)
  }

  const isButtonDisabled = isLoading || checkingUsername || usernameAvailable === false

  return (
    <View style={styles.form}>
      <View>
        <ControlledInput
          control={control}
          name="username"
          label="Username"
          placeholder="Enter your username"
          style={styles.field}
        />
        {checkingUsername && (
          <ActivityIndicator
            size="small"
            color="#007AFF"
            style={styles.checkingIndicator}
          />
        )}
      </View>
      {usernameError && (
        <Text style={styles.errorText}>{usernameError}</Text>
      )}
      {username.length >= 3 && username !== originalUsername && usernameAvailable === true && (
        <Text style={styles.successText}>Username is available</Text>
      )}

      <ControlledTextArea
        control={control}
        name="bio"
        label="Bio"
        placeholder="Tell us about yourself..."
        style={styles.field}
      />

      <Pressable
        style={[styles.button, isButtonDisabled && styles.buttonDisabled]}
        onPress={handleSubmit(handleFormSubmit)}
        disabled={isButtonDisabled}
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
  checkingIndicator: {
    position: 'absolute',
    right: 16,
    top: 38,
  },
  errorText: {
    color: '#dc2626',
    fontSize: 14,
    marginTop: -12,
    marginBottom: 16,
  },
  successText: {
    color: '#16a34a',
    fontSize: 14,
    marginTop: -12,
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
