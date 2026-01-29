import { Slot } from 'expo-router'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient, useAppStateRefresh } from '@/lib/query-client'
import { useSupabaseAuthRefresh } from '@/lib/supabase'

export default function RootLayout() {
  useAppStateRefresh()
  useSupabaseAuthRefresh()

  return (
    <QueryClientProvider client={queryClient}>
      <Slot />
    </QueryClientProvider>
  )
}
