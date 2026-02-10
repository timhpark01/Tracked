// src/features/auth/constants.ts
// Centralized auth-related constants

export const AUTH_TIMEOUTS = {
  /** Timeout for initial session load (increased for slow networks) */
  SESSION_INIT: 10000,
  /** Timeout for sign out operation */
  SIGN_OUT: 5000,
} as const
