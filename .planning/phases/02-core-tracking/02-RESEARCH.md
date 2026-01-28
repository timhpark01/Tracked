# Phase 2: Core Tracking - Research

**Researched:** 2026-01-28
**Domain:** React Native CRUD operations, Supabase data management, image uploads, form handling, progress tracking
**Confidence:** HIGH

## Summary

Phase 2 builds on the foundation established in Phase 1 (Supabase auth, TanStack Query, Expo Router) to implement the core hobby tracking functionality. This research covers: CRUD operations for profiles, hobbies, and logs using TanStack Query mutations with Supabase; image upload patterns for avatars and log photos using Expo ImagePicker and Supabase Storage; form handling with react-hook-form and Zod validation; progress/stats calculations using Supabase aggregate functions; and NativeWind styling integration.

The key architectural insight for this phase is: **All mutations should follow the optimistic update pattern** to provide instant UI feedback while data syncs to Supabase. Combined with proper query invalidation, this creates a responsive user experience even on slow networks. The existing database schema from Phase 1 already has all required tables (profiles, hobbies, hobby_logs) with RLS policies in place.

**Primary recommendation:** Build feature-based services (profiles, hobbies, logs) with TanStack Query hooks that wrap Supabase operations, using optimistic updates for mutations and query invalidation for consistency. Use react-hook-form with Zod for all forms, and Supabase Storage with user-folder policies for image uploads.

## Standard Stack

