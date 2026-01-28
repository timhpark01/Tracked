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
import { Link, router } from 'expo-router'
import { signUp, checkUsernameAvailable } from '@/features/auth'
import { updateProfile } from '@/features/profiles'

export default function SignupScreen() {
  const [email, setEmail] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [checkingUsername, setCheckingUsername] = useState(false)
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(
    null
  )
  const debounceRef = useRef<NodeJS.Timeout | null>(null)

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

  const handleSignup = async () => {
    if (!email || !username || !password || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all fields')
      return
    }

    if (username.length < 3) {
      Alert.alert('Error', 'Username must be at least 3 characters')
      return
    }

    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      Alert.alert(
        'Error',
        'Username can only contain letters, numbers, and underscores'
      )
      return
    }

    if (usernameAvailable === false) {
      Alert.alert('Error', 'This username is already taken')
      return
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match')
      return
    }

    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters')
      return
    }

    setLoading(true)
    try {
      const result = await signUp(email, password)
      if (result.requiresConfirmation) {
        Alert.alert(
          'Check Your Email',
          'We sent you a confirmation link. Please check your email.',
          [{ text: 'OK', onPress: () => router.replace('/(auth)/login') }]
        )
      } else if (result.user) {
        // Update the auto-created profile with the chosen username
        await updateProfile(result.user.id, { username })
        router.replace('/(app)')
      }
    } catch (error: any) {
      Alert.alert('Signup Failed', error.message)
    } finally {
      setLoading(false)
    }
  }

  const getUsernameInputStyle = () => {
    if (username.length >= 3 && usernameAvailable === true)
      return [styles.input, styles.inputSuccess]
    if (username.length >= 3 && usernameAvailable === false)
      return [styles.input, styles.inputError]
    return styles.input
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Create Account</Text>
      <Text style={styles.subtitle}>Start tracking your progress</Text>

      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        editable={!loading}
      />

      <View>
        <TextInput
          style={getUsernameInputStyle()}
          placeholder="Username"
          value={username}
          onChangeText={setUsername}
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
      {username.length >= 3 && usernameAvailable === false && (
        <Text style={styles.errorText}>This username is already taken</Text>
      )}
      {username.length >= 3 && usernameAvailable === true && (
        <Text style={styles.successText}>Username is available</Text>
      )}

      <TextInput
        style={styles.input}
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        editable={!loading}
      />

      <TextInput
        style={styles.input}
        placeholder="Confirm Password"
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        secureTextEntry
        editable={!loading}
      />

      <TouchableOpacity
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={handleSignup}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Create Account</Text>
        )}
      </TouchableOpacity>

      <Link href="/(auth)/login" asChild>
        <TouchableOpacity style={styles.linkButton}>
          <Text style={styles.linkText}>Already have an account? Sign in</Text>
        </TouchableOpacity>
      </Link>
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
    marginBottom: 16,
    fontSize: 16,
  },
  inputError: {
    borderColor: '#dc2626',
    marginBottom: 4,
  },
  inputSuccess: {
    borderColor: '#16a34a',
    marginBottom: 4,
  },
  errorText: {
    color: '#dc2626',
    fontSize: 14,
    marginBottom: 12,
  },
  successText: {
    color: '#16a34a',
    fontSize: 14,
    marginBottom: 12,
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
  linkButton: {
    marginTop: 24,
    alignItems: 'center',
  },
  linkText: {
    color: '#007AFF',
    fontSize: 14,
  },
})
