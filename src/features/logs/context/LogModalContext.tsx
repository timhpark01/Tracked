// src/features/logs/context/LogModalContext.tsx
import { createContext, useContext, useState, useCallback, ReactNode } from 'react'

interface LogModalContextValue {
  isModalVisible: boolean
  preSelectedActivityId: string | null
  openModal: (activityId?: string) => void
  closeModal: () => void
}

const LogModalContext = createContext<LogModalContextValue | null>(null)

export function LogModalProvider({ children }: { children: ReactNode }) {
  const [isModalVisible, setIsModalVisible] = useState(false)
  const [preSelectedActivityId, setPreSelectedActivityId] = useState<string | null>(null)

  const openModal = useCallback((activityId?: string) => {
    setPreSelectedActivityId(activityId ?? null)
    setIsModalVisible(true)
  }, [])

  const closeModal = useCallback(() => {
    setIsModalVisible(false)
    setPreSelectedActivityId(null)
  }, [])

  return (
    <LogModalContext.Provider value={{ isModalVisible, preSelectedActivityId, openModal, closeModal }}>
      {children}
    </LogModalContext.Provider>
  )
}

export function useLogModal() {
  const context = useContext(LogModalContext)
  if (!context) {
    throw new Error('useLogModal must be used within a LogModalProvider')
  }
  return context
}
