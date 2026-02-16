// src/components/DurationPicker.tsx
import { View, Text, StyleSheet } from 'react-native'
import { Picker } from '@react-native-picker/picker'

interface DurationPickerProps {
  hours: number
  minutes: number
  onHoursChange: (hours: number) => void
  onMinutesChange: (minutes: number) => void
}

const HOURS = Array.from({ length: 13 }, (_, i) => i) // 0-12
const MINUTES = Array.from({ length: 60 }, (_, i) => i) // 0-59

export function DurationPicker({
  hours,
  minutes,
  onHoursChange,
  onMinutesChange,
}: DurationPickerProps) {
  return (
    <View style={styles.container}>
      <View style={styles.pickerWrapper}>
        <Picker
          selectedValue={hours}
          onValueChange={(value) => onHoursChange(value)}
          style={styles.picker}
          itemStyle={styles.pickerItem}
        >
          {HOURS.map((h) => (
            <Picker.Item key={h} label={String(h)} value={h} />
          ))}
        </Picker>
        <Text style={styles.label}>hr</Text>
      </View>
      <View style={styles.pickerWrapper}>
        <Picker
          selectedValue={minutes}
          onValueChange={(value) => onMinutesChange(value)}
          style={styles.picker}
          itemStyle={styles.pickerItem}
        >
          {MINUTES.map((m) => (
            <Picker.Item key={m} label={m.toString().padStart(2, '0')} value={m} />
          ))}
        </Picker>
        <Text style={styles.label}>min</Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 24,
  },
  pickerWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  picker: {
    width: 100,
    height: 200,
  },
  pickerItem: {
    fontSize: 20,
    fontWeight: '500',
  },
  label: {
    fontSize: 17,
    fontWeight: '500',
    color: '#000',
    marginLeft: 8,
  },
})
