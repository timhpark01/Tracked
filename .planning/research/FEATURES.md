# Feature Landscape: Hobby Tracking Social Network

**Domain:** Mobile-first social network for hobby progress tracking
**Researched:** 2026-01-28
**Confidence:** MEDIUM (based on multiple established competitors with verified patterns)

## Table Stakes

Features users expect from day one. Missing any of these = product feels incomplete.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Activity tracking with manual entry | All competitors (Strava, Letterboxd, Goodreads, Duolingo) allow users to log activities manually | Low | Core value prop - must record progress |
| User profiles with basic info | Standard across all social tracking apps; users expect identity expression | Low | Name, bio, profile photo, stats summary |
| Activity feed (chronological) | Users expect to see their own history and friends' activities | Medium | Start simple (chronological), defer algorithmic ranking |
| Follow/follower system | Core social graph - how users connect with each other | Medium | Asymmetric follow model (like Twitter/Strava) standard |
| Basic activity privacy controls | Users need to control who sees their progress | Medium | Public/Private/Followers-only at minimum |
| Activity stats & history | Users expect to see their progress over time | Medium | Total count, current streaks, date ranges |
| Photo attachments to logs | Visual progress is 35% more motivating (research finding) | Medium | Critical for fitness, crafts, cooking, etc. |
| Search for users | Users need to find friends to follow | Low | Basic username/name search |
| Notifications for social interactions | Users expect alerts for follows, likes, comments | Medium | Push notifications for engagement |
| Mobile-optimized experience | 84% of social fitness app users prioritize mobile experience | High | Must work seamlessly on iOS/Android |

## Differentiators

Features that set product apart from competitors. Not expected, but highly valued.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Multi-hobby tracking in one app | Hobbyverse model - track all hobbies in unified experience | Medium | Unique vs single-hobby apps (Strava = fitness only, Letterboxd = movies only) |
| Flexible goal types (time/quantity/frequency) | Accommodates diverse hobby types (read 12 books vs run 3x/week vs practice 100 hours) | Medium | More flexible than rigid "daily streak" model |
| Group challenges with shared goals | 65% more likely to achieve goals with social accountability | High | Strava's challenge model - groups compete or collaborate |
| Progress visualization graphs | Users want to "see" growth patterns over time | Medium | StoryGraph's detailed stats model - mood, pace, patterns |
| Milestone celebrations | Automatic recognition of achievements (50th log, 1-year streak) | Low | Builds intrinsic motivation without rigid streaks |
| Interest-based discovery | Find hobbyists with similar interests, not just friends | Medium | Letterboxd's list-based discovery model |
| Activity templates for common hobbies | Reduce friction for new users | Medium | Pre-configured hobby types with relevant metrics |
| AI-powered insights (later phase) | "You're most consistent on Tuesdays" or "Similar users enjoy X hobby" | High | Defer to post-MVP - only 15-20% retention lift, needs fundamentals first |

## Anti-Features

Features to explicitly NOT build. Common mistakes in this domain.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| Mandatory daily streaks | Triggers guilt, stress, demotivation when broken; users avoid app after breaking streak | Optional streak tracking + "streak freeze" recovery feature + milestone-based celebration |
| Algorithmic feed from day one | Complex to build, needs ML/data, can feel manipulative | Chronological feed initially; add algorithmic ranking only when data supports it |
| Calorie/nutrition tracking | Creates shame, guilt, obsessive behaviors; focus on numbers not wellbeing | Focus on positive progress, not restrictive metrics |
| Everything library (workouts, content, courses) | Building content library without habit loop = "beautifully designed ghost town" | Build habit loop first (log → feedback → motivation), defer content library |
| Public-by-default sharing | Privacy concerns are deal-breakers in 2026; users choose apps based on privacy | Private-by-default with explicit opt-in to public sharing |
| Gamification without substance | Points/badges feel hollow without meaningful progress | Gamify actual achievements (milestones, consistency), not vanity metrics |
| Forced social broadcasting | Users want control over what's shared and where | Privacy-first controls, no auto-posting to external networks |
| Complex RPG mechanics | Habitica model: too complex/distracting for users wanting simple tracking | Keep gamification lightweight (streaks, milestones, simple badges) |
| Social comparison leaderboards | Triggers anxiety, depressive symptoms, demotivation for average users | Small group challenges or personal bests, not global rankings |
| AI before fundamentals | Adding AI without proven core loop wastes resources | Prove manual tracking loop works, add AI insights later |

