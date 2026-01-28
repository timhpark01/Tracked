# Project Research Summary

**Project:** Mobile-first social network for tracking hobby progress
**Domain:** Social network with activity tracking and progress visualization
**Researched:** 2026-01-28
**Confidence:** HIGH

## Executive Summary

This project is a hybrid of social networking and habit tracking, combining patterns from platforms like Strava, Letterboxd, and Goodreads into a unified multi-hobby experience. Expert builders approach this domain through three critical layers: a mobile-optimized client (React Native with file-based routing), server state synchronization (TanStack Query), and a BaaS backend with strong security (Supabase with Row-Level Security). The architecture follows modern 2025/2026 patterns with New Architecture support, avoiding legacy approaches like Redux and AsyncStorage.

The recommended stack (Expo, NativeWind, Supabase, TanStack Query) is production-ready and validated by official documentation. Critical additions include Expo Router for navigation, FlashList for feed performance, Zustand for client state, and proper React Native configuration for TanStack Query. The architecture separates concerns cleanly: server state via TanStack Query, client state via Zustand, persistent storage via MMKV, and navigation via file-based routing.

Key risks center on security (Row-Level Security misconfiguration), performance (N+1 queries in feeds, missing indexes), and mobile-specific patterns (offline handling, image compression, OTA update boundaries). Mitigation requires RLS-first database design, denormalized schema for read-heavy feeds, and proper TanStack Query configuration with NetInfo and AppState. The build order must follow dependency chains: foundation first (Expo + Supabase + TanStack Query), then auth (required for RLS), then core features (profiles, hobbies, logs), then social layer (follows, feed), finally advanced features (groups, offline support).

## Key Findings

### Recommended Stack

The chosen core stack (Expo, NativeWind v4, Supabase, TanStack Query) is architecturally sound and follows 2025/2026 best practices. Research filled critical gaps in navigation, state management, list performance, image handling, forms, storage, and monitoring. All recommended technologies have high-confidence validation from official documentation.

**Core technologies:**
- **Expo SDK 54+** with New Architecture enabled — Industry standard, zero-config native, OTA updates, EAS Build
- **NativeWind v4.1.23** (NOT v5) + Tailwind 3.4.17 — Production-ready Tailwind for React Native, v5 is pre-release
- **Supabase** (Postgres + Auth + Storage + Realtime) — Open-source BaaS with Row-Level Security, perfect for social apps
- **TanStack Query v5** — De facto server state management, handles caching, background sync, optimistic updates
- **Expo Router** — File-based routing built on React Navigation v7, automatic deep linking, type-safe navigation
- **Zustand** — Lightweight (~1KB) client state management, replaces Redux for modern apps
- **FlashList v2** — 10x faster than FlatList, essential for social feeds, requires New Architecture
- **expo-image** — Native image caching with BlurHash placeholders, replaces react-native-fast-image
- **react-hook-form + zod** — Industry standard for forms with TypeScript-first validation
- **MMKV v4** — 30x faster than AsyncStorage for key-value storage
- **Sentry** — Industry standard error tracking and performance monitoring

**Avoid:** AsyncStorage (too slow), react-native-fast-image (unmaintained), Redux without Toolkit (overkill), FlatList for main feed (poor performance), NativeWind v5 (pre-release), class components (legacy).

### Expected Features

Social hobby tracking combines two domains: activity tracking (like Strava/Duolingo) and social networking (like Twitter/Instagram). Research identified table stakes vs differentiators vs anti-features.

**Must have (table stakes):**
- Activity tracking with manual entry — Core value proposition, all competitors have this
- User profiles with stats — Users expect identity expression and progress summary
- Activity feed (chronological) — Standard social pattern, defer algorithmic ranking
- Follow/follower system — Asymmetric model (like Twitter/Strava) for social graph
- Basic privacy controls — Public/Private/Followers-only minimum, privacy is deal-breaker in 2026
- Activity stats & history — Users need to see progress over time (counts, streaks)
- Photo attachments — Visual progress is 35% more motivating per research
- Search for users — Find friends to follow
- Notifications — Alerts for follows, likes, comments
- Mobile-optimized — 84% of users prioritize mobile experience

