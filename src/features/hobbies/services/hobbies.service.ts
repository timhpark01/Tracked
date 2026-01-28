// src/features/hobbies/services/hobbies.service.ts
import { supabase } from '@/lib/supabase'
import type { Database } from '@/types/database'

type Hobby = Database['public']['Tables']['hobbies']['Row']
type HobbyInsert = Database['public']['Tables']['hobbies']['Insert']
type HobbyUpdate = Database['public']['Tables']['hobbies']['Update']

export type { Hobby, HobbyInsert, HobbyUpdate }

export async function getHobbies(userId: string): Promise<Hobby[]> {
  const { data, error } = await supabase
    .from('hobbies')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}

export async function getHobby(hobbyId: string): Promise<Hobby> {
  const { data, error } = await supabase
    .from('hobbies')
    .select('*')
    .eq('id', hobbyId)
    .single()

  if (error) throw error
  return data
}

export async function createHobby(hobby: HobbyInsert): Promise<Hobby> {
  const { data, error } = await supabase
    .from('hobbies')
    .insert(hobby)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateHobby(hobbyId: string, updates: HobbyUpdate): Promise<Hobby> {
  const { data, error } = await supabase
    .from('hobbies')
    .update(updates)
    .eq('id', hobbyId)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deleteHobby(hobbyId: string): Promise<void> {
  const { error } = await supabase
    .from('hobbies')
    .delete()
    .eq('id', hobbyId)

  if (error) throw error
}
