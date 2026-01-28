// src/features/logs/services/logs.service.ts
import { supabase } from '@/lib/supabase'
import type { Database } from '@/types/database'

type HobbyLog = Database['public']['Tables']['hobby_logs']['Row']
type HobbyLogInsert = Database['public']['Tables']['hobby_logs']['Insert']

export async function getLogs(hobbyId: string): Promise<HobbyLog[]> {
  const { data, error } = await supabase
    .from('hobby_logs')
    .select('*')
    .eq('hobby_id', hobbyId)
    .order('logged_at', { ascending: false })

  if (error) throw error
  return data
}

export async function createLog(log: HobbyLogInsert): Promise<HobbyLog> {
  const { data, error } = await supabase
    .from('hobby_logs')
    .insert(log)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deleteLog(logId: string): Promise<void> {
  const { error } = await supabase
    .from('hobby_logs')
    .delete()
    .eq('id', logId)

  if (error) throw error
}