**Should have (competitive differentiators):**
- Multi-hobby tracking — Unique vs single-hobby apps (Strava = fitness only, Letterboxd = movies only)
- Flexible goal types — Time/quantity/frequency to accommodate diverse hobbies
- Progress visualization graphs — Users want to see growth patterns
- Milestone celebrations — Automatic achievement recognition without rigid streak guilt
- Group challenges — 65% more likely to achieve goals with social accountability (defer to post-MVP)
- Interest-based discovery — Find hobbyists with similar interests, not just friends

**Defer (v2+):**
- AI-powered insights — Only 15-20% retention lift, needs fundamentals first, requires 3+ months data
- Algorithmic feed — Complex to build, needs ML and usage data, chronological is simpler for MVP
- Content library (workouts/courses) — Building library without habit loop = "ghost town", build habit loop first
- Advanced gamification — Complex RPG mechanics (Habitica model) are distracting, keep lightweight

**Anti-features (explicitly avoid):**
- Mandatory daily streaks — Triggers guilt and demotivation when broken, use optional tracking instead
- Public-by-default — Privacy concerns are deal-breakers, use private-by-default with opt-in
- Calorie/nutrition tracking — Creates shame and obsession, focus on positive progress
- Social comparison leaderboards — Triggers anxiety, use small group challenges instead
- Forced social broadcasting — No auto-posting to external networks, user controls everything

### Architecture Approach

The architecture follows three layers: client presentation (Expo Router + React Native), data synchronization (TanStack Query managing server state), and backend services (Supabase microservices). Supabase uses a hub-and-spoke model with Postgres at the center and specialized services (PostgREST for API, GoTrue for auth, Realtime for WebSockets, Storage API for media). All services communicate through Kong Gateway.

**Major components:**
1. **Client Layer** — Expo Router for file-based navigation, MVVM pattern separating business logic from UI, NativeWind for styling, functional components with hooks
2. **Data Sync Layer** — TanStack Query for server state (caching, refetch, optimistic updates), Zustand for client state (UI, preferences), MMKV for local persistence (drafts, cache), expo-secure-store for sensitive data
3. **Backend Layer** — Supabase Postgres with Row-Level Security for multi-tenant isolation, PostgREST for RESTful API, GoTrue for JWT auth, Storage API for images, Realtime for WebSocket subscriptions

**Key patterns:**
- **Feature-based directory structure** — Organize by feature (auth, feed, profile), not by technical role
- **Custom query hooks** — Wrap TanStack Query in domain-specific hooks for reusability
- **Optimistic updates** — Update UI immediately for social actions (follows, likes), rollback on error
- **Cursor-based pagination** — Use timestamp/ID cursors for feeds, not offset (handles dynamic data better)
- **RLS-first security** — Enable RLS on all tables, use policies for every CRUD operation, never use service_role in client
- **Denormalized counts** — Store like_count, comment_count in posts table with triggers (avoid N+1 queries)
- **Offline-first** — Queue mutations with TanStack Query, retry on NetInfo reconnect, show cached data with sync indicator

### Critical Pitfalls

Research identified 20 pitfalls across critical, moderate, and minor categories. Top 5 most dangerous:

1. **Row-Level Security not enabled** — Database completely exposed, 83% of Supabase breaches involve RLS misconfigurations. Enable RLS from day one on every table, create policies immediately, never use service_role in client code, add PR checklist verification.

2. **RLS without indexes (99.94% performance loss)** — Queries take 170ms instead of <0.1ms because user_id columns lack indexes. Index every column used in RLS policies, use EXPLAIN ANALYZE to verify, wrap auth.uid() in SELECT for caching.

3. **N+1 query problem in feeds** — Feed with 20 posts makes 60+ queries (1 for posts + 20 for users + 20 for counts). Use JOINs and aggregate queries, denormalize counts with triggers, consider materialized views for complex feeds.

