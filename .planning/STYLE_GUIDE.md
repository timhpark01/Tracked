# Gudos Style Guide

> Last updated: 2026-03-03
> Maintained by: `ui-design-guardian` agent (consistency enforcement) and `creative-ui-designer` agent (design direction)

This document is the single source of truth for visual design decisions in the Gudos app. All components should follow these patterns. The `ui-design-guardian` Claude agent uses this guide as its reference.

---

## Styling Approach

All components use **React Native `StyleSheet.create()`** — not NativeWind/Tailwind (despite earlier planning docs). Do not introduce NativeWind without team alignment. Animations use `react-native-reanimated`.

---

## Color Palette

### Backgrounds

| Token | Value | Usage |
|---|---|---|
| `bg-screen` | `#f3f4f6` | Screen/page background — creates contrast for elevated cards |
| `bg-card` | `#ffffff` | Card surfaces |
| `bg-subtle` | `#f9fafb` | Section backgrounds, stat cards |
| `bg-muted` | `#e5e7eb` | Tab tracks, skeleton bones, dividers |

### Text

| Token | Value | Usage |
|---|---|---|
| `text-primary` | `#111827` | Primary text — usernames, titles, values |
| `text-secondary` | `#374151` | Secondary text — descriptions, labels |
| `text-tertiary` | `#6b7280` | Tertiary — notes, captions, hints |
| `text-placeholder` | `#9ca3af` | Timestamps, placeholders, meta text |

### Borders & Dividers

| Token | Value | Usage |
|---|---|---|
| `border-default` | `#e5e7eb` | Standard borders |
| `border-subtle` | `#f3f4f6` | Subtle dividers within cards |

### Brand / Interactive

| Token | Value | Usage |
|---|---|---|
| `brand-primary` | `#007AFF` | Primary CTA buttons, links, active states, fallback accent |
| `brand-success` | `#34C759` | Success states |
| `brand-danger` | `#ef4444` | Destructive actions, errors |
| `brand-warning` | `#FF9500` | Warnings |

### Activity Accent Colors

Used for per-activity color coding across feed cards, log history, and project badges. Derived deterministically from the activity name using a hash → color index lookup. Fallback: `#007AFF`.

```ts
const ACCENT_COLORS = [
  '#007AFF', // blue
  '#34C759', // green
  '#FF9500', // orange
  '#AF52DE', // purple
  '#FF3B30', // red
  '#5AC8FA', // light blue
  '#FF6B6B', // coral
  '#4ECDC4', // teal
]

function getAccentColor(name: string): string {
  const hash = name.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)
  return ACCENT_COLORS[hash % ACCENT_COLORS.length]
}
```

Accent colors are applied at **15–22% opacity** for backgrounds/fills, and full opacity for accent bars and text labels.

---

## Typography

All text uses the system default (San Francisco on iOS). No custom fonts currently loaded.

| Role | Size | Weight | Color |
|---|---|---|---|
| Screen title | 28px | 700 (bold) | `#111827` |
| Section title | 18–20px | 600–700 | `#111827` |
| Card title / username | 15px | 700 | `#111827` |
| Body / activity name | 15–16px | 600 | `#1f2937` |
| Hero stat (value badge) | 15px | 800 | accent color |
| Secondary body | 14px | 400 | `#6b7280` |
| Note / caption | 14px | 400 | `#6b7280` |
| Timestamp / meta | 12px | 400 | `#9ca3af` |
| Small label / pill text | 11–12px | 600 | varies |

Letter spacing: use `-0.2` to `-0.3` on bold text ≥ 15px for a tighter, more refined feel.

---

## Spacing

Use multiples of 4px. Common values:

| Value | Common usage |
|---|---|
| 4px | Icon gaps, tight padding |
| 6px | Small element gaps |
| 8px | Pill padding, small gaps |
| 10–12px | Component internal padding, action gaps |
| 14–16px | Card padding, standard horizontal padding |
| 20–24px | Section padding, screen horizontal margins |
| 32px | Large section spacing |

---

