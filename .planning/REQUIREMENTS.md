# Requirements: Tracked

**Defined:** 2026-01-28
**Core Value:** Progress visibility — users can see their own growth over time and celebrate milestones

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### Authentication

- [ ] **AUTH-01**: User can sign up with email and password
- [ ] **AUTH-02**: User can log in with existing credentials
- [ ] **AUTH-03**: User session persists across app restarts
- [ ] **AUTH-04**: User can log out from any screen

### Profiles

- [ ] **PROF-01**: User can create profile with unique username
- [ ] **PROF-02**: User can upload avatar image
- [ ] **PROF-03**: User can write bio (max 500 chars)
- [ ] **PROF-04**: User can view other users' profiles
- [ ] **PROF-05**: User can edit their own profile

### Hobbies

- [ ] **HOBB-01**: User can create hobby with title
- [ ] **HOBB-02**: User can set tracking type (time or quantity)
- [ ] **HOBB-03**: User can set goal total for hobby
- [ ] **HOBB-04**: User can edit hobby details
- [ ] **HOBB-05**: User can delete hobby (and associated logs)
- [ ] **HOBB-06**: User can view list of their hobbies

### Logging

- [ ] **LOG-01**: User can create log entry for a hobby
- [ ] **LOG-02**: User can enter value (minutes or units based on tracking type)
- [ ] **LOG-03**: User can add notes to log entry
- [ ] **LOG-04**: User can attach photo to log entry
- [ ] **LOG-05**: User can view their log history per hobby
- [ ] **LOG-06**: User can delete log entry

### Stats

- [ ] **STAT-01**: User can see total progress toward hobby goal
- [ ] **STAT-02**: User can see log count per hobby
- [ ] **STAT-03**: User can see progress over time (list view)

### Social - Follows

- [ ] **SOCL-01**: User can follow other users
- [ ] **SOCL-02**: User can unfollow users
- [ ] **SOCL-03**: User can view their followers list
- [ ] **SOCL-04**: User can view their following list
- [ ] **SOCL-05**: User can search for users by username

### Social - Feed

- [ ] **FEED-01**: User can view activity feed of followed users' logs
- [ ] **FEED-02**: Feed displays log with user info, hobby, value, notes, photo
- [ ] **FEED-03**: Feed loads more items on scroll (pagination)
- [ ] **FEED-04**: Feed shows most recent logs first

### Privacy

- [ ] **PRIV-01**: Profiles are public (viewable by anyone)
- [ ] **PRIV-02**: User can only insert/update/delete their own hobbies
- [ ] **PRIV-03**: User can only insert/update/delete their own logs
- [ ] **PRIV-04**: Logs are viewable by owner OR followers of owner

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Groups

- **GRP-01**: User can create interest-based group
- **GRP-02**: User can join existing groups
- **GRP-03**: User can view group activity feed
- **GRP-04**: User can leave groups
- **GRP-05**: Group creator can manage group settings

### Notifications

- **NOTF-01**: User receives notification when someone follows them
- **NOTF-02**: User can view notification history
- **NOTF-03**: Push notifications for new followers

### Advanced Stats

- **ADVS-01**: Progress visualization graphs
- **ADVS-02**: Streaks and milestone celebrations
- **ADVS-03**: Weekly/monthly summaries

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Real-time chat | High complexity, not core to progress tracking |
| Video uploads | Storage/bandwidth costs, defer to future |
| OAuth login | Email/password sufficient for v1 |
| Web version | Mobile-first focus for v1 |
| Comments on logs | Social complexity, assess need after launch |
| Like/react on logs | Social complexity, assess need after launch |
| Algorithmic feed | Need user data first, start with chronological |
| AI insights | Need usage data first, defer to post-v2 |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| AUTH-01 | Phase 1 | Pending |
| AUTH-02 | Phase 1 | Pending |
| AUTH-03 | Phase 1 | Pending |
| AUTH-04 | Phase 1 | Pending |
| PRIV-01 | Phase 1 | Pending |
| PROF-01 | Phase 2 | Pending |
| PROF-02 | Phase 2 | Pending |
| PROF-03 | Phase 2 | Pending |
| PROF-04 | Phase 2 | Pending |
| PROF-05 | Phase 2 | Pending |
| HOBB-01 | Phase 2 | Pending |
| HOBB-02 | Phase 2 | Pending |
| HOBB-03 | Phase 2 | Pending |
| HOBB-04 | Phase 2 | Pending |
| HOBB-05 | Phase 2 | Pending |
| HOBB-06 | Phase 2 | Pending |
| LOG-01 | Phase 2 | Pending |
| LOG-02 | Phase 2 | Pending |
| LOG-03 | Phase 2 | Pending |
| LOG-04 | Phase 2 | Pending |
| LOG-05 | Phase 2 | Pending |
| LOG-06 | Phase 2 | Pending |
| STAT-01 | Phase 2 | Pending |
| STAT-02 | Phase 2 | Pending |
| STAT-03 | Phase 2 | Pending |
| PRIV-02 | Phase 2 | Pending |
| PRIV-03 | Phase 2 | Pending |
| SOCL-01 | Phase 3 | Pending |
| SOCL-02 | Phase 3 | Pending |
| SOCL-03 | Phase 3 | Pending |
| SOCL-04 | Phase 3 | Pending |
| SOCL-05 | Phase 3 | Pending |
| FEED-01 | Phase 4 | Pending |
| FEED-02 | Phase 4 | Pending |
| FEED-03 | Phase 4 | Pending |
| FEED-04 | Phase 4 | Pending |
| PRIV-04 | Phase 4 | Pending |

**Coverage:**
- v1 requirements: 37 total
- Mapped to phases: 37 (100%)
- Unmapped: 0

---
*Requirements defined: 2026-01-28*
*Last updated: 2026-01-28 after roadmap creation*
