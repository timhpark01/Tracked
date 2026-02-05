// src/features/logs/context/LogModalContext.tsx
import { createContext, useContext, useState, useCallback, ReactNode } from 'react'

interface LogModalContextValue {
  isModalVisible: boolean
  openModal: () => void
  closeModal: () => void
}

const LogModalContext = createContext<LogModalContextValue | null>(null)

export function LogModalProvider({ children }: { children: ReactNode }) {
  const [isModalVisible, setIsModalVisible] = useState(false)

  const openModal = useCallback(() => {
    setIsModalVisible(true)
  }, [])

  const closeModal = useCallback(() => {
    setIsModalVisible(false)
  }, [])

  return (
    <LogModalContext.Provider value={{ isModalVisible, openModal, closeModal }}>
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
