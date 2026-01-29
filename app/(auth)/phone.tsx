import { useState } from 'react'
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
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { sendPhoneOtp, phoneSchema, type PhoneFormData } from '@/features/auth'

export default function PhoneScreen() {
  const [loading, setLoading] = useState(false)

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<PhoneFormData>({
    resolver: zodResolver(phoneSchema),
    defaultValues: {
      phone: '',
    },
  })

  const onSubmit = async (data: PhoneFormData) => {
    setLoading(true)
    try {
      await sendPhoneOtp(data.phone)
      router.push({
        pathname: '/(auth)/verify-otp',
        params: { phone: data.phone },
      })
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to send verification code')
    } finally {
      setLoading(false)
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Enter Your Phone</Text>
      <Text style={styles.subtitle}>
        We'll send you a verification code via SMS to sign in or create your
        account
      </Text>

      <Controller
        control={control}
        name="phone"
        render={({ field: { onChange, onBlur, value } }) => (
          <TextInput
            style={[styles.input, errors.phone && styles.inputError]}
            placeholder="+1234567890"
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            autoCapitalize="none"
            keyboardType="phone-pad"
            editable={!loading}
          />
        )}
      />
      {errors.phone && (
        <Text style={styles.errorText}>{errors.phone.message}</Text>
      )}

      <TouchableOpacity
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={handleSubmit(onSubmit)}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Send Code</Text>
        )}
      </TouchableOpacity>

      <Link href="/(auth)/email-login" asChild>
        <TouchableOpacity style={styles.linkButton}>
          <Text style={styles.linkText}>Use email instead</Text>
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
    marginBottom: 8,
    fontSize: 16,
  },
  inputError: {
    borderColor: '#dc2626',
  },
  errorText: {
    color: '#dc2626',
    fontSize: 14,
    marginBottom: 16,
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
