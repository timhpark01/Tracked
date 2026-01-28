import {
  View,
  Text,
  TextInput,
  StyleSheet,
  type StyleProp,
  type ViewStyle,
} from 'react-native'
import {
  Controller,
  type Control,
  type FieldValues,
  type Path,
} from 'react-hook-form'

interface ControlledTextAreaProps<T extends FieldValues> {
  control: Control<T>
  name: Path<T>
  label: string
  placeholder?: string
  style?: StyleProp<ViewStyle>
}

export function ControlledTextArea<T extends FieldValues>({
  control,
  name,
  label,
  placeholder,
  style,
}: ControlledTextAreaProps<T>) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
        <View style={style}>
          <Text style={styles.label}>{label}</Text>
          <TextInput
            style={styles.textArea}
            onBlur={onBlur}
            onChangeText={onChange}
            value={value}
            placeholder={placeholder}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
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
  textArea: {
    borderWidth: 1,
    borderColor: '#d1d5db', // gray-300
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    height: 96, // h-24 equivalent
    textAlignVertical: 'top',
  },
  error: {
    color: '#ef4444', // red-500
    fontSize: 12,
    marginTop: 4,
  },
})