## Feature Dependencies

```
Core Dependencies (must build in order):
User accounts → Profiles → Hobby CRUD → Activity logging

Social Layer (requires core):
Profiles → Follow system → Activity feed → Notifications
Activity logging → Feed visibility

Progress Tracking (requires logging):
Activity logging → Stats calculation → Progress visualization
Activity logging → Streaks/milestones → Celebrations

Group Features (requires social layer):
Follow system → Groups → Group challenges
Activity logging → Challenge participation

Photo Features (parallel track):
Activity logging → Photo upload → Photo display in feed
Photos can be MVP or phase 2 depending on priority

Advanced Features (require data):
Activity logging (3+ months data) → AI insights
Follow system + logging → Interest-based discovery
```

## Feature Complexity Deep Dive

### Low Complexity (1-2 weeks each)
- Hobby CRUD (create, edit, delete hobbies)
- Basic profile (name, bio, photo)
- User search by username
- Milestone badges (automatic on reaching thresholds)

### Medium Complexity (2-4 weeks each)
- Activity logging with flexible goal types
- Follow/follower system
- Chronological activity feed
- Privacy controls per activity
- Stats dashboard (counts, streaks, graphs)
- Photo upload and display
- Push notifications

### High Complexity (4-8 weeks each)
- Mobile app optimization (native or high-quality PWA)
- Group challenges with shared goals
- Real-time notifications
- Interest-based discovery algorithm
- AI-powered insights
- Performance at scale (10K+ users)

## MVP Recommendation

For MVP (first 3 months), prioritize:

1. **Core tracking loop** (Low complexity)
   - User accounts + profiles
   - Hobby CRUD
   - Activity logging with basic goal types (time/quantity)
   - Personal stats view

2. **Social foundation** (Medium complexity)
   - Follow/follower system
   - Chronological activity feed
   - Basic privacy controls (public/private toggle)
   - Follow notifications

3. **One differentiator** (Medium complexity)
   - Photo attachments to logs (visual progress is 35% more motivating)
   - OR multi-hobby tracking (if single-hobby MVP seems limiting)

### Defer to Post-MVP

- **Groups & challenges** (High complexity, requires active user base first)
  - Need critical mass of users for groups to be valuable
  - Challenge feature needs proven engagement loop

- **Advanced progress visualization** (Medium complexity, needs data)
  - Fancy graphs require 3+ months of user data to be meaningful
  - Start with simple stats (count, current streak)

- **AI insights** (High complexity, needs ML + data)
  - Quote from research: "Adding AI before fundamentals work is backwards"
  - Only 15-20% retention lift; focus on core loop first

- **Algorithmic feed** (High complexity, needs ML + usage data)
  - Chronological feed is simpler and expected
  - Algorithm only valuable when you have engagement data to optimize

- **Streak freeze / recovery mechanics** (Low complexity, but not critical for MVP)
  - Important for retention but not needed to prove core concept
  - Add after MVP proves users engage with basic streaks

## Feature Prioritization Framework

For each proposed feature, ask:

1. **Does it serve the core loop?** (Log activity → See progress → Feel motivated → Log again)
2. **Is it table stakes?** (Will users reject the product without it?)
3. **Can we build it simply?** (MVP should feel complete, not half-baked)
4. **Does it need data first?** (Insights require history; defer if so)
5. **Is it privacy-respecting?** (2026 users choose apps based on privacy)

## Platform-Specific Considerations

