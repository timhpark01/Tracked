// src/features/activities/components/FieldEditor.tsx
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native'
import { useState } from 'react'
import type { FieldType } from '@/types/fields'

export interface FieldDefinition {
  id: string
  name: string
  fieldType: FieldType
  unit: string
  isPrimary: boolean
}

interface FieldEditorProps {
  fields: FieldDefinition[]
  onChange: (fields: FieldDefinition[]) => void
}

const FIELD_TYPE_OPTIONS: { value: FieldType; label: string }[] = [
  { value: 'time', label: 'Time' },
  { value: 'number', label: 'Number' },
  { value: 'distance', label: 'Distance' },
  { value: 'text', label: 'Text' },
]

export function FieldEditor({ fields, onChange }: FieldEditorProps) {
  const handleAddField = () => {
    const newField: FieldDefinition = {
      id: `new-${Date.now()}`,
      name: '',
      fieldType: 'number',
      unit: '',
      isPrimary: fields.length === 0,
    }
    onChange([...fields, newField])
  }

  const handleUpdateField = (id: string, updates: Partial<FieldDefinition>) => {
    onChange(
      fields.map((field) =>
        field.id === id ? { ...field, ...updates } : field
      )
    )
  }

  const handleRemoveField = (id: string) => {
    const newFields = fields.filter((field) => field.id !== id)
    // If we removed the primary field, make the first field primary
    if (newFields.length > 0 && !newFields.some((f) => f.isPrimary)) {
      newFields[0].isPrimary = true
    }
    onChange(newFields)
  }

  const handleSetPrimary = (id: string) => {
    onChange(
      fields.map((field) => ({
        ...field,
        isPrimary: field.id === id,
      }))
    )
  }

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Fields</Text>
      <Text style={styles.sectionDescription}>
        Add fields to track for this activity. All fields are optional when logging.
      </Text>

      {fields.map((field, index) => (
        <FieldRow
          key={field.id}
          field={field}
          index={index}
          onUpdate={(updates) => handleUpdateField(field.id, updates)}
          onRemove={() => handleRemoveField(field.id)}
          onSetPrimary={() => handleSetPrimary(field.id)}
        />
      ))}

      <TouchableOpacity style={styles.addButton} onPress={handleAddField}>
        <Text style={styles.addButtonText}>+ Add Field</Text>
      </TouchableOpacity>
    </View>
  )
}

interface FieldRowProps {
  field: FieldDefinition
  index: number
  onUpdate: (updates: Partial<FieldDefinition>) => void
  onRemove: () => void
  onSetPrimary: () => void
}

function FieldRow({ field, index, onUpdate, onRemove, onSetPrimary }: FieldRowProps) {
  const [showTypeSelector, setShowTypeSelector] = useState(false)

  return (
    <View style={styles.fieldRow}>
      <View style={styles.fieldHeader}>
        <Text style={styles.fieldIndex}>Field {index + 1}</Text>
        <View style={styles.fieldActions}>
          <TouchableOpacity
            style={[styles.primaryButton, field.isPrimary && styles.primaryButtonActive]}
            onPress={onSetPrimary}
          >
            <Text
              style={[styles.primaryButtonText, field.isPrimary && styles.primaryButtonTextActive]}
            >
              {field.isPrimary ? 'Primary' : 'Set Primary'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.removeButton} onPress={onRemove}>
            <Text style={styles.removeButtonText}>Remove</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.fieldInputs}>
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Name</Text>
          <TextInput
            style={styles.input}
            value={field.name}
            onChangeText={(value) => onUpdate({ name: value })}
            placeholder="e.g., Duration, Distance"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Type</Text>
          <TouchableOpacity
            style={styles.typeSelector}
            onPress={() => setShowTypeSelector(!showTypeSelector)}
          >
            <Text style={styles.typeSelectorText}>
              {FIELD_TYPE_OPTIONS.find((o) => o.value === field.fieldType)?.label ?? 'Select'}
            </Text>
          </TouchableOpacity>
          {showTypeSelector && (
            <View style={styles.typeOptions}>
              {FIELD_TYPE_OPTIONS.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.typeOption,
                    field.fieldType === option.value && styles.typeOptionActive,
                  ]}
                  onPress={() => {
                    onUpdate({ fieldType: option.value })
                    setShowTypeSelector(false)
                  }}
                >
                  <Text
                    style={[
                      styles.typeOptionText,
                      field.fieldType === option.value && styles.typeOptionTextActive,
                    ]}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Unit</Text>
          <TextInput
            style={styles.input}
            value={field.unit}
            onChangeText={(value) => onUpdate({ unit: value })}
            placeholder="e.g., min, km, reps"
          />
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  sectionDescription: {
    fontSize: 13,
    color: '#6b7280',
    marginBottom: 12,
  },
  fieldRow: {
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  fieldHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  fieldIndex: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  fieldActions: {
    flexDirection: 'row',
    gap: 8,
  },
  primaryButton: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#d1d5db',
    backgroundColor: '#fff',
  },
  primaryButtonActive: {
    borderColor: '#007AFF',
    backgroundColor: '#eff6ff',
  },
  primaryButtonText: {
    fontSize: 12,
    color: '#6b7280',
  },
  primaryButtonTextActive: {
    color: '#007AFF',
  },
  removeButton: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
    backgroundColor: '#fee2e2',
  },
  removeButtonText: {
    fontSize: 12,
    color: '#ef4444',
  },
  fieldInputs: {
    gap: 10,
  },
  inputGroup: {
    gap: 4,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6b7280',
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: '#fff',
    fontSize: 14,
  },
  typeSelector: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: '#fff',
  },
  typeSelectorText: {
    fontSize: 14,
    color: '#374151',
  },
  typeOptions: {
    marginTop: 4,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 6,
    backgroundColor: '#fff',
    overflow: 'hidden',
  },
  typeOption: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  typeOptionActive: {
    backgroundColor: '#eff6ff',
  },
  typeOptionText: {
    fontSize: 14,
    color: '#374151',
  },
  typeOptionTextActive: {
    color: '#007AFF',
    fontWeight: '500',
  },
  addButton: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderStyle: 'dashed',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  addButtonText: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '500',
  },
})
