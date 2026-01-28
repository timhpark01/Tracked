// src/features/auth/index.ts
export { useAuth } from './hooks/useAuth'
export {
  signUp,
  signIn,
  signOut,
  sendPhoneOtp,
  verifyPhoneOtp,
  completePhoneSignup,
  checkUsernameAvailable,
  checkProfileComplete,
} from './services/auth.service'
export {
  phoneSchema,
  otpSchema,
  usernameSchema,
  emailSignupSchema,
  type PhoneFormData,
  type OtpFormData,
  type UsernameFormData,
  type EmailSignupFormData,
} from './schemas/auth.schemas'