### Mobile-First (Highest Priority)
- Quick logging (< 30 seconds to record activity)
- Offline-first architecture (log without connectivity)
- Photo capture from camera
- Push notifications
- Smooth scrolling feed

### Web (Secondary)
- Full-featured experience for desktop users
- Easier for detailed stats viewing
- Better for discovery/exploration
- Simpler for initial development

## Phased Rollout Strategy

**Phase 1: Solo Tracking (Weeks 1-4)**
- Prove logging loop works
- User can track progress alone
- Build habit without social pressure

**Phase 2: Social Foundation (Weeks 5-8)**
- Add follow system
- Enable activity feed
- Basic notifications

**Phase 3: Visual Progress (Weeks 9-12)**
- Photo uploads
- Stats dashboards
- Progress graphs

**Phase 4: Community (Post-MVP)**
- Groups
- Challenges
- Discovery features

**Phase 5: Intelligence (Post-MVP + data)**
- AI insights
- Personalized recommendations
- Algorithmic feed

## Sources

Confidence levels indicated below:

**HIGH Confidence (Multiple sources + established patterns):**
- [Strava press releases - Feature launches 2026](https://press.strava.com/articles/strava-adds-new-functionality-and-feature-improvements-for-winter-activities)
- [Letterboxd feature overview](https://letterboxd.com/welcome/)
- [Goodreads social features (Wikipedia)](https://en.wikipedia.org/wiki/Goodreads)
- [Duolingo gamification research](https://www.strivecloud.io/blog/gamification-examples-boost-user-retention-duolingo)

**MEDIUM Confidence (Industry reports + multiple WebSearch sources agreeing):**
- [Niche social apps comparison - Boston Globe](https://www.bostonglobe.com/2025/11/01/business/strava-letterboxd-niche-social-media/)
- [Strava and Letterboxd surge - Bloomberg](https://www.bloomberg.com/news/articles/2024-08-31/strava-and-letterboxd-surge-as-users-crave-social-media-refuge)
- [Hobby tracking app features - Hobbyverse](https://hobbyverse.app/)
- [User expectations for mobile apps 2026](https://www.dotcominfoway.com/blog/must-have-mobile-app-features-users-will-expect-in-2026/)
- [Social accountability research - 65% stat](https://www.fitbudd.com/post/best-app-for-fitness-challenges-guide)
- [Visual progress tracking - 35% stat](https://www.fitbudd.com/academy/why-progress-photos-matter-in-fitness-and-the-best-apps-to-track-them)

**MEDIUM Confidence (Anti-patterns based on 2026 research):**
- [Fitness app mistakes to avoid](https://www.resourcifi.com/fitness-app-development-mistakes-avoid/)
- [Negative impacts of fitness tracking](https://www.insideprecisionmedicine.com/topics/precision-medicine/fitness-apps-can-have-a-negative-impact-on-users/)
- [Dark side of fitness trackers - mental health](https://hupcfl.com/the-hidden-costs-of-fitness-trackers-mental-health-risks-emerging-in-2025/)
- [Study on fitness app psychological consequences](https://www.news-medical.net/news/20251022/Study-reveals-the-negative-behavioral-and-psychological-consequences-of-fitness-apps.aspx)

**Technical patterns (HIGH confidence):**
- [Social feed system design](https://javatechonline.com/social-media-feed-system-design/)
- [Scalable news feed architecture](https://blog.algomaster.io/p/designing-a-scalable-news-feed-system)
- [Instagram system design](https://www.geeksforgeeks.org/system-design/design-instagram-a-system-design-interview-question/)

**Gamification research (HIGH confidence):**
- [Streaks and retention - Forrester 2024](https://www.plotline.so/blog/streaks-for-gamification-in-mobile-apps)
- [Habit formation research - Stanford BJ Fogg](https://successknocks.com/best-habit-tracking-apps-for-2026/)
- [Duolingo engagement metrics](https://www.orizon.co/blog/duolingos-gamification-secrets)
