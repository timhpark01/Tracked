# Domain Pitfalls: Mobile Social Network

**Domain:** Hobby tracking social network (mobile-first)
**Stack:** Expo + NativeWind + Supabase + TanStack Query
**Researched:** 2026-01-28
**Confidence:** HIGH (verified with official documentation)

---

## Critical Pitfalls

Mistakes that cause rewrites, security breaches, or major production issues.

### Pitfall 1: Row Level Security Not Enabled

**What goes wrong:** Database is completely exposed to public. Anyone can read/write/delete all data.

**Why it happens:** RLS is disabled by default in Supabase. Developers skip it during prototyping, forget to enable before launch.

**Consequences:**
- Complete data breach
- In January 2025, 170+ Lovable apps exposed databases (CVE-2025-48757)
- 83% of exposed Supabase databases involve RLS misconfigurations

**Prevention:**
1. Enable RLS from day one: `ALTER TABLE table_name ENABLE ROW LEVEL SECURITY`
2. Create policies immediately after table creation
3. Never use `service_role` key in client code
4. Add to PR checklist: "Does this table have RLS enabled?"

**Detection:**
- Run query: `SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename NOT IN (SELECT tablename FROM pg_policies);`
- Empty result = all tables protected
- Results = unprotected tables

**Phase mapping:** Foundation phase (database setup) - block deployment without RLS

---

### Pitfall 2: RLS Without Indexes (99.94% Performance Loss)

**What goes wrong:** Queries with RLS policies take 170ms instead of <0.1ms. App feels sluggish.

**Why it happens:** Developers create policies like `auth.uid() = user_id` but forget to index the `user_id` column.

**Consequences:**
- Feed loads slowly (2-3 seconds instead of instant)
- User frustration, abandonment
- Database CPU spikes under load

**Prevention:**
1. Index every column used in RLS policies:
   ```sql
   CREATE INDEX idx_posts_user_id ON posts(user_id);
   CREATE INDEX idx_follows_follower_id ON follows(follower_id);
   CREATE INDEX idx_follows_following_id ON follows(following_id);
   ```
2. Use `EXPLAIN ANALYZE` to verify index usage
3. Wrap functions in SELECT for caching: `(select auth.uid()) = user_id`
4. Specify role in policies: `TO authenticated` (prevents unnecessary anonymous checks)

**Detection:**
- Run `EXPLAIN ANALYZE` on queries
- Look for "Seq Scan" (bad) vs "Index Scan" (good)
- Execution time >10ms = needs investigation

**Phase mapping:** Performance optimization phase - add monitoring before public launch

