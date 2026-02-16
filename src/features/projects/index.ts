// src/features/projects/index.ts

// Services
export {
  getProjects,
  getProject,
  getAllUserProjects,
  getRecentProjects,
  createProject,
  updateProject,
  deleteProject
} from './services/projects.service'

// Hooks
export { useProjects } from './hooks/useProjects'
export { useProject } from './hooks/useProject'
export { useAllUserProjects } from './hooks/useAllUserProjects'
export { useRecentProjects } from './hooks/useRecentProjects'
export { useCreateProject } from './hooks/useCreateProject'
export { useUpdateProject } from './hooks/useUpdateProject'
export { useDeleteProject } from './hooks/useDeleteProject'

// Components
export { ProjectCard } from './components/ProjectCard'
export { ProjectList } from './components/ProjectList'
export { ProjectForm } from './components/ProjectForm'