4. **Realtime subscriptions don't scale** — Postgres Changes subscriptions process on single thread, 100 subscribers = 100 RLS checks per insert. Use Broadcast instead (no RLS overhead), or polling with TanStack Query for non-critical updates.

5. **Expo OTA updates with native code changes** — Pushing OTA update that requires new native dependency crashes entire user base. Understand OTA = JavaScript + assets ONLY, document "Requires new build?" in PR template, test OTA updates in staging first.

**Other critical pitfalls:**
- User metadata in RLS policies (security bypass)
- TanStack Query missing React Native configuration (stale data)
- Large image uploads without compression (slow feeds, high costs)
- FlatList without optimization props (janky scrolling)
- Database schema not optimized for feed generation (slow queries)

## Implications for Roadmap

Based on research, the build must follow strict dependency chains. Authentication must come before most features (RLS requires auth.uid()), core data models before UI, follows before feed, simple features before complex.

### Phase 1: Foundation
**Rationale:** Everything depends on infrastructure. Navigation, data fetching, and backend must be configured before features. This phase blocks all others.

**Delivers:**
- Expo project with New Architecture enabled
- Expo Router file structure (app directory with layouts)
- Supabase project with dev/staging/production environments
- TanStack Query setup with NetInfo and AppState configuration
- Environment configuration (.env files)
- Sentry integration (install early for all phases)

**Stack elements:** Expo SDK 54+, Expo Router, Supabase initialization, TanStack Query, Sentry

**Avoids:** Pitfall #7 (TanStack Query missing React Native config), Pitfall #5 (OTA confusion by establishing build patterns)

**Research flag:** Standard patterns, skip research-phase (official Expo and Supabase documentation)

---

### Phase 2: Authentication
**Rationale:** Social features and user-generated content require authentication. Most tables reference auth.uid() in RLS policies. Auth must exist before database schema.

**Delivers:**
- Supabase Auth integration (GoTrue, email/password)
- Auth screens (login, signup, password reset) with react-hook-form + zod
- Session management with TanStack Query
- Protected routes in Expo Router
- Basic RLS policies for auth tables

**Stack elements:** Supabase GoTrue, react-hook-form, zod, expo-secure-store

**Addresses:** Table stakes (user accounts)

**Avoids:** Pitfall #6 (user metadata in policies by establishing patterns early)

**Research flag:** Standard patterns, skip research-phase (Supabase Auth quickstart)

---

### Phase 3: Core Data Models & Security
**Rationale:** Database schema must exist before UI can display or create content. RLS must be enabled from day one. Services abstract Supabase complexity.

**Delivers:**
- Database schema (profiles, hobbies, hobby_logs tables)
- RLS policies for every table (SELECT, INSERT, UPDATE, DELETE)
- Indexes on all RLS-filtered columns (user_id, follower_id, etc.)
- Supabase Storage buckets (avatars, hobby-logs)
- Storage RLS policies
- Service layer functions (profile, hobby, log CRUD)
- Custom TanStack Query hooks (useProfileQuery, useHobbiesQuery)

**Stack elements:** Supabase Postgres, PostgREST, Storage API

**Addresses:** Table stakes (profiles, hobby tracking, activity logging)

**Avoids:** Pitfall #1 (RLS not enabled), Pitfall #2 (RLS without indexes), Pitfall #12 (schema not optimized)

**Research flag:** NEEDS RESEARCH — Design RLS policies for multi-tenant isolation, optimize schema for feed queries, test with EXPLAIN ANALYZE

---

### Phase 4: Solo Tracking (Profiles & Logging)
**Rationale:** Core value proposition. Users need solo tracking before social features make sense. Tests full data flow (client → TanStack Query → Supabase).

**Delivers:**
- Profile screens (view, edit) with image upload
- Hobby creation and management (CRUD)
- Activity log creation with photo attachments
- Image compression with expo-image-manipulator before upload
- Progress visualization (list, stats, basic charts)
- Personal stats dashboard (counts, current streaks)

