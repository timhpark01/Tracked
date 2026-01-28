import { useState, useEffect, useRef } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native'
import { router } from 'expo-router'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  useAuth,
  completePhoneSignup,
  checkUsernameAvailable,
  usernameSchema,
  type UsernameFormData,
} from '@/features/auth'

export default function UsernameScreen() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [checkingUsername, setCheckingUsername] = useState(false)
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(
    null
  )
  const debounceRef = useRef<NodeJS.Timeout | null>(null)

  const {
    control,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<UsernameFormData>({
    resolver: zodResolver(usernameSchema),
    defaultValues: {
      username: '',
    },
  })

  const username = watch('username')

  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }

    if (username.length < 3) {
      setUsernameAvailable(null)
      return
    }

    setCheckingUsername(true)
    debounceRef.current = setTimeout(async () => {
      try {
        const available = await checkUsernameAvailable(username)
        setUsernameAvailable(available)
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
  }, [username])

  const onSubmit = async (data: UsernameFormData) => {
    if (!user) {
      Alert.alert('Error', 'User not found. Please try again.')
      return
    }

    if (usernameAvailable === false) {
      Alert.alert('Error', 'This username is already taken')
      return
    }

    setLoading(true)
    try {
      await completePhoneSignup(user.id, data.username)
      router.replace('/(app)')
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to complete setup')
    } finally {
      setLoading(false)
    }
  }

  const getInputStyle = () => {
    if (errors.username) return [styles.input, styles.inputError]
    if (usernameAvailable === true) return [styles.input, styles.inputSuccess]
    if (usernameAvailable === false) return [styles.input, styles.inputError]
    return styles.input
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Choose a Username</Text>
      <Text style={styles.subtitle}>
        This is how others will find and identify you
      </Text>

      <Controller
        control={control}
        name="username"
        render={({ field: { onChange, onBlur, value } }) => (
          <View>
            <TextInput
              style={getInputStyle()}
              placeholder="username"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              autoCapitalize="none"
              autoCorrect={false}
              editable={!loading}
            />
            {checkingUsername && (
              <ActivityIndicator
                size="small"
                color="#007AFF"
                style={styles.checkingIndicator}
              />
            )}
          </View>
        )}
      />

      {errors.username && (
        <Text style={styles.errorText}>{errors.username.message}</Text>
      )}
      {!errors.username && usernameAvailable === false && (
        <Text style={styles.errorText}>This username is already taken</Text>
      )}
      {!errors.username && usernameAvailable === true && (
        <Text style={styles.successText}>Username is available</Text>
      )}

      <TouchableOpacity
        style={[
          styles.button,
          (loading || usernameAvailable === false) && styles.buttonDisabled,
        ]}
        onPress={handleSubmit(onSubmit)}
        disabled={loading || usernameAvailable === false}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Complete Setup</Text>
        )}
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 32,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 16,
    marginBottom: 8,
    fontSize: 16,
  },
  inputError: {
    borderColor: '#dc2626',
  },
  inputSuccess: {
    borderColor: '#16a34a',
  },
  errorText: {
    color: '#dc2626',
    fontSize: 14,
    marginBottom: 16,
  },
  successText: {
    color: '#16a34a',
    fontSize: 14,
    marginBottom: 16,
  },
  checkingIndicator: {
    position: 'absolute',
    right: 16,
    top: 18,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
})
