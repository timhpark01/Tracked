# Stack Research: Hobby Tracking Social Network

**Project:** Mobile-first social network for tracking hobby progress
**Researched:** 2026-01-28
**Overall Confidence:** HIGH

---

## Executive Summary

The chosen stack (Expo, NativeWind, Supabase, TanStack Query) is **production-ready and validated** for a 2025/2026 mobile-first social network. This research validates those core decisions and fills critical gaps in navigation, state management, image handling, list performance, forms, storage, testing, and monitoring.

**Key Finding:** Your chosen stack is architecturally sound and follows current best practices. The additions below complete it into a full production stack.

---

## 1. VALIDATED CORE STACK

### Framework & Development

| Technology | Version | Status | Rationale |
|------------|---------|--------|-----------|
| **Expo** | Latest SDK (54+) | ✅ Validated | Industry standard. Expo is the recommended framework per React Native docs. Provides EAS Build, OTA updates, zero-config setup. **Critical:** Enable New Architecture (now default in SDK 53+) as legacy architecture will likely be removed in late 2025. |
| **React Native** | Latest via Expo | ✅ Validated | Use Expo's managed version. ~75% of SDK 52+ projects use New Architecture. |
| **TypeScript** | Latest | ✅ Strongly Recommended | Type safety is essential for team projects. Prevents bugs, improves DX. |