**Stack elements:** expo-image, expo-image-picker, expo-image-manipulator, FlashList (for log history), react-hook-form + zod

**Addresses:** Table stakes (activity tracking, stats, photos), differentiator (multi-hobby tracking, flexible goals)

**Avoids:** Pitfall #9 (large image uploads), Pitfall #10 (FlatList not optimized by using FlashList)

**Research flag:** Standard patterns, skip research-phase (Expo image handling documentation)

---

### Phase 5: Social Foundation (Follows)
**Rationale:** Follow system is foundation for feed. Feed requires knowing who user follows. Must come before feed implementation.

**Delivers:**
- Follows table with RLS policies
- Follow/unfollow functionality with optimistic updates
- Followers/following lists with FlashList
- Profile discovery (basic search by username)
- Follow notifications

**Stack elements:** TanStack Query (optimistic updates pattern), expo-notifications (basic setup)

**Addresses:** Table stakes (follow system, search, notifications)

**Avoids:** Pitfall #3 (N+1 queries by designing queries with JOINs)

**Research flag:** Standard patterns, skip research-phase (TanStack Query optimistic updates documentation)

---

### Phase 6: Activity Feed
**Rationale:** Feed is most complex query, depends on follows, logs, and profiles all existing. Requires denormalized schema decisions.

**Delivers:**
- Feed query with JOINs (follows + logs + profiles + counts)
- Cursor-based pagination with useInfiniteQuery
- Feed UI with FlashList infinite scroll
- Pull-to-refresh
- Privacy filtering (RLS enforces who can see what)
- Feed performance monitoring with Sentry

**Stack elements:** FlashList, TanStack Query (useInfiniteQuery), Supabase (complex queries)

**Addresses:** Table stakes (activity feed), differentiator (multi-hobby unified feed)

**Avoids:** Pitfall #3 (N+1 queries), Pitfall #10 (FlatList performance), Pitfall #12 (feed schema optimization)

**Research flag:** NEEDS RESEARCH — Feed generation patterns, cursor pagination with RLS, denormalization strategies, test at scale (1000+ users, 10k+ posts)

---

### Phase 7: Progress Visualization
**Rationale:** Extends solo tracking with motivational features. Requires historical data to be meaningful (3+ months ideal).

**Delivers:**
- Advanced stats dashboard (trends, patterns)
- Progress graphs (charts over time)
- Milestone celebrations (automatic recognition)
- Streak tracking (with optional freeze feature)
- Activity calendar view

**Stack elements:** date-fns (date manipulation), charting library (research needed)

**Addresses:** Differentiators (progress visualization, milestone celebrations)

**Avoids:** Anti-features (mandatory streaks, guilt-inducing patterns)

**Research flag:** NEEDS RESEARCH — React Native charting libraries compatible with New Architecture, performance with large datasets

---

### Phase 8: Community Features (Post-MVP)
**Rationale:** Requires active user base for groups to be valuable. Challenge features need proven engagement loop. Defer until MVP validated.

**Delivers:**
- Groups and group_members tables
- Group creation, joining, leaving
- Group-specific feeds
- Group challenges with shared goals
- Group permissions and roles

**Stack elements:** Supabase (extended schema), TanStack Query (group queries)

**Addresses:** Differentiator (group challenges with social accountability)

**Research flag:** NEEDS RESEARCH — Group challenge mechanics, shared goal tracking, notification strategies

---

### Phase 9: Offline Support (Post-MVP)
**Rationale:** Adds reliability but not core functionality. Requires stable feature set to avoid complex conflict resolution. Defer until MVP is production-ready.

**Delivers:**
- AsyncStorage queue for offline mutations
- NetInfo-based retry logic with exponential backoff
- Background sync with react-native-background-fetch
- UI indicators for offline state
- Conflict resolution for concurrent edits

**Stack elements:** @react-native-async-storage/async-storage, @react-native-community/netinfo, TanStack Query (retry logic)

