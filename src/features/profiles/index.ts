// src/features/profiles/index.ts
// Hooks
export { useMyProfile } from './hooks/useMyProfile'
export { useProfile } from './hooks/useProfile'
export { useUpdateProfile, useCreateProfile } from './hooks/useUpdateProfile'

// Components
export { AvatarPicker } from './components/AvatarPicker'
export { ProfileForm, type ProfileFormData } from './components/ProfileForm'

// Service functions and types
export {
  getProfile,
  updateProfile,
  createProfile,
  type Profile,
  type ProfileUpdate,
  type ProfileInsert,
} from './services/profiles.service'