**Source:** [Supabase RLS Performance](https://supabase.com/docs/guides/database/postgres/row-level-security)

---

### Pitfall 3: N+1 Query Problem in Social Feeds

**What goes wrong:** Feed with 20 posts makes 60+ database queries (1 for posts + 20 for user data + 20 for like counts + 20 for images).

**Why it happens:** Fetching posts, then looping to fetch related data for each post individually.

**Consequences:**
- Feed takes 3-5 seconds to load
- Database connection pool exhaustion
- High latency even with good internet
- Poor user experience

**Prevention:**
1. Use JOIN or aggregate queries:
   ```sql
   SELECT posts.*,
          users.username, users.avatar,
          COUNT(likes.id) as like_count,
          (SELECT COUNT(*) FROM comments WHERE post_id = posts.id) as comment_count
   FROM posts
   LEFT JOIN users ON posts.user_id = users.id
   LEFT JOIN likes ON posts.id = likes.post_id
   GROUP BY posts.id, users.id
   ORDER BY posts.created_at DESC
   LIMIT 20;
   ```
2. With TanStack Query, use single query with joins, not multiple queries
3. Denormalize counts (store `like_count` on posts table, update with triggers)
4. Consider materialized views for complex feed generation

**Detection:**
- Enable Supabase query logging
- Count queries per feed load (should be 1-3, not 20+)
- Network tab shows many simultaneous requests

**Phase mapping:** Feed implementation phase - design schema with joins in mind from start

**Source:** [Social Media Feed System Design](https://javatechonline.com/social-media-feed-system-design/)

---

### Pitfall 4: Realtime Subscriptions Don't Scale

**What goes wrong:** Using Postgres Changes subscriptions for every user's feed. Database becomes bottleneck at scale.

**Why it happens:** Realtime looks easy for live updates, developers subscribe to everything.

**Consequences:**
- Database changes processed on single thread
- 100 subscribers = 100 RLS checks per insert
- Compute upgrades don't help (single-threaded)
- Timeouts and delayed updates

**Prevention:**
1. **Don't use Postgres Changes for high-volume feeds**
2. Use Broadcast instead:
   ```typescript
   // Server processes new post, broadcasts to followers
   const channel = supabase.channel('feed')
   channel.broadcast('new_post', { post_id: 123 })

   // Clients subscribe to broadcast (no RLS checks)
   channel.on('broadcast', { event: 'new_post' }, (payload) => {
     queryClient.invalidateQueries(['feed'])
   })
   ```
3. Separate public table without RLS for realtime data
4. Use polling with TanStack Query for non-critical updates

**Detection:**
- Monitor database CPU (maxed on single core = bottleneck)
- Subscription delays >1 second
- Connection errors under load

**Phase mapping:** Realtime features phase - architect before implementing live updates

**Source:** [Supabase Realtime Benchmarks](https://supabase.com/docs/guides/realtime/benchmarks)

---

### Pitfall 5: Expo OTA Updates with Native Code Changes

**What goes wrong:** Push OTA update that requires new native dependency. App crashes for all users.

**Why it happens:** Misunderstanding OTA limitations - only JavaScript/assets update, not native code.

**Consequences:**
- Immediate app crash for entire user base
- Must wait for app store approval (days/weeks)
- User trust lost, bad reviews

**Prevention:**
1. Understand: OTA updates = JavaScript + assets ONLY
2. Native changes require new build + app store submission:
   - Adding new Expo module
   - Changing app.json config that affects native
   - Modifying Podfile or build.gradle
3. Document in PR template: "Does this require new build?"
4. Test OTA updates in staging environment first
5. Use EAS Update branches for safe rollouts

**Detection:**
- Review dependency changes in PR
- Check if new `expo install` was run
- Verify no `ios/` or `android/` folder changes

**Phase mapping:** Deployment phase - establish OTA vs native build decision tree

**Source:** [Expo OTA Updates](https://docs.expo.dev/deploy/send-over-the-air-updates/)

---

### Pitfall 6: User Metadata in RLS Policies

**What goes wrong:** RLS policy uses `auth.jwt()->>'user_metadata'`. Malicious user modifies their metadata to access others' data.

**Why it happens:** Assuming user_metadata is secure because it's in JWT.

**Consequences:**
- Complete authorization bypass
- Users can access/modify others' data
- Security breach

**Prevention:**
1. **Never use `user_metadata` in RLS policies**
2. Use `raw_app_meta_data` instead (cannot be modified by user)
3. Store roles/permissions in separate `user_roles` table with RLS
4. Example:
   ```sql
   -- BAD: User can modify this
   CREATE POLICY "admin_policy" ON posts
   USING (auth.jwt()->>'user_metadata'->>'role' = 'admin');

   -- GOOD: Server-controlled
   CREATE POLICY "admin_policy" ON posts
   USING (auth.jwt()->>'app_metadata'->>'role' = 'admin');
   ```

**Detection:**
- Code review for `user_metadata` in SQL
- Security audit of all RLS policies

**Phase mapping:** Authentication phase - establish metadata usage patterns early

**Source:** [Supabase RLS Documentation](https://supabase.com/docs/guides/database/postgres/row-level-security)

---

## Moderate Pitfalls

Mistakes that cause delays, performance issues, or technical debt.

### Pitfall 7: TanStack Query Missing React Native Configuration

**What goes wrong:** App doesn't refetch when returning from background. Stale data shown.

**Why it happens:** TanStack Query's browser hooks don't work in React Native - need AppState and NetInfo.

**Consequences:**
- User sees old data after backgrounding app
- No auto-refetch on reconnect
- Confusing UX

**Prevention:**
1. Configure `onlineManager` with NetInfo:
   ```typescript
   import NetInfo from '@react-native-community/netinfo'
   import { onlineManager } from '@tanstack/react-query'

   onlineManager.setEventListener(setOnline => {
     return NetInfo.addEventListener(state => {
       setOnline(!!state.isConnected)
     })
   })
   ```
2. Configure `focusManager` with AppState:
   ```typescript
   import { AppState } from 'react-native'
   import { focusManager } from '@tanstack/react-query'

   focusManager.setEventListener(handleFocus => {
     const subscription = AppState.addEventListener('change', state => {
       handleFocus(state === 'active')
     })
     return () => subscription.remove()
   })
   ```

**Detection:**
- Test: background app, change data in DB, foreground app
- Expected: refetch happens
- Actual without config: stale data

**Phase mapping:** Initial setup phase - configure before building features

**Source:** [TanStack Query React Native](https://tanstack.com/query/latest/docs/framework/react/react-native)

---

### Pitfall 8: Screen-Level Query Refetching Performance

**What goes wrong:** Visiting multiple screens, then backgrounding app triggers refetch for ALL screens (10-12 queries at once).

**Why it happens:** Default TanStack Query behavior refetches all queries on app focus.

**Consequences:**
- Performance spike on app resume
- Wasted API calls
- Poor UX during multitasking

**Prevention:**
1. Use `useFocusEffect` from React Navigation:
   ```typescript
   import { useFocusEffect } from '@react-navigation/native'
   import { useCallback } from 'react'

   function useRefetchOnFocus(refetch) {
     useFocusEffect(
       useCallback(() => {
         refetch()
       }, [refetch])
     )
   }
   ```
2. Disable global refetchOnWindowFocus, enable per-screen:
   ```typescript
   // In QueryClient config
   const queryClient = new QueryClient({
     defaultOptions: {
       queries: {
         refetchOnWindowFocus: false, // Disable globally
       },
     },
   })

   // Enable per-screen
   const { data, refetch } = useQuery({
     queryKey: ['posts'],
     queryFn: fetchPosts,
     refetchOnWindowFocus: true, // Only for this screen
   })
   ```

**Detection:**
- Network monitoring shows burst of requests on app resume
- Multiple simultaneous query logs

**Phase mapping:** Navigation setup phase - configure before multi-screen app

**Source:** [TanStack Query Optimization for React Native](https://github.com/TanStack/query/discussions/6254)

---

### Pitfall 9: Large Image Uploads Without Compression

**What goes wrong:** Users upload 10MB photos. Feed is slow, users hit data caps, storage costs spike.

**Why it happens:** No client-side compression before upload.

**Consequences:**
- Feed takes forever to load
- High Supabase storage costs
- Poor experience on cellular
- User complaints about data usage

**Prevention:**
1. Use `react-native-compressor` or `expo-image-manipulator`:
   ```typescript
   import * as ImageManipulator from 'expo-image-manipulator'

   const compressedImage = await ImageManipulator.manipulateAsync(
     imageUri,
     [{ resize: { width: 1080 } }], // Max width
     { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
   )
   ```
2. Compress BEFORE upload, not after
3. Keep compression async (don't block UI)
4. Show progress indicator during compression
5. Target: <500KB per image for social feed

**Detection:**
- Monitor Supabase storage usage
- Check upload sizes in network tab
- User reports of slow uploads

**Phase mapping:** Image upload phase - implement compression from start, not retrofit

**Source:** [Mastering Media Uploads in React Native](https://dev.to/fasthedeveloper/mastering-media-uploads-in-react-native-images-videos-smart-compression-2026-guide-5g2i)

---

### Pitfall 10: FlatList Without Optimization Props

**What goes wrong:** Feed with 100+ items lags during scroll. Memory usage grows unbounded.

**Why it happens:** Missing critical FlatList performance props.

**Consequences:**
- Janky scrolling
- App crashes on long feeds
- Poor UX

**Prevention:**
1. Always set these FlatList props:
   ```typescript
   <FlatList
     data={posts}
     renderItem={renderPost}
     keyExtractor={(item) => item.id}
     // Critical performance props
     removeClippedSubviews={true}
     maxToRenderPerBatch={10}
     updateCellsBatchingPeriod={50}
     initialNumToRender={10}
     windowSize={10}
     getItemLayout={(data, index) => ({
       length: ITEM_HEIGHT,
       offset: ITEM_HEIGHT * index,
       index,
     })}
   />
   ```
2. Use `React.memo` for row components
3. Avoid anonymous functions in renderItem
4. Use fixed-height items when possible

**Detection:**
- Profiler shows slow renders
- Memory grows during scroll
- Frame drops in scroll

**Phase mapping:** Feed UI phase - implement from start, hard to retrofit

**Source:** [React Native Best Practices 2026](https://www.esparkinfo.com/blog/react-native-best-practices)

---

### Pitfall 11: Inline Styles and Anonymous Functions

**What goes wrong:** Feed re-renders excessively. Every scroll causes style recalculation.

**Why it happens:** Using inline styles or arrow functions in render.

**Consequences:**
- Janky UI
- Wasted CPU
- Battery drain

**Prevention:**
1. Extract styles to StyleSheet.create or NativeWind classes:
   ```typescript
   // BAD
   <View style={{ padding: 10, backgroundColor: 'white' }} />

   // GOOD with NativeWind
   <View className="p-2.5 bg-white" />

   // GOOD with StyleSheet
   const styles = StyleSheet.create({
     container: { padding: 10, backgroundColor: 'white' }
   })
   <View style={styles.container} />
   ```
2. No anonymous functions in props:
   ```typescript
   // BAD
   <TouchableOpacity onPress={() => handlePress(item.id)} />

   // GOOD
   const handlePressCallback = useCallback(() => {
     handlePress(item.id)
   }, [item.id])
   <TouchableOpacity onPress={handlePressCallback} />
   ```

**Detection:**
- React DevTools Profiler shows excessive renders
- Component re-renders on every parent update

**Phase mapping:** Code review standards - enforce from start

**Source:** [React Native Development Best Practices](https://www.yesitlabs.com/react-native-app-development-best-practices-and-common-mistakes/)

---

### Pitfall 12: Database Schema Not Optimized for Feed Generation

**What goes wrong:** Feed query takes 5 seconds. Complex joins fail at scale.

**Why it happens:** Normalized schema without denormalization for read-heavy patterns.

**Consequences:**
- Slow feeds
- Database overload
- Poor scalability

**Prevention:**
1. Denormalize counts:
   ```sql
   -- Add to posts table
   ALTER TABLE posts ADD COLUMN like_count INTEGER DEFAULT 0;
   ALTER TABLE posts ADD COLUMN comment_count INTEGER DEFAULT 0;

   -- Update with triggers
   CREATE TRIGGER increment_like_count
   AFTER INSERT ON likes
   FOR EACH ROW
   EXECUTE FUNCTION increment_post_like_count();
   ```
2. Consider feed table for pre-computed feeds:
   ```sql
   CREATE TABLE feed_items (
     id UUID PRIMARY KEY,
     user_id UUID REFERENCES users(id),
     post_id UUID REFERENCES posts(id),
     created_at TIMESTAMPTZ,
     ranking_score FLOAT
   );
   CREATE INDEX idx_feed_user_created ON feed_items(user_id, created_at DESC);
   ```
3. For followers, index both directions:
   ```sql
   CREATE INDEX idx_follows_follower ON follows(follower_id);
   CREATE INDEX idx_follows_following ON follows(following_id);
   ```

**Detection:**
- EXPLAIN shows slow query plans
- Feed queries >500ms

**Phase mapping:** Database design phase - plan schema for read patterns upfront

**Source:** [Database Schema for Social Media App](https://thisisglance.com/learning-centre/how-do-i-design-a-database-structure-for-a-social-media-app)

---

### Pitfall 13: NativeWind Conditional Styles Missing Base Case

**What goes wrong:** Text appears invisible in light mode because only dark mode style defined.

**Why it happens:** React Native can't cascade styles. Must declare all variants.

**Consequences:**
- UI bugs in light mode
- Accessibility issues
- User confusion

**Prevention:**
1. Always provide base case:
   ```typescript
   // BAD
   <Text className="dark:text-white" />

   // GOOD
   <Text className="text-black dark:text-white" />
   ```
2. For conditional logic, declare all states:
   ```typescript
   // BAD
   <View className={isActive ? 'bg-blue-500' : ''} />

   // GOOD
   <View className={isActive ? 'bg-blue-500' : 'bg-gray-200'} />
   ```

**Detection:**
- Visual QA in both light/dark modes
- Switch theme and check all screens

**Phase mapping:** Styling standards - establish pattern early

**Source:** [NativeWind Documentation](https://www.nativewind.dev/docs/core-concepts/differences)

---

### Pitfall 14: Missing Migration Strategy for Schema Changes

**What goes wrong:** Schema change in dev, deploy to prod, data inconsistency breaks app.

**Why it happens:** Manual schema changes without version control.

**Consequences:**
- Production database out of sync
- App crashes
- Data corruption

**Prevention:**
1. Use Supabase migrations:
   ```bash
   supabase migration new add_post_visibility
   # Edit migration file
   supabase db push
   ```
2. Version control all migrations
3. Test migrations in staging first
4. Never commit production credentials
5. Separate Supabase projects per environment

**Detection:**
- Schema mismatch errors in production
- Queries fail after deployment

**Phase mapping:** CI/CD setup phase - establish migration workflow before multi-env

**Source:** [Supabase Best Practices](https://www.leanware.co/insights/supabase-best-practices)

---

## Minor Pitfalls

Mistakes that cause annoyance but are fixable.

### Pitfall 15: Expo Build Size Not Optimized

**What goes wrong:** App is 50MB when it should be 15MB. Users on limited data plans skip download.

**Why it happens:** Including all assets, not using app.json optimization flags.

**Consequences:**
- Lower install conversion
- Bad first impression
- Storage complaints

**Prevention:**
1. Use asset optimization in app.json:
   ```json
   {
     "expo": {
       "assetBundlePatterns": ["assets/images/*"],
       "ios": {
         "supportsTablet": false // If not needed
       },
       "android": {
         "enableProguardInReleaseBuilds": true,
         "enableShrinkResourcesInReleaseBuilds": true
       }
     }
   }
   ```
2. Use WebP for images
3. Remove unused assets
4. Use EAS Build to analyze size

**Detection:**
- Download app, check size in App Store listing
- Compare to competitors

**Phase mapping:** Pre-launch optimization

**Source:** [Expo FAQ](https://docs.expo.dev/faq/)

---

### Pitfall 16: Not Handling Offline State in UI

**What goes wrong:** User loses connection, app shows loading spinner forever.

**Why it happens:** No offline detection or error states.

**Consequences:**
- Confusing UX
- User thinks app is broken
- Frustration

**Prevention:**
1. Use NetInfo to detect offline:
   ```typescript
   import NetInfo from '@react-native-community/netinfo'

   const [isOffline, setIsOffline] = useState(false)

   useEffect(() => {
     const unsubscribe = NetInfo.addEventListener(state => {
       setIsOffline(!state.isConnected)
     })
     return () => unsubscribe()
   }, [])

   if (isOffline) {
     return <OfflineBanner />
   }
   ```
2. TanStack Query handles this with `onlineManager` (see Pitfall 7)
3. Show clear offline indicator
4. Queue mutations for when back online

**Detection:**
- Test with airplane mode
- Check if app shows appropriate message

**Phase mapping:** Error handling phase

---

### Pitfall 17: React Native Text Doesn't Inherit Styles

**What goes wrong:** Wrapping Text in View with className doesn't style the text.

**Why it happens:** React Native doesn't support CSS cascade.

**Consequences:**
- Unexpected styling
- Debugging frustration
- Inconsistent UI

**Prevention:**
1. Style Text components directly:
   ```typescript
   // BAD
   <View className="text-white">
     <Text>Hello</Text> // Won't be white
   </View>

   // GOOD
   <View>
     <Text className="text-white">Hello</Text>
   </View>
   ```
2. Create text wrapper components if needed:
   ```typescript
   const StyledText = ({ className, children }) => (
     <Text className={`text-base ${className}`}>{children}</Text>
   )
   ```

**Detection:**
- Visual bugs where text doesn't match expected style

**Phase mapping:** Component library phase - establish patterns

**Source:** [NativeWind Platform Differences](https://www.nativewind.dev/docs/core-concepts/differences)

---

### Pitfall 18: Forgetting to Clean Up Subscriptions

**What goes wrong:** Memory leaks from uncleaned Supabase subscriptions.

**Why it happens:** Setting up subscription without return cleanup.

**Consequences:**
- Memory grows over time
- App crashes after extended use
- Multiple duplicate subscriptions

**Prevention:**
1. Always return cleanup function:
   ```typescript
   useEffect(() => {
     const channel = supabase
       .channel('posts')
       .on('postgres_changes',
         { event: 'INSERT', schema: 'public', table: 'posts' },
         handleNewPost
       )
       .subscribe()

     return () => {
       supabase.removeChannel(channel)
     }
   }, [])
   ```
2. Use unique channel names
3. Monitor subscription count in dev

**Detection:**
- Profiler shows growing memory
- Multiple subscription events firing

**Phase mapping:** Realtime implementation

**Source:** [Supabase Realtime Troubleshooting](https://supabase.com/docs/guides/realtime/troubleshooting)

---

### Pitfall 19: Using Expo Go for Production Testing

**What goes wrong:** App works in Expo Go, crashes in production build.

**Why it happens:** Expo Go has different runtime environment than standalone builds.

**Consequences:**
- False confidence
- Production bugs
- Emergency patches

**Prevention:**
1. Use development builds for testing:
   ```bash
   eas build --profile development --platform ios
   ```
2. Test on actual devices with production builds
3. Use EAS Build preview builds for QA
4. Never rely on Expo Go for final testing

**Detection:**
- Behavior differs between Expo Go and build

**Phase mapping:** Testing strategy phase

**Source:** [Expo FAQ](https://docs.expo.dev/faq/)

---

### Pitfall 20: Throttling Issues with High-Follower Accounts

**What goes wrong:** Celebrity user with 100k followers posts. Database writes throttle, followers don't see post.

**Why it happens:** Write amplification - 1 post = 100k feed_items writes.

**Consequences:**
- Inconsistent feeds
- Database throttling
- Poor UX for popular users

**Prevention:**
1. Use hybrid feed model:
   - Pre-compute feeds for users with <1000 followers
   - Pull-based for celebrity accounts (query at view time)
   ```sql
   -- Check follower count before fan-out
   SELECT COUNT(*) FROM follows WHERE following_id = $1;
   -- If >1000, don't fan out to feed_items
   ```
2. Use pagination and lazy loading
3. Consider Redis for hot data

**Detection:**
- Monitor write throughput
- Test with high-follower test accounts

**Phase mapping:** Scale testing phase - before public launch

**Source:** [Social Network Schema Design](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/data-modeling-schema-social-network.html)

---

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Mitigation |
|-------------|---------------|------------|
| Foundation Setup | RLS not enabled (#1) | Block deployment without RLS verification |
| Authentication | User metadata in policies (#6) | Code review checklist for RLS policies |
| Database Schema | Missing indexes (#2), N+1 queries (#3) | EXPLAIN ANALYZE all queries before merge |
| Feed Implementation | Schema not optimized (#12) | Design with denormalization from start |
| Realtime Features | Postgres Changes at scale (#4) | Use Broadcast for high-volume updates |
| Image Uploads | No compression (#9) | Implement compression before upload feature |
| Navigation | Screen refetch performance (#8) | Configure focus handling in nav setup |
| Deployment | OTA with native changes (#5) | PR template: "Requires new build?" |
| Performance | FlatList not optimized (#10) | Component review before production |
| Testing | Using Expo Go for prod testing (#19) | Development builds mandatory for QA |

---

## Summary: Top 5 Critical Actions

1. **Enable RLS + indexes from day one** - Prevents security breach and performance issues
2. **Configure TanStack Query for React Native** - App state and network handling
3. **Use Broadcast, not Postgres Changes for feeds** - Avoid single-threaded bottleneck
4. **Compress images before upload** - Save bandwidth, storage, user experience
5. **Understand OTA vs native builds** - Prevent production crashes

---

## Sources

**High Confidence (Official Documentation):**
- [Supabase Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [Supabase Realtime Benchmarks](https://supabase.com/docs/guides/realtime/benchmarks)
- [Expo FAQ](https://docs.expo.dev/faq/)
- [Expo OTA Updates](https://docs.expo.dev/deploy/send-over-the-air-updates/)
- [NativeWind Documentation](https://www.nativewind.dev/docs)

**Medium Confidence (Community + Multiple Sources):**
- [React Native Best Practices 2026](https://www.esparkinfo.com/blog/react-native-best-practices)
- [TanStack Query React Native Discussions](https://github.com/TanStack/query/discussions/6254)
- [Social Media Feed System Design](https://javatechonline.com/social-media-feed-system-design/)
- [Mastering Media Uploads in React Native](https://dev.to/fasthedeveloper/mastering-media-uploads-in-react-native-images-videos-smart-compression-2026-guide-5g2i)
- [Supabase Best Practices](https://www.leanware.co/insights/supabase-best-practices)
- [Database Schema for Social Media](https://thisisglance.com/learning-centre/how-do-i-design-a-database-structure-for-a-social-media-app)

**Low Confidence (Single Source, Needs Validation):**
- Lovable CVE-2025-48757 statistics (mentioned in web search, not independently verified)
- Specific throttling thresholds (1000 WCU) from AWS DynamoDB docs, may differ in Supabase
