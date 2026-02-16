// src/features/logs/components/LogProgressModal.tsx
// DEPRECATED: This modal is no longer used. We now use full-page logging at /log
// Keeping this file to avoid breaking imports, but it renders nothing.
import { useEffect } from 'react'
import { router } from 'expo-router'
import { useLogModal } from '../context/LogModalContext'

export function LogProgressModal() {
  const { isModalVisible, preSelectedActivityId, closeModal } = useLogModal()

  // If modal is opened, redirect to log page and close it
  useEffect(() => {
    if (isModalVisible) {
      closeModal()
      // Navigate to main log page (user can select a project there)
      router.push('/log')
    }
  }, [isModalVisible, closeModal])

  return null
}
