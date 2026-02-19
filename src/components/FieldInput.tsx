// src/components/FieldInput.tsx
import { View, Text, TextInput, StyleSheet, type StyleProp, type ViewStyle } from 'react-native'
import type { ActivityField } from '@/types/fields'

interface FieldInputProps {
  field: ActivityField
  value: string
  onChange: (value: string) => void
  style?: StyleProp<ViewStyle>
}

export function FieldInput({ field, value, onChange, style }: FieldInputProps) {
  const label = `${field.name} (${field.unit})`

  const getKeyboardType = () => {
    switch (field.field_type) {
      case 'time':
      case 'number':
      case 'distance':
        return 'numeric' as const
      case 'text':
      default:
        return 'default' as const
    }
  }

  const getPlaceholder = () => {
    switch (field.field_type) {
      case 'time':
        return `Enter ${field.unit}`
      case 'number':
        return `Enter ${field.unit}`
      case 'distance':
        return `Enter ${field.unit}`
      case 'text':
        return `Enter ${field.name.toLowerCase()}`
      default:
        return ''
    }
  }

  return (
    <View style={style}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChange}
        keyboardType={getKeyboardType()}
        placeholder={getPlaceholder()}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
})
