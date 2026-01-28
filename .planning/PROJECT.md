# Tracked

## What This Is

A mobile-first social network for tracking hobby progress. Users log time or quantity toward personal goals (learning guitar, running miles, books read) and see their growth over time. Social features — follows, feeds, and groups — provide accountability and community around shared interests. Think Strava meets Letterboxd, but for any hobby.

## Core Value

Progress visibility — users can see their own growth over time and celebrate milestones. Everything else (social, groups) supports this core experience.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] Database schema with profiles, hobbies, logs, follows tables
- [ ] Row Level Security policies for data access control
- [ ] Expo project with clean directory structure
- [ ] Supabase client configuration
- [ ] Feed hook to fetch followed users' logs
- [ ] Hobby CRUD (create, edit, delete hobbies with goals)
- [ ] Log entries with photos and notes
- [ ] Profile viewing and editing (bio, avatar)
- [ ] Follow/unfollow users
- [ ] Activity feed showing friends' progress
- [ ] Groups for users with similar interests

### Out of Scope

- Web version — mobile-first, native only for v1
- Real-time notifications — polling/refresh is sufficient initially
- Direct messaging — social interaction happens through logs and groups
- Gamification (badges, streaks) — focus on intrinsic progress tracking first

## Context

**Tech stack (decided):**
- React Native with Expo
- NativeWind (Tailwind for RN)
- Supabase (Postgres, Auth, Storage)
- TanStack Query for data fetching

**Development environment:** Mac-based workflow

**Tracking model:** Hobbies have a `tracking_type` (time vs quantity) and `goal_total`. Logs record `value` (minutes or units) toward that goal.

**Social model:** Follow-based. Users follow other users. Logs are visible to owner + followers. Groups add community layer for similar interests.

## Constraints

- **Stack**: React Native/Expo, NativeWind, Supabase, TanStack Query — already decided
- **Platform**: Mobile-first (iOS/Android via Expo)
- **Styling**: All components must use NativeWind
- **Architecture**: Modular code structure for maintainability

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Supabase over Firebase | Postgres flexibility, RLS for security, simpler pricing | — Pending |
| Time vs quantity tracking types | Covers most hobby tracking patterns (hours practiced, books read, miles run) | — Pending |
| Follow-based social (not groups-first) | Simpler initial social graph, groups added as community layer | — Pending |

---
*Last updated: 2026-01-28 after initialization*