The established libraries/tools for this domain:

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| **@tanstack/react-query** | 5.90.20+ | Mutations and caching | Already configured. Provides useMutation for CRUD, optimistic updates, and query invalidation. |
| **@supabase/supabase-js** | 2.93.2+ | Database and storage | Already configured. Use for queries, mutations, and file uploads. |
| **react-hook-form** | Latest | Form state management | Industry standard for React Native forms. Minimal re-renders, TypeScript support, Controller component for RN. |
| **zod** | Latest | Schema validation | Type-safe validation that integrates with react-hook-form via @hookform/resolvers. |
| **expo-image-picker** | 16.x (SDK 54) | Photo selection | Official Expo module for camera/library access. Returns URIs for upload. |
| **expo-file-system** | 18.x (SDK 54) | File reading | Required to convert image URIs to base64 for Supabase Storage upload. |
| **base64-arraybuffer** | Latest | Binary conversion | Converts base64 to ArrayBuffer for Supabase Storage upload. |
| **nativewind** | 4.2.1+ | Tailwind styling | Utility-first styling for React Native. v4.2.1+ required for Expo SDK 54 + Reanimated v4 compatibility. |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| **@hookform/resolvers** | Latest | Form validation bridge | Connect Zod schemas to react-hook-form. |
| **tailwindcss** | 3.4.17 | CSS utility classes | Required by NativeWind. Use v3.x, NOT v4.x (that's for NativeWind v5). |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| react-hook-form | Formik | Formik has more boilerplate, but better docs. react-hook-form is faster and more modern. |
| Zod | Yup | Yup has been around longer but Zod has better TypeScript inference. |
| NativeWind | StyleSheet | StyleSheet is built-in but verbose. NativeWind enables rapid prototyping with Tailwind utilities. |

**Installation:**
```bash
# Form handling
npm install react-hook-form @hookform/resolvers zod

# Image picking and file handling
npx expo install expo-image-picker expo-file-system
npm install base64-arraybuffer

# Styling (if not already installed)
npx expo install nativewind@^4.2.1 react-native-reanimated tailwindcss@^3.4.17 --dev
```

## Architecture Patterns

### Recommended Project Structure

```
src/
├── features/
│   ├── auth/                    # Phase 1 (existing)
│   │   ├── hooks/useAuth.ts
│   │   └── services/auth.service.ts
│   ├── profiles/                # Phase 2 NEW
│   │   ├── hooks/
│   │   │   ├── useProfile.ts    # Get profile by ID
│   │   │   ├── useMyProfile.ts  # Get current user profile
│   │   │   └── useUpdateProfile.ts
│   │   ├── services/
│   │   │   └── profiles.service.ts
│   │   └── components/
│   │       ├── ProfileForm.tsx
│   │       └── AvatarPicker.tsx
│   ├── hobbies/                 # Phase 2 NEW
│   │   ├── hooks/
│   │   │   ├── useHobbies.ts    # List user's hobbies
│   │   │   ├── useHobby.ts      # Get single hobby
│   │   │   ├── useCreateHobby.ts
│   │   │   ├── useUpdateHobby.ts
│   │   │   └── useDeleteHobby.ts
│   │   ├── services/
│   │   │   └── hobbies.service.ts
│   │   └── components/
│   │       ├── HobbyCard.tsx
│   │       ├── HobbyForm.tsx
│   │       └── HobbyList.tsx
│   ├── logs/                    # Phase 2 NEW
│   │   ├── hooks/
│   │   │   ├── useLogs.ts       # List logs for hobby
│   │   │   ├── useCreateLog.ts
│   │   │   └── useDeleteLog.ts
│   │   ├── services/
│   │   │   └── logs.service.ts
│   │   └── components/
│   │       ├── LogEntry.tsx
│   │       ├── LogForm.tsx
│   │       └── LogHistory.tsx
│   └── stats/                   # Phase 2 NEW
│       ├── hooks/
│       │   └── useHobbyStats.ts
│       └── components/
│           └── ProgressBar.tsx
├── lib/
│   ├── supabase.ts              # Phase 1 (existing)
│   ├── query-client.ts          # Phase 1 (existing)
│   └── storage.ts               # Phase 2 NEW - image upload helpers
└── components/                  # Shared components
    ├── ui/                      # Basic UI primitives
    └── forms/                   # Reusable form components
```

### Pattern 1: Service + Hook Separation

**What:** Services contain raw Supabase calls. Hooks wrap services with TanStack Query.

**When to use:** All data operations.

**Example:**
```typescript
// src/features/hobbies/services/hobbies.service.ts
import { supabase } from '@/lib/supabase'
import type { Database } from '@/types/database'

type Hobby = Database['public']['Tables']['hobbies']['Row']
type HobbyInsert = Database['public']['Tables']['hobbies']['Insert']

export async function getHobbies(userId: string): Promise<Hobby[]> {
  const { data, error } = await supabase
    .from('hobbies')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

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
```

```typescript
// src/features/hobbies/hooks/useHobbies.ts
import { useQuery } from '@tanstack/react-query'
import { getHobbies } from '../services/hobbies.service'
import { useAuth } from '@/features/auth'

export function useHobbies() {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['hobbies', user?.id],
    queryFn: () => getHobbies(user!.id),
    enabled: !!user,
  })
}
```

### Pattern 2: Optimistic Mutations with Rollback

**What:** Update UI immediately, roll back on error.

**When to use:** All mutations where instant feedback improves UX.

**Example:**
```typescript
// src/features/hobbies/hooks/useCreateHobby.ts
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createHobby } from '../services/hobbies.service'
import { useAuth } from '@/features/auth'
import type { Database } from '@/types/database'

type Hobby = Database['public']['Tables']['hobbies']['Row']
type HobbyInsert = Database['public']['Tables']['hobbies']['Insert']

export function useCreateHobby() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createHobby,

    // Optimistic update
    onMutate: async (newHobby: HobbyInsert) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['hobbies', user?.id] })

      // Snapshot previous value
      const previousHobbies = queryClient.getQueryData<Hobby[]>(['hobbies', user?.id])

      // Optimistically add new hobby
      const optimisticHobby: Hobby = {
        ...newHobby,
        id: `temp-${Date.now()}`,
        created_at: new Date().toISOString(),
      } as Hobby

      queryClient.setQueryData<Hobby[]>(
        ['hobbies', user?.id],
        (old = []) => [optimisticHobby, ...old]
      )

      // Return context for rollback
      return { previousHobbies }
    },

    // Roll back on error
    onError: (_err, _newHobby, context) => {
      if (context?.previousHobbies) {
        queryClient.setQueryData(['hobbies', user?.id], context.previousHobbies)
      }
    },

    // Always refetch after success or error
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['hobbies', user?.id] })
    },
  })
}
```

### Pattern 3: Form with Zod Validation

**What:** Type-safe forms with runtime validation.

**When to use:** All forms (hobby creation, log entry, profile edit).

**Example:**
```typescript
// src/features/hobbies/components/HobbyForm.tsx
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { View, Text, TextInput, Pressable } from 'react-native'

const hobbySchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  tracking_type: z.enum(['time', 'quantity']),
  goal_total: z.number().positive().optional(),
  goal_unit: z.string().optional(),
  description: z.string().max(500).optional(),
})

type HobbyFormData = z.infer<typeof hobbySchema>

interface HobbyFormProps {
  onSubmit: (data: HobbyFormData) => void
  isLoading?: boolean
}

export function HobbyForm({ onSubmit, isLoading }: HobbyFormProps) {
  const { control, handleSubmit, formState: { errors } } = useForm<HobbyFormData>({
    resolver: zodResolver(hobbySchema),
    defaultValues: {
      tracking_type: 'time',
    },
  })

  return (
    <View className="gap-4">
      <Controller
        control={control}
        name="name"
        render={({ field: { onChange, onBlur, value } }) => (
          <View>
            <Text className="text-sm font-medium mb-1">Hobby Name</Text>
            <TextInput
              className="border border-gray-300 rounded-lg px-3 py-2"
              onBlur={onBlur}
              onChangeText={onChange}
              value={value}
              placeholder="e.g., Running, Piano, Reading"
            />
            {errors.name && (
              <Text className="text-red-500 text-sm mt-1">{errors.name.message}</Text>
            )}
          </View>
        )}
      />

      <Pressable
        onPress={handleSubmit(onSubmit)}
        disabled={isLoading}
        className="bg-blue-500 rounded-lg py-3 items-center"
      >
        <Text className="text-white font-semibold">
          {isLoading ? 'Creating...' : 'Create Hobby'}
        </Text>
      </Pressable>
    </View>
  )
}
```

### Pattern 4: Image Upload to Supabase Storage

**What:** Pick image, convert to ArrayBuffer, upload to user's folder.

**When to use:** Avatar uploads, log photo attachments.

**Example:**
```typescript
// src/lib/storage.ts
import * as ImagePicker from 'expo-image-picker'
import * as FileSystem from 'expo-file-system'
import { decode } from 'base64-arraybuffer'
import { supabase } from './supabase'

export async function pickImage(): Promise<string | null> {
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: true,
    quality: 0.8,
    aspect: [1, 1], // Square for avatars
  })

  if (result.canceled || !result.assets[0]) {
    return null
  }

  return result.assets[0].uri
}

export async function uploadImage(
  bucket: string,
  path: string,
  uri: string
): Promise<string> {
  // Read file as base64
  const base64 = await FileSystem.readAsStringAsync(uri, {
    encoding: FileSystem.EncodingType.Base64,
  })

  // Convert to ArrayBuffer
  const arrayBuffer = decode(base64)

  // Upload to Supabase Storage
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(path, arrayBuffer, {
      contentType: 'image/jpeg',
      upsert: true,
    })

  if (error) throw error

  // Get public URL
  const { data: urlData } = supabase.storage
    .from(bucket)
    .getPublicUrl(data.path)

  return urlData.publicUrl
}

export async function uploadAvatar(userId: string, uri: string): Promise<string> {
  const path = `${userId}/avatar.jpg`
  return uploadImage('avatars', path, uri)
}

export async function uploadLogPhoto(
  userId: string,
  logId: string,
  uri: string
): Promise<string> {
  const path = `${userId}/${logId}/${Date.now()}.jpg`
  return uploadImage('log-photos', path, uri)
}
```

### Pattern 5: Stats with Aggregate Queries

**What:** Calculate totals and counts using Supabase.

**When to use:** Progress toward goals, log counts.

**Example (client-side aggregation):**
```typescript
// src/features/stats/hooks/useHobbyStats.ts
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

interface HobbyStats {
  totalValue: number
  logCount: number
  goalTotal: number | null
  progressPercent: number
}

async function getHobbyStats(hobbyId: string): Promise<HobbyStats> {
  // Get hobby for goal
  const { data: hobby } = await supabase
    .from('hobbies')
    .select('goal_total')
    .eq('id', hobbyId)
    .single()

  // Get logs for this hobby
  const { data: logs, count } = await supabase
    .from('hobby_logs')
    .select('value', { count: 'exact' })
    .eq('hobby_id', hobbyId)

  const totalValue = logs?.reduce((sum, log) => sum + log.value, 0) ?? 0
  const goalTotal = hobby?.goal_total ?? null
  const progressPercent = goalTotal
    ? Math.min(100, Math.round((totalValue / goalTotal) * 100))
    : 0

  return {
    totalValue,
    logCount: count ?? 0,
    goalTotal,
    progressPercent,
  }
}

export function useHobbyStats(hobbyId: string) {
  return useQuery({
    queryKey: ['hobby-stats', hobbyId],
    queryFn: () => getHobbyStats(hobbyId),
    enabled: !!hobbyId,
  })
}
```

**Example (server-side with RPC for better performance):**
```sql
-- Migration: Create stats function
create or replace function get_hobby_stats(hobby_id_param uuid)
returns json
language plpgsql
security definer
as $$
declare
  result json;
begin
  select json_build_object(
    'total_value', coalesce(sum(hl.value), 0),
    'log_count', count(hl.id),
    'goal_total', h.goal_total
  ) into result
  from hobbies h
  left join hobby_logs hl on hl.hobby_id = h.id
  where h.id = hobby_id_param
  group by h.id, h.goal_total;

  return result;
end;
$$;
```

```typescript
// Using RPC
const { data } = await supabase.rpc('get_hobby_stats', { hobby_id_param: hobbyId })
```

### Anti-Patterns to Avoid

- **Fetching all data for counts:** Don't fetch all logs to count them client-side. Use `{ count: 'exact' }` or RPC functions.
- **Storing images as base64 in database:** Use Supabase Storage with URLs stored in database.
- **Skipping optimistic updates:** Without them, users see delay after every action. Always implement for mutations.
- **Giant form components:** Split forms into reusable controlled components (ControlledInput, ControlledSelect).
- **Inline styles with NativeWind:** Use className for styling, not mixed StyleSheet and NativeWind.

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Form validation | Custom validation logic | Zod + react-hook-form | Edge cases (async validation, nested objects, arrays), type inference, error messages. |
| Image picking | Native module bridging | expo-image-picker | Handles permissions, multiple selection, cropping, cross-platform. |
| File uploads | Direct HTTP to storage | Supabase Storage + expo-file-system | Base64 conversion, error handling, public URLs, CDN. |
| Progress calculations | Complex client-side logic | Supabase count + sum | Server does heavy lifting, fewer bytes over network. |
| Query caching | Custom cache with AsyncStorage | TanStack Query | Stale-while-revalidate, background refetch, optimistic updates built-in. |

**Key insight:** The stack (TanStack Query + Supabase + Expo) handles 90% of data management complexity. Focus on business logic (hobby tracking), not infrastructure.

## Common Pitfalls

### Pitfall 1: Mutation Without Query Invalidation

**What goes wrong:** User creates hobby, list doesn't update until manual refresh.

**Why it happens:** Forgot to invalidate queries after mutation succeeds.

**How to avoid:**
1. Always include `onSettled` with `invalidateQueries`
2. Match query keys exactly: `['hobbies', userId]` not just `['hobbies']`
3. Test: create item, verify list updates immediately

**Warning signs:**
- UI shows stale data after mutation
- "Pull to refresh" needed after every action

### Pitfall 2: Image Upload Permission Denied

**What goes wrong:** ImagePicker throws permission error on iOS/Android.

**Why it happens:** Didn't request permissions before launching picker.

**How to avoid:**
```typescript
const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
if (status !== 'granted') {
  Alert.alert('Permission needed', 'Please allow photo access')
  return
}
// Now safe to launch picker
```

**Warning signs:**
- Works in Expo Go but fails in production build
- Error: "Permission to access media library was denied"

### Pitfall 3: Storage Bucket RLS Blocking Uploads

**What goes wrong:** Upload returns 403 "new row violates row-level security policy".

**Why it happens:** Storage bucket has RLS enabled but no INSERT policy.

**How to avoid:**
1. Create storage bucket with correct policies (see Code Examples)
2. Structure paths as `{user_id}/filename` to match policy
3. Test: upload file as authenticated user, verify success

**Warning signs:**
- Upload works in Dashboard but fails from app
- Error mentions "row-level security"

### Pitfall 4: Form Re-renders Causing Input Lag

**What goes wrong:** Typing is slow, keyboard input delayed.

**Why it happens:** Using useState for every field causes re-renders on every keystroke.

**How to avoid:**
1. Use react-hook-form with Controller (uncontrolled inputs)
2. Don't spread `{...field}` on RN TextInput (use individual props)
3. Use `mode: 'onBlur'` for validation instead of `onChange`

**Warning signs:**
- Keyboard input feels laggy
- Console shows many re-renders during typing

### Pitfall 5: NativeWind Not Working with Expo SDK 54

**What goes wrong:** className styles don't apply, components unstyled.

**Why it happens:** Version mismatch between NativeWind, Reanimated, and Expo SDK.

**How to avoid:**
1. Use NativeWind 4.2.1+ (has Reanimated v4 patch)
2. Use Tailwind CSS 3.4.17, NOT v4.x
3. Don't use both `babel-plugin-react-native-reanimated` AND worklets plugin
4. Import `global.css` in root layout

**Warning signs:**
- Build fails with "Duplicate plugin/preset detected"
- Styles don't apply but no error

## Code Examples

Verified patterns from official sources:

### Storage Bucket Setup (Migration)

```sql
-- supabase/migrations/00002_create_storage_buckets.sql

-- Create avatars bucket (public read, authenticated write to own folder)
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true);

-- Create log-photos bucket (public read, authenticated write to own folder)
insert into storage.buckets (id, name, public)
values ('log-photos', 'log-photos', true);

-- Policy: Anyone can view avatars
create policy "Avatars are publicly accessible"
on storage.objects for select
using (bucket_id = 'avatars');

-- Policy: Users can upload to their own folder
create policy "Users can upload own avatar"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Users can update their own avatar
create policy "Users can update own avatar"
on storage.objects for update
to authenticated
using (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
);

-- Similar policies for log-photos bucket
create policy "Log photos are publicly accessible"
on storage.objects for select
using (bucket_id = 'log-photos');

create policy "Users can upload own log photos"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'log-photos'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "Users can delete own log photos"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'log-photos'
  and (storage.foldername(name))[1] = auth.uid()::text
);
```

### Profile Update with Avatar

```typescript
// src/features/profiles/hooks/useUpdateProfile.ts
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { uploadAvatar } from '@/lib/storage'
import { useAuth } from '@/features/auth'

interface UpdateProfileInput {
  username?: string
  bio?: string
  avatarUri?: string  // Local URI from ImagePicker
}

export function useUpdateProfile() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: UpdateProfileInput) => {
      let avatar_url: string | undefined

      // Upload avatar if provided
      if (input.avatarUri) {
        avatar_url = await uploadAvatar(user!.id, input.avatarUri)
      }

      // Update profile
      const { data, error } = await supabase
        .from('profiles')
        .update({
          ...(input.username && { username: input.username }),
          ...(input.bio !== undefined && { bio: input.bio }),
          ...(avatar_url && { avatar_url }),
        })
        .eq('id', user!.id)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile', user?.id] })
      queryClient.invalidateQueries({ queryKey: ['my-profile'] })
    },
  })
}
```

### Log Entry Form with Photo

```typescript
// src/features/logs/components/LogForm.tsx
import { useState } from 'react'
import { View, Text, TextInput, Pressable, Image } from 'react-native'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { pickImage } from '@/lib/storage'

const logSchema = z.object({
  value: z.number().positive('Value must be positive'),
  note: z.string().max(1000).optional(),
})

type LogFormData = z.infer<typeof logSchema>

interface LogFormProps {
  trackingType: 'time' | 'quantity'
  goalUnit?: string
  onSubmit: (data: LogFormData & { photoUri?: string }) => void
  isLoading?: boolean
}

export function LogForm({ trackingType, goalUnit, onSubmit, isLoading }: LogFormProps) {
  const [photoUri, setPhotoUri] = useState<string | null>(null)

  const { control, handleSubmit, formState: { errors } } = useForm<LogFormData>({
    resolver: zodResolver(logSchema),
  })

  const handlePickPhoto = async () => {
    const uri = await pickImage()
    if (uri) setPhotoUri(uri)
  }

  const handleFormSubmit = (data: LogFormData) => {
    onSubmit({ ...data, photoUri: photoUri ?? undefined })
  }

  const valueLabel = trackingType === 'time' ? 'Minutes' : (goalUnit ?? 'Units')

  return (
    <View className="gap-4">
      <Controller
        control={control}
        name="value"
        render={({ field: { onChange, onBlur, value } }) => (
          <View>
            <Text className="text-sm font-medium mb-1">{valueLabel}</Text>
            <TextInput
              className="border border-gray-300 rounded-lg px-3 py-2"
              onBlur={onBlur}
              onChangeText={(text) => onChange(Number(text) || 0)}
              value={value?.toString() ?? ''}
              keyboardType="numeric"
              placeholder={`Enter ${valueLabel.toLowerCase()}`}
            />
            {errors.value && (
              <Text className="text-red-500 text-sm mt-1">{errors.value.message}</Text>
            )}
          </View>
        )}
      />

      <Controller
        control={control}
        name="note"
        render={({ field: { onChange, onBlur, value } }) => (
          <View>
            <Text className="text-sm font-medium mb-1">Notes (optional)</Text>
            <TextInput
              className="border border-gray-300 rounded-lg px-3 py-2 h-24"
              onBlur={onBlur}
              onChangeText={onChange}
              value={value}
              multiline
              textAlignVertical="top"
              placeholder="How did it go?"
            />
          </View>
        )}
      />

      <View>
        <Text className="text-sm font-medium mb-1">Photo (optional)</Text>
        <Pressable
          onPress={handlePickPhoto}
          className="border border-dashed border-gray-300 rounded-lg p-4 items-center"
        >
          {photoUri ? (
            <Image source={{ uri: photoUri }} className="w-32 h-32 rounded-lg" />
          ) : (
            <Text className="text-gray-500">Tap to add photo</Text>
          )}
        </Pressable>
      </View>

      <Pressable
        onPress={handleSubmit(handleFormSubmit)}
        disabled={isLoading}
        className="bg-blue-500 rounded-lg py-3 items-center"
      >
        <Text className="text-white font-semibold">
          {isLoading ? 'Saving...' : 'Log Progress'}
        </Text>
      </Pressable>
    </View>
  )
}
```

### Progress Bar Component

```typescript
// src/features/stats/components/ProgressBar.tsx
import { View, Text } from 'react-native'

interface ProgressBarProps {
  progress: number  // 0-100
  total: number
  current: number
  unit?: string
  className?: string
}

export function ProgressBar({ progress, total, current, unit, className }: ProgressBarProps) {
  const clampedProgress = Math.min(100, Math.max(0, progress))

  return (
    <View className={className}>
      <View className="flex-row justify-between mb-1">
        <Text className="text-sm text-gray-600">
          {current} / {total} {unit}
        </Text>
        <Text className="text-sm font-medium">
          {clampedProgress}%
        </Text>
      </View>
      <View className="h-2 bg-gray-200 rounded-full overflow-hidden">
        <View
          className="h-full bg-blue-500 rounded-full"
          style={{ width: `${clampedProgress}%` }}
        />
      </View>
    </View>
  )
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| useState for forms | react-hook-form + Controller | 2023+ | 10x fewer re-renders, better validation |
| fetch + manual cache | TanStack Query v5 | 2024 | Optimistic updates, background refetch built-in |
| Custom image upload | expo-file-system + base64-arraybuffer | 2024 | Reliable cross-platform uploads |
| StyleSheet.create | NativeWind 4.x | 2024 | Tailwind utilities, faster prototyping |
| Client-side calculations | Supabase aggregates + RPC | 2024 | Server-side performance, less data transfer |

**Deprecated/outdated:**
- **Formik:** Still works but more boilerplate than react-hook-form
- **NativeWind v2/v3:** Use v4.2.1+ for Expo SDK 54 compatibility
- **Manual FormData uploads:** Use ArrayBuffer pattern instead

## Open Questions

Things that couldn't be fully resolved:

1. **Aggregate Function Performance**
   - What we know: Supabase supports count/sum via `{ count: 'exact' }` or RPC
   - What's unclear: At what scale should we switch from client-side aggregation to RPC?
   - Recommendation: Start with client-side for simplicity. If >1000 logs per hobby, add RPC function.

2. **Offline Mutation Queue**
   - What we know: TanStack Query has `networkMode: 'always'` for queuing
   - What's unclear: Does queue persist across app restart?
   - Recommendation: Test in development. If needed, implement AsyncStorage-based queue for critical mutations.

3. **Image Compression**
   - What we know: expo-image-picker has `quality` option (0-1)
   - What's unclear: What quality level balances file size vs visual quality?
   - Recommendation: Use 0.8 for avatars, 0.7 for log photos. Test with real users.

## Sources

### Primary (HIGH confidence)

- [TanStack Query Mutations Docs](https://tanstack.com/query/latest/docs/framework/react/guides/mutations) - useMutation patterns
- [TanStack Query Optimistic Updates](https://tanstack.com/query/latest/docs/react/guides/optimistic-updates) - onMutate/rollback pattern
- [Expo ImagePicker Docs](https://docs.expo.dev/versions/latest/sdk/imagepicker/) - SDK 54 API
- [Supabase Storage Access Control](https://supabase.com/docs/guides/storage/security/access-control) - Bucket policies
- [Supabase React Native Storage Blog](https://supabase.com/blog/react-native-storage) - ArrayBuffer upload pattern
- [NativeWind v5 Installation](https://www.nativewind.dev/v5/getting-started/installation) - Expo setup
- [React Hook Form Docs](https://react-hook-form.com/get-started) - Controller pattern
- [Supabase PostgREST Aggregates](https://supabase.com/blog/postgrest-aggregate-functions) - count/sum queries
- [Supabase Database Functions](https://supabase.com/docs/guides/database/functions) - RPC pattern

### Secondary (MEDIUM confidence)

- [Makerkit Supabase React Query](https://makerkit.dev/blog/saas/supabase-react-query) - Integration patterns
- [NativeWind SDK 54 Compatibility](https://medium.com/@matthitachi/nativewind-styling-not-working-with-expo-sdk-54-54488c07c20d) - Version requirements
- [React Hook Form React Native](https://echobind.com/post/react-hook-form-for-react-native) - Controller usage

### Tertiary (LOW confidence)

- Various GitHub discussions on TanStack Query + Supabase patterns

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All libraries verified from official docs
- Architecture patterns: HIGH - Patterns from TanStack Query and Supabase official docs
- Code examples: HIGH - Based on official documentation with Expo SDK 54 compatibility verified
- Pitfalls: MEDIUM - Based on community reports and official troubleshooting guides

**Research date:** 2026-01-28
**Valid until:** 2026-04-28 (90 days - stable libraries, check for Expo SDK updates)
