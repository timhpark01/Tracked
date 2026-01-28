import {
  View,
  Text,
  TextInput,
  StyleSheet,
  type KeyboardTypeOptions,
  type StyleProp,
  type ViewStyle,
} from 'react-native'
import {
  Controller,
  type Control,
  type FieldValues,
  type Path,
} from 'react-hook-form'

interface ControlledInputProps<T extends FieldValues> {
  control: Control<T>
  name: Path<T>
  label: string
  placeholder?: string
  keyboardType?: KeyboardTypeOptions
  secureTextEntry?: boolean
  style?: StyleProp<ViewStyle>
}

export function ControlledInput<T extends FieldValues>({
  control,
  name,
  label,
  placeholder,
  keyboardType,
  secureTextEntry,
  style,
}: ControlledInputProps<T>) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
        <View style={style}>
          <Text style={styles.label}>{label}</Text>
          <TextInput
            style={styles.input}
            onBlur={onBlur}
            onChangeText={onChange}
            value={value}
            placeholder={placeholder}
            keyboardType={keyboardType}
            secureTextEntry={secureTextEntry}
          />
          {error && <Text style={styles.error}>{error.message}</Text>}
        </View>
      )}
    />
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
    borderColor: '#d1d5db', // gray-300
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  error: {
    color: '#ef4444', // red-500
    fontSize: 12,
    marginTop: 4,
  },
})