## Border Radius

| Value | Usage |
|---|---|
| 6px | Pills, small badges, project tags |
| 10–12px | Tab pills, segment controls |
| 16px | Feed cards, modals, large surfaces |
| 20px+ | Value badges, avatar-adjacent pills |
| 50% | Avatars, icon circles |

---

## Elevation / Shadow

Cards use a consistent, subtle shadow:

```ts
shadowColor: '#000',
shadowOffset: { width: 0, height: 2 },
shadowOpacity: 0.06,
shadowRadius: 8,
elevation: 3, // Android
```

Lighter shadow for skeleton/loading states: `shadowOpacity: 0.04`, `elevation: 2`.

Do **not** use hard borders for card separation — use shadow + background contrast instead.

---

## Cards

### Feed Card (established pattern — March 2026)

```
┌─[4px accent bar]─────────────────────────────┐
│ [46px avatar w/ ring]  username      [value]  │
│                        2h ago        badge    │
│                                               │
│ Activity Name  [Project Pill]                 │
│ Note text goes here, truncated 2 lines...     │
│ ─────────────────────────────────────────── │
│ 👏 12    💬 3                                 │
└───────────────────────────────────────────────┘
```

- Background: `#ffffff`
- Border radius: `16px`
- Shadow: standard card shadow (above)
- Left accent bar: `4px` wide, full height, activity accent color
- Horizontal margin: `12px` from screen edges
- Vertical margin: `6px` between cards
- Internal padding: `14px`

### Stat Card

- Background: `#f9fafb`
- Border radius: `12px`
- No shadow (sits within a card)
- Value: 20–24px, 700 weight, `#007AFF`
- Label: 12px, 400 weight, `#6b7280`

---

## Avatars

| Size | Radius | Usage |
|---|---|---|
| 40px | 20px | Standard (list items, comments) |
| 46px | 23px | Feed cards — with 2px accent-color ring |
| 64px+ | 32px+ | Profile screens |

Avatar ring: `2px` border in activity accent color, `1px` padding inside ring.

Fallback (no photo): solid background at `accentColor + '22'` (14% opacity), initial letter in accent color at 17px 700 weight.

---

## Buttons

### Primary CTA

```ts
backgroundColor: '#007AFF',
paddingVertical: 14–16,
borderRadius: 8–12,
color: '#fff',
fontSize: 16–17,
fontWeight: '600',
```

### Secondary / Outlined

```ts
backgroundColor: 'transparent',
borderWidth: 1,
borderColor: '#e5e7eb',
// same padding/radius as primary
color: '#374151',
```

### Destructive

```ts
backgroundColor: '#ef4444',
// same padding/radius
color: '#fff',
```

---

## Tab Controls

### Pill / Segmented Control (established pattern — March 2026)

Used on the home screen Discover/Following switcher.

```
┌──────────────────────────────┐
│ [◉ Active Tab ] [ Inactive ] │  ← white pill spring-animated
└──────────────────────────────┘
```

- Track: `#e5e7eb` background, `12px` radius, `3px` padding
- Pill: `#ffffff`, `10px` radius, `elevation: 2`, spring animation
- Active text: `#111827`, `700` weight
- Inactive text: `#6b7280`, `500` weight
- Animation: `withSpring(index, { damping: 20, stiffness: 250, mass: 0.8 })`

### Underline Tab (legacy — use pill instead for new screens)

Flat underline with `#007AFF` 2px indicator. Keep for backward compat but prefer pill on new screens.

---

## Badges & Pills

### Value Badge (hero stat)

```ts
paddingHorizontal: 12,
paddingVertical: 6,
borderRadius: 20,
backgroundColor: accentColor + '15', // 8% opacity
color: accentColor,
fontSize: 15,
fontWeight: '800',
letterSpacing: -0.3,
```

### Project / Category Pill

```ts
paddingHorizontal: 8,
paddingVertical: 2,
borderRadius: 6,
backgroundColor: accentColor + '18', // 9% opacity
color: accentColor,
fontSize: 12,
fontWeight: '600',
```