**Confidence:** HIGH
**Sources:** [Expo Documentation](https://docs.expo.dev/), [React Native New Architecture](https://docs.expo.dev/guides/new-architecture/)

---

### Styling

| Technology | Version | Status | Rationale |
|------------|---------|--------|-----------|
| **NativeWind** | v4.1.23 | ✅ Validated | Production-ready. Tailwind for React Native. **Critical:** Use v4, NOT v5 (v5 is pre-release, not production-ready). Stable combo: nativewind@4.1.23 + tailwindcss@3.4.17. |
| **Tailwind CSS** | 3.4.17 | ✅ Validated | Peer dependency for NativeWind v4. |
| **react-native-reanimated** | Latest | ✅ Required | Peer dependency for NativeWind. Also the top choice for animations (Reanimated 4 adds CSS Animations). |
| **react-native-safe-area-context** | Latest | ✅ Required | Peer dependency for NativeWind. Essential for notch/home indicator handling. |

**Confidence:** HIGH
**Sources:** [NativeWind v4 Docs](https://www.nativewind.dev/v5), [NativeWind Setup Guide](https://dev.to/aramoh3ni/taming-the-beast-a-foolproof-nativewind-react-native-setup-v52-2025-4dd8)

---

### Backend & Database

| Technology | Version | Status | Rationale |
|------------|---------|--------|-----------|
| **Supabase** | Latest | ✅ Validated | Excellent choice. Provides Postgres database, Auth (email/social/OTP), Storage, Row Level Security, real-time subscriptions. Open-source Firebase alternative. Fast integration, developer-friendly. |
| **@supabase/supabase-js** | Latest | ✅ Validated | Official Supabase client for React Native. Configure with AsyncStorage adapter for session persistence. |

**Confidence:** HIGH
**Sources:** [Supabase React Native Guide](https://supabase.com/docs/guides/auth/quickstarts/react-native), [Expo + Supabase](https://docs.expo.dev/guides/using-supabase/)

---

### Data Fetching & Server State

| Technology | Version | Status | Rationale |
|------------|---------|--------|-----------|
| **TanStack Query** | v5.90.19+ | ✅ Validated | Perfect for server state management. Handles caching, background refetching, optimistic updates, pagination. Works out-of-the-box with React Native. Pair with Supabase client for data fetching. **Key:** Configure `focusManager` for AppState and `onlineManager` for NetInfo. |
| **@tanstack/react-query** | Latest | ✅ Validated | Official package name. |

**Confidence:** HIGH
**Sources:** [TanStack Query React Native Docs](https://tanstack.com/query/latest/docs/framework/react/react-native), [TanStack Query Guide](https://medium.com/@andrew.chester/tanstack-query-the-ultimate-data-fetching-solution-for-react-native-developers-ea2af6ca99f2)

---

## 2. RECOMMENDED ADDITIONS (Fill the Gaps)

### Navigation

| Technology | Version | Purpose | Rationale |
|------------|---------|---------|-----------|
| **Expo Router** | Latest | File-based routing | **Recommended over React Navigation for new projects.** Expo Router is built on React Navigation v7 but adds file-based routing (like Next.js), automatic deep linking, type-safe navigation, and universal apps (mobile + web). Default in new Expo projects. For a social network with feeds, profiles, groups, post details, Expo Router's file system = routing paradigm reduces boilerplate significantly. |
| **React Navigation v7** | Latest | Alternative/fallback | If Expo Router doesn't fit (e.g., highly custom navigation), drop down to React Navigation v7. It's the underlying library, so you can mix both. |

**Recommendation:** Use **Expo Router** for this project.

**Confidence:** HIGH
**Sources:** [Expo Router Introduction](https://docs.expo.dev/router/introduction/), [Expo Router vs React Navigation](https://viewlytics.ai/blog/react-navigation-7-vs-expo-router)

---

### Client State Management

| Technology | Version | Purpose | Rationale |
|------------|---------|---------|-----------|
| **Zustand** | Latest | Global client state | Lightweight (~1KB), zero boilerplate, fast. Perfect for: UI state (modals, theme), user preferences, app-level state. **Why Zustand over Redux:** Simpler API, no providers, no actions/reducers. Redux Toolkit is only needed for enterprise apps with complex state interactions. For a social network, TanStack Query handles server state, Zustand handles client state. This is the modern 2025 pattern. |

**Alternative:** React Context API for very simple state (but Zustand is better for anything beyond 1-2 contexts).

**Confidence:** HIGH
**Sources:** [Zustand vs Redux 2025](https://www.meerako.com/blogs/react-state-management-zustand-vs-redux-vs-context-2025), [React State Management 2025](https://www.zignuts.com/blog/react-state-management-2025)

---

### List Performance

| Technology | Version | Purpose | Rationale |
|------------|---------|---------|-----------|
| **FlashList** | v2.2.0+ | High-performance lists | **Critical for social feeds.** FlashList uses cell recycling (vs FlatList's virtualization), resulting in 10x faster rendering, 54% FPS improvement, 82% less CPU usage. Shopify's open-source, battle-tested (1B+ WeChat users). Drop-in replacement for FlatList. **Important:** FlashList v2 requires New Architecture. If you're on legacy, use v1. For a social network with infinite scroll feeds, FlashList is essential. |

**Avoid:** FlatList for main feed (OK for small lists like settings).

**Confidence:** HIGH
**Sources:** [FlashList vs FlatList Performance](https://javascript.plainenglish.io/flashlist-vs-flatlist-2025-complete-performance-comparison-guide-for-react-native-developers-f89989547c29), [FlashList GitHub](https://github.com/Shopify/flash-list)

---

### Image Handling

| Technology | Version | Purpose | Rationale |
|------------|---------|---------|-----------|
| **expo-image** | ~17.0.10 (SDK 54) | Optimized image component | Built-in to Expo. Uses native caching (Glide/SDWebImage), supports BlurHash/ThumbHash placeholders, priority loading, smooth transitions. **Replaces react-native-fast-image** (which is unmaintained and Expo-incompatible). For a social network with profile pics, post images, expo-image is the best choice. |
| **expo-image-picker** | ~17.0.10 (SDK 54) | Image/video selection | Expo's picker for gallery + camera. Supports quality settings (0-1), editing (crop/rotate), video selection. **Important:** In SDK 54+, default is Passthrough (no compression). Set quality parameter for uploads. |
| **expo-image-manipulator** | Latest | Image compression/resize | Compress images before upload to Supabase Storage. Reduces file size, saves bandwidth, improves UX. **Alternative:** react-native-compressor (but expo-image-manipulator is Expo-native). |

**Avoid:** react-native-fast-image (unmaintained, Expo-incompatible).

**Confidence:** HIGH
**Sources:** [expo-image Docs](https://docs.expo.dev/versions/latest/sdk/image/), [expo-image-picker Docs](https://docs.expo.dev/versions/latest/sdk/imagepicker/), [expo-image vs fast-image](https://medium.com/@engin.bolat/react-native-image-optimization-performance-essentials-9e8ce6a1193e)

---

### Forms & Validation

| Technology | Version | Purpose | Rationale |
|------------|---------|---------|-----------|
| **react-hook-form** | Latest | Form state management | Industry standard for React forms. Minimal re-renders, works with React Native Controller. For a social network: post creation, profile editing, settings, login/signup forms. |
| **zod** | Latest | Schema validation | TypeScript-first validation. Define schemas (z.object), get types (z.infer), validate inputs. Integrates with react-hook-form via @hookform/resolvers/zod. **Why Zod:** Type-safe, declarative, less boilerplate than Yup. |
| **@hookform/resolvers** | Latest | Bridge for zod + RHF | Required to use Zod with react-hook-form. |

**Confidence:** HIGH
**Sources:** [React Hook Form + Zod Guide](https://medium.com/@rutikpanchal121/building-a-robust-form-in-react-native-with-react-hook-form-and-zod-for-validation-7583678970c3), [Form Validation in React Native](https://medium.com/front-end-world/ultimate-guide-to-form-validation-in-react-native-with-react-hook-form-and-zod-efeacba401da)

---

### Storage

| Technology | Version | Purpose | Rationale |
|------------|---------|---------|-----------|
| **react-native-mmkv** | v4.1.0+ | Fast key-value storage | 30x faster than AsyncStorage. Fully synchronous (no async/await), C++ bindings, ~1KB bundle. Use for: user preferences, draft posts, cache, non-sensitive data. **v4 is a Nitro Module** (New Architecture). For a social network, MMKV improves perceived performance (instant reads). |
| **expo-secure-store** | Latest | Secure storage | Hardware-backed (iOS Keychain, Android KeyStore). Use for: auth tokens, encryption keys, sensitive data. **Limitation:** Max ~2KB on some iOS versions, persists across app reinstalls. |

**Pattern:** Store encryption key in expo-secure-store, use it to encrypt MMKV for large secure data.

**Avoid:** AsyncStorage (slow, deprecated for performance use cases).

**Confidence:** HIGH
**Sources:** [MMKV vs AsyncStorage](https://medium.com/@nomanakram1999/stop-using-asyncstorage-in-react-native-mmkv-is-10x-faster-82485a108c25), [expo-secure-store Docs](https://docs.expo.dev/versions/latest/sdk/securestore/)

---

### Error Tracking & Monitoring

| Technology | Version | Purpose | Rationale |
|------------|---------|--------|-----------|
| **Sentry** | Latest | Error tracking, performance | Industry standard for production React Native apps. Captures: JS errors, native crashes, performance traces, session replays. **Setup:** Install early, configure error boundaries, enable tracing, use EAS Build for native crash reporting (Expo Go = JS errors only). For a social network, Sentry shows: slow API calls, UI issues, memory leaks. |
| **@sentry/react-native** | Latest | Official SDK | Supports New Architecture, Expo, native crash reporting. |

**Alternative:** PostHog (open-source, combines analytics + error tracking, but less mature for error tracking than Sentry).

**Confidence:** HIGH
**Sources:** [Sentry React Native Docs](https://docs.sentry.io/platforms/react-native/), [Sentry Best Practices 2025](https://blog.sentry.io/react-native-performance-strategies-tools/)

---

### Analytics

| Technology | Version | Purpose | Rationale |
|------------|---------|---------|-----------|
| **PostHog** | Latest | Product analytics, feature flags | Open-source, all-in-one: analytics, session replay, feature flags, A/B tests, surveys. **Why PostHog:** Works with Expo Go, easy integration, affordable. For a social network: track engagement (posts created, likes, follows), test features (new feed algorithm), run experiments. Install: posthog-react-native + expo dependencies. |
| **Amplitude** | Latest | Alternative analytics | Powerful for user segmentation, retention analysis, funnel analysis. More enterprise-focused. **Choose Amplitude if:** You need advanced cohort analysis. **Choose PostHog if:** You want open-source, feature flags, session replay in one tool. |

**Recommendation:** Start with **PostHog** (simpler, all-in-one). Add Amplitude later if needed.

**Confidence:** MEDIUM (both are good, choice depends on scale/budget)
**Sources:** [PostHog React Native Tutorial](https://posthog.com/tutorials/react-native-analytics), [Amplitude React Native SDK](https://amplitude.com/docs/sdks/analytics/react-native/react-native-sdk), [Expo Analytics Guide](https://docs.expo.dev/guides/using-analytics/)

---

### Testing

| Technology | Version | Purpose | Rationale |
|------------|---------|---------|-----------|
| **jest-expo** | Latest | Jest preset for Expo | Mocks native Expo SDK, handles config. Essential for testing Expo projects. Install: `npx expo install jest-expo jest`. |
| **@testing-library/react-native** | Latest | Component testing | Lightweight, user-centric queries (getByText, getByRole). **Replaces deprecated react-test-renderer.** For testing: login forms, post creation, feed rendering. |
| **@testing-library/jest-native** | Latest | Additional matchers | Extends Jest with React Native-specific matchers (toBeVisible, toHaveStyle). |

**Best Practices:**
- Keep tests in `__tests__/` directory (NOT inside `app/` for Expo Router)
- Test business logic + complex components, not simple UI
- Mock @react-navigation, AsyncStorage, expo-font in test-setup.ts
- Use `jest-expo/universal` to test all platforms (iOS/Android/web)

**Confidence:** HIGH
**Sources:** [Expo Unit Testing Docs](https://docs.expo.dev/develop/unit-testing/), [Jest + RTL Guide 2025](https://www.creolestudios.com/react-native-testing-with-jest-and-rtl/)

---

### Additional Utilities

| Technology | Version | Purpose | Rationale |
|------------|---------|---------|-----------|
| **date-fns** | Latest | Date manipulation | Lightweight (vs Moment.js). For social network: format post timestamps, calculate "3 days ago", handle timezones. |
| **react-native-uuid** | Latest | Generate UUIDs | For optimistic updates (TanStack Query), local IDs before server sync. |
| **expo-haptics** | Latest | Haptic feedback | Improve UX: vibrate on like, post submit, button press. Built into Expo. |
| **expo-notifications** | Latest | Push notifications | For social network: notify on new followers, likes, comments. Configure with Supabase Edge Functions for server-side triggers. |

**Confidence:** MEDIUM (nice-to-haves, not critical for MVP)

---

## 3. AVOID (Anti-Patterns for 2025)

| Technology | Why Avoid | Use Instead |
|------------|-----------|-------------|
| **AsyncStorage** | Too slow (~30x slower than MMKV), async overhead. | react-native-mmkv |
| **react-native-fast-image** | Unmaintained, incompatible with Expo managed workflow. | expo-image |
| **Redux** (without Toolkit) | Too much boilerplate. Modern apps don't need Redux for most use cases. | Zustand (client state) + TanStack Query (server state) |
| **FlatList** (for main feed) | Poor performance with large lists, causes jank on scroll. | FlashList |
| **react-test-renderer** | Deprecated, doesn't support React 19+. | @testing-library/react-native |
| **NativeWind v5** | Pre-release, not production-ready. | NativeWind v4.1.23 |
| **Moment.js** | Huge bundle size, unmaintained. | date-fns or Day.js |
| **expo-analytics-amplitude** | Deprecated, removed in SDK 46. | @amplitude/analytics-react-native |
| **Class Components** | Legacy pattern. Hooks are the standard. | Functional components with hooks |

---

## 4. INSTALLATION SUMMARY

### Core Dependencies

```bash
# Framework
npx create-expo-app@latest

# Styling
npx expo install nativewind tailwindcss react-native-reanimated react-native-safe-area-context

# Backend
npx expo install @supabase/supabase-js @react-native-async-storage/async-storage

# Data Fetching
npm install @tanstack/react-query

# Navigation (Expo Router is default in new projects)
# Already included in create-expo-app

# State Management
npm install zustand

# Lists
npm install @shopify/flash-list

# Images
# expo-image and expo-image-picker are built into Expo SDK
npx expo install expo-image-manipulator

# Forms & Validation
npm install react-hook-form zod @hookform/resolvers

# Storage
npm install react-native-mmkv
npx expo install expo-secure-store

# Error Tracking
npm install @sentry/react-native

# Analytics
npm install posthog-react-native
npx expo install expo-file-system expo-application expo-device expo-localization

# Utilities
npm install date-fns react-native-uuid
npx expo install expo-haptics expo-notifications
```

### Dev Dependencies

```bash
# Testing
npx expo install jest-expo jest
npm install -D @testing-library/react-native @testing-library/jest-native

# TypeScript (if not included)
npm install -D typescript @types/react @types/react-native
```

---

## 5. CONFIGURATION CHECKLIST

- [ ] Enable New Architecture in app.json (SDK 53+ default)
- [ ] Configure NativeWind v4 with Tailwind config
- [ ] Set up Supabase client with AsyncStorage adapter
- [ ] Configure TanStack Query with focusManager (AppState) and onlineManager (NetInfo)
- [ ] Initialize Sentry early in app lifecycle
- [ ] Set up Expo Router in app/ directory
- [ ] Configure EAS Build for production builds
- [ ] Add environment variables for Supabase URL, Anon Key, Sentry DSN
- [ ] Set up jest-expo preset in jest.config.js
- [ ] Create test-setup.ts with mocks (@react-navigation, AsyncStorage, expo-font)

---

## 6. CONFIDENCE ASSESSMENT

| Area | Confidence | Notes |
|------|------------|-------|
| **Core Framework** | HIGH | Expo + TypeScript is the 2025 standard. |
| **Styling** | HIGH | NativeWind v4 is production-ready. |
| **Backend** | HIGH | Supabase is excellent for this use case. |
| **Data Fetching** | HIGH | TanStack Query is the de facto server state solution. |
| **Navigation** | HIGH | Expo Router is the modern choice, React Navigation v7 is the fallback. |
| **State Management** | HIGH | Zustand is the 2025 standard for client state. |
| **Lists** | HIGH | FlashList is essential for feed performance (requires New Architecture). |
| **Images** | HIGH | expo-image is the best option for Expo. |
| **Forms** | HIGH | react-hook-form + zod is the standard. |
| **Storage** | HIGH | MMKV for speed, SecureStore for security. |
| **Error Tracking** | HIGH | Sentry is the industry standard. |
| **Analytics** | MEDIUM | PostHog vs Amplitude depends on needs (both are good). |
| **Testing** | HIGH | jest-expo + RTL is the recommended setup. |

---

## 7. ARCHITECTURAL NOTES

### Stack Layers (Separation of Concerns)

1. **Server State:** TanStack Query + Supabase (posts, users, follows)
2. **Client State:** Zustand (UI state, preferences)
3. **Local Persistence:** MMKV (cache, drafts), SecureStore (tokens)
4. **Navigation:** Expo Router (file-based routing)
5. **UI:** NativeWind + expo-image + FlashList
6. **Validation:** Zod schemas
7. **Monitoring:** Sentry (errors) + PostHog (analytics)

### New Architecture Requirement

**Critical:** This stack assumes React Native's **New Architecture** (enabled by default in Expo SDK 53+). FlashList v2 and other modern libraries require it. The legacy architecture will likely be removed in late 2025.

If you must use legacy architecture:
- Use FlashList v1 instead of v2
- Expect degraded performance
- Plan to migrate soon

### Mac-Based Development

All tools in this stack work seamlessly on Mac:
- Expo CLI + EAS Build (cloud builds, no Xcode required for basic dev)
- Expo Go for testing (iOS Simulator + physical device)
- Android Studio for Android emulator (optional)
- VS Code + TypeScript for best DX

---

## 8. TRADE-OFFS & DECISIONS

### Why Expo over Bare React Native?

**Pros:**
- Zero native config for 95% of use cases
- OTA updates with EAS Update
- Managed builds with EAS Build
- Excellent DX, fast iteration

**Cons:**
- Slightly larger app size (not significant in 2025)
- If you need custom native modules not in Expo, use Development Builds (still Expo, but with custom native code)

**Verdict:** Expo is the right choice for this project. Supabase, TanStack Query, FlashList all work perfectly with Expo.

### Why Zustand over Redux?

**Zustand:**
- ~1KB vs Redux Toolkit ~50KB
- No providers, no boilerplate
- Simple API: create((set) => ({ ... }))
- Perfect for client state (modals, theme, preferences)

**Redux Toolkit:**
- Overkill for most apps
- Only needed for: enterprise apps, complex state machines, time-travel debugging
- This social network doesn't need Redux

**Verdict:** Zustand. TanStack Query handles server state, Zustand handles client state.

### Why Expo Router over React Navigation?

**Expo Router:**
- File system = routing (less boilerplate)
- Automatic deep linking
- Type-safe navigation (inferred from filesystem)
- Universal apps (mobile + web)

**React Navigation:**
- More flexible for highly custom navigation
- Programmatic control
- Been around longer

**Verdict:** Expo Router. For a social network with standard navigation patterns (tabs, stacks, modals), file-based routing is cleaner. You can still drop down to React Navigation APIs when needed.

### Why FlashList over FlatList?

**FlashList:**
- 10x faster rendering
- Cell recycling (vs virtualization)
- 60 FPS on low-end Android
- Drop-in replacement

**FlatList:**
- Built-in (no install)
- OK for small lists

**Verdict:** FlashList for main feed, FlatList for small lists (e.g., settings).

---

## 9. PHASE-SPECIFIC NOTES

### Phase 1: Foundation
- Set up Expo + TypeScript
- Configure Supabase
- Add NativeWind
- Set up Expo Router
- Install Zustand, TanStack Query
- Add Sentry (early!)

### Phase 2: Core Features
- Add FlashList for feed
- Integrate expo-image + expo-image-picker
- Set up react-hook-form + zod
- Configure MMKV + SecureStore

### Phase 3: Social Features
- Add PostHog for analytics
- Set up expo-notifications
- Implement haptics for interactions

### Phase 4: Testing & Polish
- Add jest-expo + RTL
- Write tests for critical flows
- Optimize with FlashList tuning
- Monitor with Sentry

---

## 10. OPEN QUESTIONS & NEXT STEPS

**Answered by this research:**
- ✅ Navigation: Expo Router
- ✅ State: Zustand (client) + TanStack Query (server)
- ✅ Lists: FlashList
- ✅ Images: expo-image + expo-image-picker + expo-image-manipulator
- ✅ Forms: react-hook-form + zod
- ✅ Storage: MMKV + SecureStore
- ✅ Error tracking: Sentry
- ✅ Analytics: PostHog (or Amplitude)
- ✅ Testing: jest-expo + RTL

**For phase-specific research:**
- Supabase Row Level Security policies (Phase 2: Auth)
- Real-time subscriptions setup (Phase 3: Live updates)
- Expo Notifications + Supabase Edge Functions (Phase 3: Push)
- FlashList optimization (estimatedItemSize, recycling) (Phase 3: Performance)

---

## 11. SOURCES

### Validation Sources (HIGH Confidence)
- [Expo Documentation](https://docs.expo.dev/)
- [React Native New Architecture](https://docs.expo.dev/guides/new-architecture/)
- [NativeWind v4 Documentation](https://www.nativewind.dev/v5)
- [Supabase React Native Guide](https://supabase.com/docs/guides/auth/quickstarts/react-native)
- [TanStack Query React Native Docs](https://tanstack.com/query/latest/docs/framework/react/react-native)
- [expo-image Documentation](https://docs.expo.dev/versions/latest/sdk/image/)
- [expo-image-picker Documentation](https://docs.expo.dev/versions/latest/sdk/imagepicker/)
- [Expo Router Introduction](https://docs.expo.dev/router/introduction/)
- [FlashList GitHub](https://github.com/Shopify/flash-list)
- [Sentry React Native Docs](https://docs.sentry.io/platforms/react-native/)
- [Expo Unit Testing](https://docs.expo.dev/develop/unit-testing/)

### Community & Research (MEDIUM Confidence)
- [Expo for React Native in 2025: A Perspective](https://hashrocket.com/blog/posts/expo-for-react-native-in-2025-a-perspective)
- [React Native Tech Stack 2025](https://galaxies.dev/article/react-native-tech-stack-2025)
- [React Navigation 7 vs Expo Router](https://viewlytics.ai/blog/react-navigation-7-vs-expo-router)
- [Zustand vs Redux 2025](https://www.meerako.com/blogs/react-state-management-zustand-vs-redux-vs-context-2025)
- [FlashList vs FlatList Performance](https://javascript.plainenglish.io/flashlist-vs-flatlist-2025-complete-performance-comparison-guide-for-react-native-developers-f89989547c29)
- [MMKV vs AsyncStorage](https://medium.com/@nomanakram1999/stop-using-asyncstorage-in-react-native-mmkv-is-10x-faster-82485a108c25)
- [React Hook Form + Zod Guide](https://medium.com/@rutikpanchal121/building-a-robust-form-in-react-native-with-react-hook-form-and-zod-for-validation-7583678970c3)
- [PostHog React Native Tutorial](https://posthog.com/tutorials/react-native-analytics)
- [Sentry React Native Best Practices](https://blog.sentry.io/react-native-performance-strategies-tools/)

---

## Final Recommendation

**This stack is production-ready for a 2025/2026 mobile-first social network.** The chosen core (Expo, NativeWind, Supabase, TanStack Query) is validated. The additions (Expo Router, Zustand, FlashList, expo-image, react-hook-form + zod, MMKV, Sentry, PostHog) complete it into a modern, performant, maintainable stack.

**Next step:** Proceed to roadmap creation with confidence. This stack supports all core features (auth, posts, feed, profiles, groups, progress tracking) and scales to production.
