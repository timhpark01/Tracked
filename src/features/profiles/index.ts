// src/features/profiles/index.ts
// Hooks
export { useMyProfile } from './hooks/useMyProfile'
export { useProfile } from './hooks/useProfile'
export { useUpdateProfile, useCreateProfile } from './hooks/useUpdateProfile'

// Components
export { AvatarPicker } from './components/AvatarPicker'
export { ProfileForm, type ProfileFormData } from './components/ProfileForm'
export { ProfileTabs, type TabKey } from './components/ProfileTabs'
export { SkillsTab } from './components/SkillsTab'
export { FeedTab } from './components/FeedTab'
export { ActivitiesTab } from './components/ActivitiesTab'

// Service functions and types
export {
  getProfile,
  updateProfile,
  createProfile,
  type Profile,
  type ProfileUpdate,
  type ProfileInsert,
} from './services/profiles.service'
