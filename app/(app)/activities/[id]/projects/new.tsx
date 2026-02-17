// app/(app)/(tabs)/activities/[id]/projects/new.tsx
import { View, Text, StyleSheet, Alert, KeyboardAvoidingView, Platform, TouchableOpacity } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { router, useLocalSearchParams } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { ProjectForm, useCreateProject } from '@/features/projects'
import { useAuth } from '@/features/auth'

export default function NewProjectScreen() {
  const { id: activityId } = useLocalSearchParams<{ id: string }>()
  const { user } = useAuth()
  const createProject = useCreateProject()

  const handleSubmit = async (data: { name: string; description?: string | null }) => {
    if (!user || !activityId) return

    try {
      await createProject.mutateAsync({
        activity_id: activityId,
        user_id: user.id,
        name: data.name,
        description: data.description,
      })
      router.back()
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to create project')
    }
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color="#007AFF" />
        </TouchableOpacity>
        <Text style={styles.title}>New Project</Text>
        <View style={styles.placeholder} />
      </View>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.content}>
          <ProjectForm onSubmit={handleSubmit} isLoading={createProject.isPending} />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  backButton: {
    padding: 4,
  },
  title: {
    fontSize: 17,
    fontWeight: '600',
    color: '#111827',
  },
  placeholder: {
    width: 32,
  },
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
  },
})