### Accent Bar (card left edge)

```ts
width: 4,
// height: full card height (no explicit height needed — matches flex container)
backgroundColor: accentColor,
```

---

## Loading States

### Skeleton Screen (preferred)

Use animated skeleton cards instead of `ActivityIndicator` for list screens. Skeleton bones:

```ts
backgroundColor: '#e5e7eb',
// Reanimated opacity pulse:
opacity: withRepeat(
  withTiming(1, { duration: 900, easing: Easing.inOut(Easing.ease) }),
  -1, true
) // oscillates 0.4 → 1 → 0.4
```

Skeleton structure should match the real component shape precisely (same card, same layout, placeholder blocks for text/avatar).

### Spinner (fallback)

Use only for non-list loading (e.g., button submission, single-item fetch):

```ts
<ActivityIndicator size="small" color="#007AFF" />
```

---

## Timestamps

Use short relative format — not verbose locale strings:

| Age | Display |
|---|---|
| < 1 min | `just now` |
| < 60 min | `Xm ago` |
| < 24h | `Xh ago` |
| Yesterday | `Yesterday` |
| < 7 days | `Xd ago` |
| Older | `Mar 3` (month + day, no year unless different year) |

---

## Animation Principles

All animations use `react-native-reanimated`. Never use `Animated` from React Native core for new code.

| Interaction | Animation |
|---|---|
| Tab switch | `withSpring` — damping 20, stiffness 250 |
| Button press (clap/reaction) | `withSpring` scale 1.3 then back — damping 6/8, stiffness 300/200 |
| Skeleton shimmer | `withRepeat(withTiming(...))` — 900ms ease-in-out |
| Modal / sheet appear | `withSpring` translateY — damping 18, stiffness 220 |
| Fade in | `withTiming` — 200ms ease-out |

Haptics accompany key interactions:
- **Light** — standard taps, navigation
- **Medium** — reactions, confirmations
- **Heavy** — destructive actions (reserved)

---

## Empty States

Empty states should be helpful and action-oriented — not just "Nothing here."

Structure:
1. Illustration or icon (48px, `#d1d5db`)
2. Title — 16–18px, 600 weight, `#6b7280`
3. Subtitle — 14px, 400, `#9ca3af`
4. Optional: primary CTA button

---

## Screen Layout

Standard screen structure:

```
SafeAreaView (flex: 1, backgroundColor: '#fff' or '#f3f4f6')
├── Page Header (fixed, white bg, borderBottom: #f3f4f6)
│   ├── Back button (left)
│   └── Actions (right)
└── ScrollView / FlatList
    └── Content sections
```

Horizontal screen padding: `16–24px` depending on content density.

---

## 21st.dev Design Influence

The `creative-ui-designer` agent uses **21st.dev** (https://21st.dev) as its primary inspiration source. Patterns adopted so far:

| Pattern | Source | Implementation |
|---|---|---|
| Elevated card + shadow | 21st.dev card variants | `FeedItem` — shadow + 16px radius |
| Left accent bar | 21st.dev bordered cards | `FeedItem` — 4px activity-color bar |
| Pill tab switcher | 21st.dev dock/tab patterns | `HomeScreen` — animated white pill |
| Skeleton loader | 21st.dev skeleton variants | `FeedSkeleton` — Reanimated pulse |
| Hero value badge | 21st.dev number display | `FeedItem` — accent badge pill |

When the creative-ui-designer proposes new patterns from 21st.dev, add them to this table after implementation.

---

## Change Log

| Date | Change | Files affected |
|---|---|---|
| 2026-03-03 | Initial style guide created | (this file) |
| 2026-03-03 | Feed redesign: elevated cards, pill tabs, skeletons, activity accents | `FeedItem.tsx`, `FeedList.tsx`, `FeedSkeleton.tsx`, `index.tsx` (home) |
| 2026-03-03 | Log metadata unit fix: unit now derived from activity's primary field | `activities/[id]/index.tsx`, `projects/[projectId]/index.tsx` |