**Addresses:** Mobile UX improvement (reliability with spotty connectivity)

**Avoids:** Pitfall #16 (no offline state handling)

**Research flag:** NEEDS RESEARCH — Conflict resolution strategies, offline queue architecture, background sync on iOS (restrictions)

---

### Phase Ordering Rationale

**Dependency chain:**
```
Foundation (Expo + Supabase + TanStack Query)
    ↓
Auth (required for RLS, user context)
    ↓
Data Models + RLS (required for features)
    ↓
Solo Tracking (profiles, hobbies, logs)
    ↓
Social Foundation (follows)
    ↓
Feed (depends on follows + logs)
    ↓
Progress Viz (requires historical data)
    ↓
Groups (requires active users)
    ↓
Offline (requires stable features)
```

**Key principles:**
1. **Infrastructure first** — Can't build features without foundation configured
2. **Auth early** — RLS policies require auth.uid(), easier to build with auth from start
3. **Security from day one** — Enable RLS immediately, not retrofit later
4. **Core before social** — Users need content to share before social makes sense
5. **Simple to complex** — Follows before groups, chronological feed before algorithmic
6. **Data before insights** — Progress visualization requires history, AI requires even more
7. **Offline last** — Requires stable feature set to avoid complex sync/conflict issues

**How this avoids pitfalls:**
- Phase 3 enforces RLS + indexes from start (Pitfall #1, #2)
- Phase 4 implements image compression before upload feature (Pitfall #9)
- Phase 6 designs feed with denormalization upfront (Pitfall #3, #12)
- Foundation phase establishes TanStack Query config (Pitfall #7)
- Auth phase establishes metadata security patterns (Pitfall #6)

### Research Flags

**Phases needing deeper research during planning:**
- **Phase 3 (Data Models)** — RLS policies for multi-tenant isolation, feed schema optimization, index strategy
- **Phase 6 (Feed)** — Feed generation at scale, cursor pagination with RLS, denormalization strategies, performance testing
- **Phase 7 (Progress Viz)** — React Native charting libraries, performance with large datasets
- **Phase 8 (Groups)** — Group challenge mechanics, shared goal tracking
- **Phase 9 (Offline)** — Conflict resolution, background sync on iOS

**Phases with standard patterns (skip research-phase):**
- **Phase 1 (Foundation)** — Official Expo and Supabase documentation covers setup
- **Phase 2 (Auth)** — Supabase Auth quickstart is comprehensive
- **Phase 4 (Solo Tracking)** — Expo image handling is well-documented
- **Phase 5 (Follows)** — TanStack Query optimistic updates are standard pattern

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | All core technologies validated with official documentation (Expo, Supabase, TanStack Query). NativeWind v4 production-ready. |
| Features | MEDIUM | Based on competitor analysis (Strava, Letterboxd, Goodreads) and industry reports. Table stakes clear, differentiators validated by research. Anti-features from 2026 privacy/mental health research. |
| Architecture | MEDIUM-HIGH | Official Supabase architecture documentation (HIGH), but social feed patterns from community sources (MEDIUM). RLS patterns validated. |
| Pitfalls | HIGH | Critical pitfalls validated with official docs (RLS, Realtime, OTA updates). Performance pitfalls validated with community consensus. CVE-2025-48757 stat low confidence (single source). |

**Overall confidence:** HIGH

The core stack, security patterns, and critical pitfalls are all validated with official documentation. Feature expectations are based on multiple established competitors with verified patterns. Architecture approach combines official Supabase docs (HIGH) with community best practices for social feeds (MEDIUM). The main uncertainty is around specific feed generation performance at scale (>10K users), which requires validation during Phase 6 research.

### Gaps to Address

**During planning:**
- **RLS policy design** (Phase 3) — Need specific policies for each table, test with different user contexts, verify performance with EXPLAIN ANALYZE
- **Feed schema optimization** (Phase 6) — Decide denormalization strategy (counts, user data), test query performance at scale, consider materialized views
- **Charting library selection** (Phase 7) — Research React Native charting libraries compatible with New Architecture, evaluate performance with large datasets
- **Realtime strategy** (Phase 6 or 8) — Decide between Broadcast vs Postgres Changes vs polling, test subscription scalability
- **Offline conflict resolution** (Phase 9) — Design merge strategy for concurrent edits, handle edge cases (delete + edit)

**During implementation:**
- **Feed performance testing** — Validate feed queries with 10K+ posts and 1K+ users before public launch
- **Image compression settings** — Test compression quality vs file size trade-offs, target <500KB per image
- **FlashList optimization** — Tune estimatedItemSize, recycling settings for actual feed data
- **Security audit** — Review all RLS policies before production, test with penetration testing tools

**Post-MVP validation:**
- **Algorithmic feed** — Only add after MVP proves chronological feed works, requires usage data to optimize
- **AI insights** — Only add after 3+ months of user data, validate 15-20% retention lift claim
- **Scale thresholds** — Validate when to switch from fan-out (write-heavy) to pull-based (read-heavy) feed generation, research suggests 1K followers as threshold

## Sources

### Primary (HIGH confidence)
- [Expo Documentation](https://docs.expo.dev/) — Framework setup, OTA updates, New Architecture
- [Expo Router Introduction](https://docs.expo.dev/router/introduction/) — File-based navigation patterns
- [React Native New Architecture](https://docs.expo.dev/guides/new-architecture/) — Migration requirements
- [Supabase Architecture](https://supabase.com/docs/guides/getting-started/architecture) — Backend component structure
- [Supabase Row-Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security) — RLS patterns and performance
- [Supabase Realtime Benchmarks](https://supabase.com/docs/guides/realtime/benchmarks) — Subscription scalability limits
- [TanStack Query React Native](https://tanstack.com/query/latest/docs/framework/react/react-native) — React Native configuration
- [NativeWind v4 Documentation](https://www.nativewind.dev/v5) — Styling patterns, v4 vs v5

### Secondary (MEDIUM confidence)
- [Expo Best Practices](https://cursor.directory/expo-react-native-javascript-best-practices) — MVVM pattern recommendations
- [State Management 2026](https://www.nucamp.co/blog/state-management-in-2026-redux-context-api-and-modern-patterns) — Zustand vs Redux comparison
- [FlashList vs FlatList Performance](https://javascript.plainenglish.io/flashlist-vs-flatlist-2025-complete-performance-comparison-guide-for-react-native-developers-f89989547c29) — 10x performance claims
- [Social Media Feed System Design](https://javatechonline.com/social-media-feed-system-design/) — Feed generation patterns
- [Supabase Best Practices](https://www.leanware.co/insights/supabase-best-practices) — RLS + migration strategies
- [React Native Offline-First 2026](https://javascript.plainenglish.io/building-offline-first-react-native-apps-the-complete-guide-2026-68ff77c7bb06) — Offline patterns
- [Strava Press Releases](https://press.strava.com/articles/strava-adds-new-functionality-and-feature-improvements-for-winter-activities) — Feature validation
- [Letterboxd Feature Overview](https://letterboxd.com/welcome/) — Competitor analysis
- [Fitness App Mistakes to Avoid](https://www.resourcifi.com/fitness-app-development-mistakes-avoid/) — Anti-pattern identification
- [User Expectations for Mobile Apps 2026](https://www.dotcominfoway.com/blog/must-have-mobile-app-features-users-will-expect-in-2026/) — Feature expectations

### Tertiary (LOW confidence, needs validation)
- CVE-2025-48757 Lovable database breach statistics (170+ apps, 83% RLS misconfig) — Single source, not independently verified
- 35% motivation increase from visual progress — Single fitness app study, not peer-reviewed
- 65% goal achievement increase with social accountability — Fitness app blog claim, not peer-reviewed
- 1000-follower threshold for fan-out vs pull-based feeds — AWS DynamoDB pattern, may differ in Supabase

---

*Research completed: 2026-01-28*
*Ready for roadmap: yes*
