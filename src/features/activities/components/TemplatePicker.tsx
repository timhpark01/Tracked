// src/features/activities/components/TemplatePicker.tsx
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native'
import { useTemplates } from '@/features/templates'
import type { TemplateWithFields } from '@/types/fields'

interface TemplatePickerProps {
  visible: boolean
  onClose: () => void
  onSelect: (template: TemplateWithFields | null) => void
}

export function TemplatePicker({ visible, onClose, onSelect }: TemplatePickerProps) {
  const { data: templates, isLoading } = useTemplates()

  const systemTemplates = templates?.filter((t) => t.is_system) ?? []
  const userTemplates = templates?.filter((t) => !t.is_system) ?? []

  const handleSelect = (template: TemplateWithFields | null) => {
    onSelect(template)
    onClose()
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Choose a Template</Text>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
          {/* Start from scratch option */}
          <TouchableOpacity
            style={styles.scratchOption}
            onPress={() => handleSelect(null)}
          >
            <Text style={styles.scratchTitle}>Start from Scratch</Text>
            <Text style={styles.scratchDescription}>
              Create a custom activity with your own fields
            </Text>
          </TouchableOpacity>

          {isLoading && (
            <View style={styles.loading}>
              <ActivityIndicator size="small" color="#007AFF" />
            </View>
          )}

          {/* System templates */}
          {systemTemplates.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Templates</Text>
              {systemTemplates.map((template) => (
                <TemplateCard
                  key={template.id}
                  template={template}
                  onSelect={() => handleSelect(template)}
                />
              ))}
            </View>
          )}

          {/* User templates */}
          {userTemplates.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Your Templates</Text>
              {userTemplates.map((template) => (
                <TemplateCard
                  key={template.id}
                  template={template}
                  onSelect={() => handleSelect(template)}
                />
              ))}
            </View>
          )}
        </ScrollView>
      </View>
    </Modal>
  )
}

interface TemplateCardProps {
  template: TemplateWithFields
  onSelect: () => void
}

function TemplateCard({ template, onSelect }: TemplateCardProps) {
  return (
    <TouchableOpacity style={styles.templateCard} onPress={onSelect}>
      <View style={styles.templateHeader}>
        <Text style={styles.templateName}>{template.name}</Text>
        {template.category && (
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryText}>{template.category}</Text>
          </View>
        )}
      </View>
      {template.description && (
        <Text style={styles.templateDescription}>{template.description}</Text>
      )}
      <View style={styles.fieldsPreview}>
        {template.fields.map((field, index) => (
          <View key={field.id} style={styles.fieldBadge}>
            <Text style={styles.fieldBadgeText}>
              {field.name} ({field.unit})
            </Text>
          </View>
        ))}
      </View>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
  closeButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  closeButtonText: {
    color: '#007AFF',
    fontSize: 16,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  loading: {
    padding: 20,
    alignItems: 'center',
  },
  scratchOption: {
    backgroundColor: '#f0f9ff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 2,
    borderColor: '#007AFF',
    borderStyle: 'dashed',
  },
  scratchTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
    marginBottom: 4,
  },
  scratchDescription: {
    fontSize: 14,
    color: '#6b7280',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  templateCard: {
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  templateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  templateName: {
    fontSize: 16,
    fontWeight: '600',
  },
  categoryBadge: {
    backgroundColor: '#e5e7eb',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  categoryText: {
    fontSize: 12,
    color: '#6b7280',
  },
  templateDescription: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 8,
  },
  fieldsPreview: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 8,
  },
  fieldBadge: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  fieldBadgeText: {
    fontSize: 12,
    color: '#374151',
  },
})
