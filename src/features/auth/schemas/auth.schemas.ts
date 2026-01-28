import { z } from 'zod'

export const phoneSchema = z.object({
  phone: z
    .string()
    .min(10, 'Phone number is required')
    .regex(
      /^\+[1-9]\d{1,14}$/,
      'Enter phone with country code (e.g., +1234567890)'
    ),
})

export const otpSchema = z.object({
  code: z
    .string()
    .length(6, 'Code must be 6 digits')
    .regex(/^\d{6}$/, 'Code must contain only digits'),
})

export const usernameSchema = z.object({
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(30, 'Username must be at most 30 characters')
    .regex(
      /^[a-zA-Z0-9_]+$/,
      'Username can only contain letters, numbers, and underscores'
    ),
})

export const emailSignupSchema = z
  .object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string(),
    username: z
      .string()
      .min(3, 'Username must be at least 3 characters')
      .max(30, 'Username must be at most 30 characters')
      .regex(/^[a-zA-Z0-9_]+$/, 'Letters, numbers, and underscores only'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

export type PhoneFormData = z.infer<typeof phoneSchema>
export type OtpFormData = z.infer<typeof otpSchema>
export type UsernameFormData = z.infer<typeof usernameSchema>
export type EmailSignupFormData = z.infer<typeof emailSignupSchema>
