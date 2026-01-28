// src/features/profiles/index.ts
export { useMyProfile } from './hooks/useMyProfile'
export { useProfile } from './hooks/useProfile'
export { useUpdateProfile, useCreateProfile } from './hooks/useUpdateProfile'
export {
  getProfile,
  updateProfile,
  createProfile,
  type Profile,
  type ProfileUpdate,
  type ProfileInsert,
} from './services/profiles.service'
