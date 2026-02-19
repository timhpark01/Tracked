// src/features/groups/components/GroupForm.tsx
import { useState } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import type { Database } from '@/types/database'

type MembershipType = Database['public']['Tables']['groups']['Row']['membership_type']

interface GroupFormData {
  name: string
  description: string
  membership_type: MembershipType
  is_discoverable: boolean
}

interface GroupFormProps {
  initialData?: Partial<GroupFormData>
  onSubmit: (data: GroupFormData) => void
  isSubmitting?: boolean
  submitLabel?: string
}

const MEMBERSHIP_OPTIONS: {
  value: MembershipType
  label: string
  description: string
  icon: keyof typeof Ionicons.glyphMap
}[] = [
  {
    value: 'open',
    label: 'Open',
    description: 'Anyone can join',
    icon: 'globe-outline',
  },
  {
    value: 'request',
    label: 'Request',
    description: 'Admin approval required',
    icon: 'hand-right-outline',
  },
  {
    value: 'invite',
    label: 'Invite Only',
    description: 'Only invited users can join',
    icon: 'lock-closed-outline',
  },
]

export function GroupForm({
  initialData,
  onSubmit,
  isSubmitting = false,
  submitLabel = 'Create Group',
}: GroupFormProps) {
  const [name, setName] = useState(initialData?.name ?? '')
  const [description, setDescription] = useState(initialData?.description ?? '')
  const [membershipType, setMembershipType] = useState<MembershipType>(
    initialData?.membership_type ?? 'open'
  )
  const [isDiscoverable, setIsDiscoverable] = useState(
    initialData?.is_discoverable ?? true
  )

  const handleSubmit = () => {
    if (!name.trim()) return
    onSubmit({
      name: name.trim(),
      description: description.trim(),
      membership_type: membershipType,
      is_discoverable: isDiscoverable,
    })
  }

  const isValid = name.trim().length >= 2

  return (
    <View style={styles.container}>
      <View style={styles.field}>
        <Text style={styles.label}>Group Name</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="Enter group name"
          placeholderTextColor="#9ca3af"
          maxLength={50}
        />
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Description (optional)</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={description}
          onChangeText={setDescription}
          placeholder="What is this group about?"
          placeholderTextColor="#9ca3af"
          multiline
          numberOfLines={3}
          maxLength={500}
        />
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Membership Type</Text>
        <View style={styles.membershipOptions}>
          {MEMBERSHIP_OPTIONS.map((option) => (
            <TouchableOpacity
              key={option.value}
              style={[
                styles.membershipOption,
                membershipType === option.value && styles.membershipOptionActive,
              ]}
              onPress={() => setMembershipType(option.value)}
            >
              <Ionicons
                name={option.icon}
                size={20}
                color={membershipType === option.value ? '#007AFF' : '#6b7280'}
              />
              <View style={styles.membershipText}>
                <Text
                  style={[
                    styles.membershipLabel,
                    membershipType === option.value &&
                      styles.membershipLabelActive,
                  ]}
                >
                  {option.label}
                </Text>
                <Text style={styles.membershipDescription}>
                  {option.description}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <TouchableOpacity
        style={styles.toggleRow}
        onPress={() => setIsDiscoverable(!isDiscoverable)}
      >
        <View style={styles.toggleText}>
          <Text style={styles.toggleLabel}>Discoverable</Text>
          <Text style={styles.toggleDescription}>
            Allow group to appear in search results
          </Text>
        </View>
        <View
          style={[
            styles.toggle,
            isDiscoverable && styles.toggleActive,
          ]}
        >
          <View
            style={[
              styles.toggleThumb,
              isDiscoverable && styles.toggleThumbActive,
            ]}
          />
        </View>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.submitButton, !isValid && styles.submitButtonDisabled]}
        onPress={handleSubmit}
        disabled={!isValid || isSubmitting}
      >
        {isSubmitting ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.submitButtonText}>{submitLabel}</Text>
        )}
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  field: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: '#111827',
    backgroundColor: '#fff',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  membershipOptions: {
    gap: 8,
  },
  membershipOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    backgroundColor: '#fff',
    gap: 12,
  },
  membershipOptionActive: {
    borderColor: '#007AFF',
    backgroundColor: '#eff6ff',
  },
  membershipText: {
    flex: 1,
  },
  membershipLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  membershipLabelActive: {
    color: '#007AFF',
  },
  membershipDescription: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    marginBottom: 24,
  },
  toggleText: {
    flex: 1,
  },
  toggleLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  toggleDescription: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  toggle: {
    width: 50,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#d1d5db',
    padding: 2,
  },
  toggleActive: {
    backgroundColor: '#007AFF',
  },
  toggleThumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#fff',
  },
  toggleThumbActive: {
    transform: [{ translateX: 22 }],
  },
  submitButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
})
