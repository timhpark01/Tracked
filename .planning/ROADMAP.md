# Roadmap: Tracked

## Overview

Tracked delivers a mobile-first social network for tracking hobby progress across four phases. Foundation & Auth establishes infrastructure and user accounts with security. Core Tracking enables solo tracking with profiles, hobbies, logs, and stats visualization. Social Graph adds the follow system for community connections. Activity Feed completes the social experience with a privacy-aware feed of friends' progress.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Foundation & Auth** - Infrastructure and user accounts with security
- [x] **Phase 2: Core Tracking** - Solo tracking with profiles, hobbies, logs, and stats
- [ ] **Phase 3: Social Graph** - Follow system and user discovery
- [ ] **Phase 4: Activity Feed** - Social feed with privacy controls

## Phase Details

### Phase 1: Foundation & Auth
**Goal**: Users can securely access the app with persistent sessions
**Depends on**: Nothing (first phase)
**Requirements**: AUTH-01, AUTH-02, AUTH-03, AUTH-04, PRIV-01
**Success Criteria** (what must be TRUE):
  1. User can create account with email and password
  2. User can log in and session persists across app restarts
  3. User can log out from any screen
  4. Database schema exists with RLS enabled on all tables
  5. Supabase client is configured and TanStack Query is initialized
**Plans**: 3 plans

Plans:
- [x] 01-01-PLAN.md — Project & Database Foundation (Expo init, Supabase schema with RLS)
- [x] 01-02-PLAN.md — Auth Infrastructure (Supabase client, TanStack Query, auth hooks)
- [x] 01-03-PLAN.md — Auth Screens (Login, signup, protected routes)

### Phase 2: Core Tracking
**Goal**: Users can track progress across multiple hobbies with logs and view their growth
**Depends on**: Phase 1
**Requirements**: PROF-01, PROF-02, PROF-03, PROF-04, PROF-05, HOBB-01, HOBB-02, HOBB-03, HOBB-04, HOBB-05, HOBB-06, LOG-01, LOG-02, LOG-03, LOG-04, LOG-05, LOG-06, STAT-01, STAT-02, STAT-03, PRIV-02, PRIV-03
**Success Criteria** (what must be TRUE):
  1. User can create profile with username, bio, and avatar
  2. User can view and edit their own profile
  3. User can create hobbies with tracking type (time or quantity) and goal
  4. User can create log entries with value, notes, and photos
  5. User can see progress toward goals with stats (total, count, history)
  6. User can only modify their own hobbies and logs (enforced by RLS)
**Plans**: 5 plans

Plans:
- [x] 02-01-PLAN.md — Infrastructure (storage utilities, form components, storage buckets)
- [x] 02-02-PLAN.md — Profile feature (service, hooks, screens for view/edit profile)
- [x] 02-03-PLAN.md — Hobby feature (CRUD service, hooks, screens for hobby management)
- [x] 02-04-PLAN.md — Log & Stats feature (logging with photos, progress calculation)
- [x] 02-05-PLAN.md — Integration & Verification (tab navigation, end-to-end flow)

### Phase 3: Social Graph
**Goal**: Users can follow others and build their social network
**Depends on**: Phase 2
**Requirements**: SOCL-01, SOCL-02, SOCL-03, SOCL-04, SOCL-05
**Success Criteria** (what must be TRUE):
  1. User can search for other users by username
  2. User can follow and unfollow users
  3. User can view their followers list and following list
  4. User can view other users' profiles
**Plans**: 3 plans

Plans:
- [ ] 03-01-PLAN.md — Social feature module (service layer, query/mutation hooks)
- [ ] 03-02-PLAN.md — User search (search screen with debounced input, results list)
- [ ] 03-03-PLAN.md — Follow UI (follow button on profiles, followers/following lists)

### Phase 4: Activity Feed
**Goal**: Users can see friends' progress in a privacy-aware activity feed
**Depends on**: Phase 3
**Requirements**: FEED-01, FEED-02, FEED-03, FEED-04, PRIV-04
**Success Criteria** (what must be TRUE):
  1. User can view feed of followed users' logs (most recent first)
  2. Feed displays log details (user, hobby, value, notes, photo)
  3. Feed loads more items on scroll (pagination)
  4. Logs are only visible to owner or owner's followers (enforced by RLS)
**Plans**: TBD

Plans:
- [ ] 04-01: [Plan pending]

## Progress

**Execution Order:**
Phases execute in numeric order: 1 -> 2 -> 3 -> 4

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation & Auth | 3/3 | Complete | 2026-01-28 |
| 2. Core Tracking | 5/5 | Complete | 2026-01-28 |
| 3. Social Graph | 0/3 | Ready | - |
| 4. Activity Feed | 0/TBD | Not started | - |

---
*Roadmap created: 2026-01-28*
*Depth: quick (3-5 phases)*
*Coverage: 37/37 v1 requirements mapped*
