// src/features/projects/services/projects.service.ts
import { supabase } from '@/lib/supabase'
import type { Database } from '@/types/database'

type Project = Database['public']['Tables']['projects']['Row']
type ProjectInsert = Database['public']['Tables']['projects']['Insert']
type ProjectUpdate = Database['public']['Tables']['projects']['Update']

export type { Project, ProjectInsert, ProjectUpdate }

export async function getProjects(activityId: string): Promise<Project[]> {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('activity_id', activityId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}

export async function getProject(projectId: string): Promise<Project> {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('id', projectId)
    .single()

  if (error) throw error
  return data
}

export async function getAllUserProjects(userId: string): Promise<Project[]> {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}

export async function getRecentProjects(userId: string, limit: number = 5): Promise<Project[]> {
  // Get projects that have recent logs
  const { data, error } = await supabase
    .from('activity_logs')
    .select('project_id, projects!inner(*)')
    .eq('user_id', userId)
    .order('logged_at', { ascending: false })
    .limit(limit * 2) // Fetch more to account for duplicates

  if (error) throw error

  // Deduplicate by project_id and return unique projects
  const seen = new Set<string>()
  const uniqueProjects: Project[] = []

  for (const log of data || []) {
    const project = log.projects as unknown as Project
    if (!seen.has(project.id)) {
      seen.add(project.id)
      uniqueProjects.push(project)
      if (uniqueProjects.length >= limit) break
    }
  }

  return uniqueProjects
}

export async function createProject(project: ProjectInsert): Promise<Project> {
  const { data, error } = await supabase
    .from('projects')
    .insert(project)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateProject(projectId: string, updates: ProjectUpdate): Promise<Project> {
  const { data, error } = await supabase
    .from('projects')
    .update(updates)
    .eq('id', projectId)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deleteProject(projectId: string): Promise<void> {
  const { error } = await supabase
    .from('projects')
    .delete()
    .eq('id', projectId)

  if (error) throw error
}
