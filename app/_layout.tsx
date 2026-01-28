import { Slot } from 'expo-router'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient, useAppStateRefresh } from '@/lib/query-client'

export default function RootLayout() {
  useAppStateRefresh()

  return (
    <QueryClientProvider client={queryClient}>
      <Slot />
    </QueryClientProvider>
  )
}
