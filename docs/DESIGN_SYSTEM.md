# Real-Life Sim — Design System (Sunny Side)

## Overview

This document is the implementation reference for the visual design system used throughout Real-Life Sim. Code sessions implementing or modifying UI components should consult this document for color values, typography choices, spacing rules, and component patterns.

**Design system name:** Sunny Side
**Established:** April 2026 via Claude Design sessions
**Aesthetic:** Warm, character-rich, mature-but-approachable. Hand-drawn imperfections over corporate polish.
**Primary use case:** Mobile-first (375px width canvas), web-deployed, eventually wrapped via Capacitor for iOS App Store.

---

## Color Palette

All colors should be defined as Tailwind custom colors in `tailwind.config.js` to ensure consistency. Implementation note: prefer extending Tailwind theme over inline hex values.

### Primary Backgrounds
- **Cream** `#FBF4E4` — main background
- **Cream Light** `#FEF9EC` — elevated surfaces, cards
- **Cream Dark** `#F4ECD7` — pressed states, dividers

### Primary Brand
- **Coral** `#E8714A` — primary actions, FAB, key CTAs (Age+1 button)
- **Coral Dark** `#D55B30` — coral pressed/hover states
- **Coral Light** `#F2A285` — coral subtle backgrounds, badges

### Secondary Brand
- **Peach** `#F5C094` — secondary actions, accent zones
- **Peach Light** `#FBE0CC` — soft backgrounds for active tabs
- **Brass** `#C8954D` — meta info, data labels, subtle accents

### Section Colors (8 Activities sections)

Each section has its own characteristic color used in section icons, headers, and accent decoration. These are **muted versions** — never neon or oversaturated.

- **The Body** — Sage `#7CA17A` (calm green)
- **The Mind** — Teal `#3D7E7B` (deep contemplation)
- **The Town** — Mustard `#C4953C` (warm activity)
- **The Heart** — Rose `#C77B8E` (warm romance)
- **The Wallet** — Olive `#8E8245` (earthy money)
- **The Shop** — Coral `#E8714A` (matches primary brand)
- **The Shadows** — Charcoal `#3D342E` (off the books)
- **The Mirror** — Lavender `#9B7EA9` (introspection)

### Stat Colors

Used in stat bars, deltas, and indicators. Each stat has both a "vibrant" and "muted" version.

- **Health** — Vibrant `#D85A4F`, Muted `#E89C95` (red, but warm)
- **Happiness** — Vibrant `#E8B144`, Muted `#F2D499` (golden yellow)
- **Smarts** — Vibrant `#5085B5`, Muted `#A4C2DD` (blue with depth)
- **Looks** — Vibrant `#D479A9`, Muted `#E8B5D2` (rose-pink)

### Status Colors

For success/warning/error states throughout UI.

- **Success Green** `#5D9573` — gains, positive outcomes
- **Warning Amber** `#D4A042` — cautions, mid-states
- **Danger Red** `#B5524A` — losses, dangerous actions
- **Neutral Gray** `#8B8076` — default, inactive

### Text Colors

- **Ink** `#2A1F18` — primary text
- **Ink Soft** `#5C4F44` — secondary text, descriptions
- **Ink Faint** `#A89B8E` — disabled, placeholder, meta info
- **Cream-on-Dark** `#FBF4E4` — text on coral/dark backgrounds

---

## Typography

Three font families, each with a specific role. **Do not mix roles.** Implementation: import via Google Fonts in `index.html` or via Tailwind plugin.

### Bricolage Grotesque (Display)

For headlines, large numbers, modal titles, signature text. Has slight quirks that give the UI character — perfect for game-style headers.

**Usage:**
- Player name on GameScreen: 28-32px, weight 600
- Modal titles: 22-24px, weight 600
- Section headers: 18-20px, weight 600
- Large stat numbers (money): 24-28px, weight 600
- Activity section names ("The Body" etc.): 20-22px, weight 600

**Tailwind:** Add to `theme.fontFamily.display = ['Bricolage Grotesque', 'serif']`

### Plus Jakarta Sans (UI)

For all body text, button labels, navigation, descriptions. Clean and readable, neutral character.

**Usage:**
- Body text: 14-16px, weight 400
- Button labels: 14-16px, weight 500
- Navigation labels: 11-12px, weight 500 (uppercase, tracked)
- Descriptions in lists: 13-14px, weight 400
- Form inputs: 16px, weight 400

**Tailwind:** Default sans, add `theme.fontFamily.sans = ['Plus Jakarta Sans', 'system-ui', 'sans-serif']`

### DM Mono (Meta)

For data, codes, tracked-uppercase labels, system info. Adds technical character to data display.

**Usage:**
- Year indicators: 11-12px, weight 400
- Stat labels (HEALTH, SMARTS, etc.): 10-11px, weight 500, uppercase, letter-spacing 0.05em
- Cost indicators ("1 ACTION", "-€200"): 11-12px, weight 500
- Meta info ("Together 4y", "Age 28"): 11-12px, weight 400
- Section eyebrows ("WHAT HAPPENED"): 10-11px, weight 500, uppercase, letter-spacing 0.1em

**Tailwind:** Add to `theme.fontFamily.mono = ['DM Mono', 'monospace']`

### Type Scale Reference

```
xs    11px / 16px line-height — meta, labels
sm    13px / 20px — descriptions, secondary
base  15px / 22px — body, default
lg    17px / 24px — emphasized body
xl    20px / 28px — small headers
2xl   22px / 30px — modal titles
3xl   28px / 36px — large headers, names
4xl   32px / 40px — display, hero
```

---

## Iconography

All icons follow a custom hand-drawn style. **No emoji** anywhere in the UI. **No generic icon libraries** (no Heroicons, no Material Icons, no Font Awesome).

### Icon Specifications

- **Stroke width:** 1.8px (consistent across all icons)
- **Style:** Slightly imperfect, hand-drawn character — not geometric perfection
- **Corners:** Rounded line-caps and line-joins
- **Sizes:** 16px, 20px, 24px, 32px, 48px (icon system uses these standard sizes)
- **Color:** Inherits from parent text color via `currentColor`
- **Format:** SVG, inline in components

### Icon Categories Needed

**Navigation icons** (bottom bar):
- Career icon
- Assets icon
- Age+1 (signature swirl/sun motif)
- People icon
- Activities icon

**Stat icons:**
- Health (heart-shape with character)
- Happiness (sun-shape)
- Smarts (book-shape)
- Looks (mirror-shape)
- Money (coin-stack)
- Action points (dots or candles)

**Activity section icons** (one per section):
- The Body — figure or muscle
- The Mind — open book or brain
- The Town — building cluster or street
- The Heart — heart with imperfections
- The Wallet — coin or wallet
- The Shop — shopping bag or cart
- The Shadows — half-moon or mask
- The Mirror — hand mirror

**Action icons** (~30 needed for V1 activities):
- Specific to each activity (gym dumbbell, library book, doctor stethoscope, etc.)
- Created on-demand during implementation sessions

### Implementation Note for Code

Icons should be **React components** in `src/ui/icons/` directory. Each icon file exports a single component:

```tsx
// src/ui/icons/HeartIcon.tsx
export const HeartIcon = ({ size = 24, ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
    {/* path data */}
  </svg>
);
```

Icons can be sourced from a tool like Lucide and customized to add hand-drawn imperfections, or commissioned/created later. For V1: start with Lucide as base, add character via stroke adjustments.

---

## Component Patterns

These are the reusable UI building blocks. Each pattern below specifies behavior, sizing, and Tailwind hints.

### Bottom Navigation Bar

Five-tab structure with center FAB for primary action.

**Layout:**
- Fixed at bottom of viewport
- Background: Cream Light with subtle top border (1px Cream Dark)
- Height: 80px (includes safe area on iOS)
- Five evenly distributed slots
- Center slot is FAB-style (Age+1 button), 56-64px coral circle, slightly elevated above bar

**Per Tab:**
- Icon: 24px
- Label: 11px, DM Mono, uppercase, letter-spacing 0.05em
- Inactive color: Ink Faint
- Active color: Coral
- Active background: Peach Light, rounded-2xl, padded
- Tap target: minimum 56px height
- Badge support (small Coral dot top-right of icon when applicable)

**FAB (Age+1):**
- Diameter: 56-64px
- Color: Coral background, Cream-on-Dark text
- Position: Center, vertically slightly above bar
- Label: "Age +1" or "+1" depending on space
- Drop shadow: subtle, warm

### Cards

General card pattern used for events, persons, stats, assets.

**Base card:**
- Background: Cream Light
- Border: 1px Cream Dark (subtle)
- Border radius: 16px (rounded-2xl)
- Padding: 16-20px
- Shadow: subtle warm shadow `shadow-[0_2px_8px_rgba(232,113,74,0.08)]`

**Variants:**

**Event Card** (within event modals):
- Adds Section eyebrow (DM Mono, uppercase, 10px)
- Headline (Bricolage, 22px)
- Narrative body (Plus Jakarta, 15px, italic option)

**Person Card** (in Relationships list):
- Avatar (40-48px circle)
- Name (Plus Jakarta, 16px, weight 500)
- Relation + age line (DM Mono, 11px)
- Bond indicator (typography only or thin bar)
- Tap target: 60px+ height for comfortable mobile tap

**Stat Card** (on GameScreen):
- Icon (24px)
- Stat value (Bricolage, 24px)
- Stat label (DM Mono, 10px, uppercase)
- Trend indicator (▲▼ in Stat Vibrant color)

**Asset Card** (in Assets tab):
- Icon or thumbnail
- Asset name (Plus Jakarta, 16px, weight 500)
- Current value (Bricolage, 18px, in Money colors)
- Maintenance/depreciation note (DM Mono, 11px)

### Buttons

Three variants. All buttons share: minimum 44px tap target, weight 500, slight letter tracking.

**Primary Button** (Coral)
- Background: Coral
- Text: Cream-on-Dark
- Border radius: 12-16px
- Hover: Coral Dark
- Disabled: Ink Faint background, Ink Soft text
- Padding: 12px 20px (medium), 16px 24px (large)

**Secondary Button** (Cream)
- Background: Cream Light
- Border: 1px Brass
- Text: Ink
- Hover: Cream Dark
- Same disabled state as primary

**Danger Button** (Red)
- Background: Danger Red
- Text: Cream-on-Dark
- Used for destructive actions: Divorce, Cancel Engagement, Block contact, etc.

**Light Action Pill** (within profiles)
- Background: Cream Light with subtle shadow
- Border: none
- Text: Ink, 14px, weight 500
- Right-aligned chevron (▸) for indicating tap-to-open
- Disabled state: Ink Faint background, "Already this year" reason in DM Mono 10px

### Modals

Three modal types share base structure but vary in content.

**Modal Base:**
- Background: Cream
- Border radius: 24px top corners (sheet-style on mobile)
- Max width: 360px on mobile (full width with margin), 480px on tablet+
- Padding: 24px
- Backdrop: Ink at 60% opacity
- Animation: slide up from bottom on mobile, fade-in on desktop
- Close button: top-right, X icon, 24px

**Event Modal:**
- Section eyebrow (DM Mono uppercase)
- Title (Bricolage, 24px)
- Companion strip (if event involves specific person):
  - Avatar 40px + name + relation
- Narrative (Plus Jakarta, 15px, italic-friendly, line-height 1.6)
- 2-4 choice buttons stacked, full width
- Optional whisper at bottom (italic, faint, *"Whatever you choose, you'll live with it."*)

**Resolution Modal:**
- Eyebrow: "WHAT HAPPENED"
- Outcome title (Bricolage, 22px)
- Narrative (1-3 sentences)
- Stat changes section:
  - List of deltas with stat name + value + reason if applicable
  - Format: "Health (slept 4h) -3"
  - Color: Stat Vibrant for the value
- Special events callout (if applicable):
  - Boxed section with icon + bold text
  - Example: "💍 Engaged to Sara Vermeer" but with custom icon, not emoji
- Continue button (primary, full width)

**Profile Modal (Person/Pet/Friend):**
- Hero section:
  - Avatar 80px
  - Name (Bricolage, 28px)
  - Metadata line (DM Mono): "Partner · Together 4y · Age 28"
  - Bond meter visualization (substantial, 5-tier scale)
- Optional voice line (italic, faint): *"He still notices things."*
- Big actions section (2-4 actions):
  - Tile-style buttons with icon + name + cost row
  - Tile color matches action category
- Light actions section (4-8 actions):
  - Pill-style rows
  - Disabled state with reason

### Bond Meter / Friendship Meter / Pet Bond Meter

Critical pattern for relationships. Replaces simple "0-100" with tier-labeled visual.

**Visual structure:**
- Horizontal bar, 4-6px tall, full available width
- Background: Cream Dark
- Fill: gradient or solid in tier-appropriate color
- Tick marks at tier boundaries
- Tier label below bar (DM Mono, uppercase, 11px)
- Numeric value visible but not dominant: optional small "71" in Brass color

**Tier Scales:**

**Romantic (Bond):**
- 0-19: Strangers
- 20-39: Warm
- 40-59: Close
- 60-79: Deep
- 80-100: Soulmate

**Friendship:**
- 0-19: Acquaintance
- 20-39: Friend
- 40-59: Close Friend
- 60-79: Confidant
- 80-100: Inner Circle

**Pet Bond:**
- 0-19: Aloof
- 20-39: Companion
- 40-59: Bonded
- 60-79: Devoted
- 80-100: Inseparable

### Stat Bars

Used on GameScreen for primary stats (Health, Happiness, Smarts, Looks).

**Layout:**
- Horizontal layout with icon + label + value + bar
- Or vertical card layout (icon top, value middle, mini bar bottom)
- Bar: 4px tall, rounded-full
- Background: Stat Muted
- Fill: Stat Vibrant
- Trend indicator: ▲ or ▼ in Stat Vibrant, next to value

### Activities Menu

Scrollable list of 8 sections, each with its color and icon.

**Per section card:**
- Icon (24-32px) in section color
- Section name (Bricolage, 20px) — "The Body", "The Mind", etc.
- Tagline (Plus Jakarta italic, 13px) — *"Care, repair, alter your physical self"*
- Activity count badge (DM Mono, 11px) — "14 activities"
- Tap target: full width, 80px+ height

**Header of menu:**
- Title: "What do you do?" (Bricolage, 22px)
- Optional: action points indicator top-right (e.g., "3 LEFT")
- Close button top-left or top-right

**Inside a section** (e.g., The Body):
- Back button: "Activities" (with chevron-left)
- Section name as header (Bricolage, 24px) in section color
- Tagline as subhead (Plus Jakarta italic, 14px)
- List of activities (rows):
  - Activity icon (20px)
  - Activity name (Plus Jakarta, 16px, weight 500)
  - Description (Plus Jakarta, 13px, Ink Soft)
  - Cost on right (DM Mono, 11px) — "1 ACTION", "FREE", "-€200"
  - Disabled state: full row Ink Faint, no cost shown
- Discovery hints: NONE (per pure discovery philosophy)

---

## Avatar System

Procedurally generated avatars give every NPC a unique face without commissioning illustrations.

### Procedural Components

Each avatar is built from layered SVG primitives:

**Face shape:** 7 variants (round, oval, square, heart, diamond, long, soft-square)
**Skin tone:** 8 shades from light to deep, in warm tones
**Hair styles:** 22 variants covering short, medium, long, curls, buzz, bald, hijab, etc.
**Hair colors:** 6 base colors (black, brown, blonde, red, gray, white)
**Eyes:** 5 shapes, 4 colors (brown, blue, green, hazel)
**Eyebrows:** 4 styles
**Mouth:** 5 expressions (neutral, slight smile, slight frown, open, pursed)
**Accessories** (probabilistic): glasses (3 styles), facial hair (4 for masculine), freckles, scars, piercings, hijab/cap

### Generation Logic

- Seed: deterministic from person name + birth year
- Same person always gets same avatar
- Distribution should look natural (most people no accessories, occasional eye-catchers)
- Hand-drawn jitter applied to all strokes (small random offsets per render)

### Visual Style

- Stroke: 1.8px, consistent with icon system
- Color palette: warm, slightly desaturated
- Background: solid color block from a curated palette of 8 hues
- Slight imperfections in lines (not perfect circles, slight wobble)

### Implementation Note

Avatar component lives at `src/ui/components/Avatar.tsx`. Receives person object, generates SVG inline. Caches generation result by seed for performance.

---

## Tone & Voice Guidelines

The visual design supports a specific narrative voice. Implementation must respect this voice in:
- Activity descriptions
- Event narratives
- Outcome texts
- Button labels
- System messages

### The Voice

**Mature observation with restraint.** Dry. Occasionally beautiful. Never cynical, never saccharine, never corporate.

### Sample Comparisons

**Bad (corporate/generic):**
- "Visit the doctor. Increases health by 5 points."
- "Get a pet. Adds a companion to your life."
- "Pickpocket. Risk of being caught."

**Good (Sunny Side voice):**
- *"Schedule the appointment you've been avoiding."*
- *"Bring something living into your apartment."*
- *"You're either careful or caught. Sometimes both."*

### Activity Description Guidelines

- 1 sentence, 6-12 words ideal
- Show consequence implicitly, not as a stat list
- Use second person ("you")
- Avoid game terms ("XP", "level", "stat")
- Imperfections welcome (sentence fragments, mid-thought)

### Event Narrative Guidelines

- 2-4 sentences max
- Set a scene, not explain mechanics
- Leave space for player imagination
- Avoid loaded words for outcomes that haven't happened yet

### Button Label Guidelines

- Short, decisive verbs: "Call him back", not "Initiate call"
- Concrete actions: "Send a careful message", not "Communicate cautiously"
- Tone variants for choices in event modals:
  - Primary tone (Coral): warm, decisive
  - Care tone (Peach): gentle, considered
  - Cool tone (Cream Dark): distant, measured
  - Danger tone (Red): destructive, severe

---

## Layout & Spacing

Consistent spacing rhythm makes the UI feel polished.

### Spacing Scale

Use Tailwind's spacing scale, but standardize on these values:

- **2** (8px) — within tight components (between icon + label)
- **3** (12px) — between related items (label + value)
- **4** (16px) — within cards (default padding)
- **6** (24px) — between cards in same section
- **8** (32px) — between major sections
- **12** (48px) — between hero areas

### Mobile Layout Rules

- Minimum margin from screen edge: 16px
- Maximum content width: 360px (centered if larger viewport)
- Modal margin: 12px from edge on mobile, expand on tablet
- Touch target minimum: 44x44px (Apple HIG standard)

### Vertical Rhythm

- Default line-height: 1.5 for body, 1.3 for headers
- Card-to-card spacing: 12-16px
- Section-to-section: 24-32px

---

## Implementation Notes for Code

### Tailwind Configuration

Extend `tailwind.config.js` with custom colors, fonts, and shadows:

```js
module.exports = {
  theme: {
    extend: {
      colors: {
        // Backgrounds
        cream: { DEFAULT: '#FBF4E4', light: '#FEF9EC', dark: '#F4ECD7' },
        // Brand
        coral: { DEFAULT: '#E8714A', dark: '#D55B30', light: '#F2A285' },
        peach: { DEFAULT: '#F5C094', light: '#FBE0CC' },
        brass: '#C8954D',
        // Section colors
        section: {
          body: '#7CA17A',
          mind: '#3D7E7B',
          town: '#C4953C',
          heart: '#C77B8E',
          wallet: '#8E8245',
          shop: '#E8714A',
          shadows: '#3D342E',
          mirror: '#9B7EA9',
        },
        // Stats
        stat: {
          health: { DEFAULT: '#D85A4F', muted: '#E89C95' },
          happiness: { DEFAULT: '#E8B144', muted: '#F2D499' },
          smarts: { DEFAULT: '#5085B5', muted: '#A4C2DD' },
          looks: { DEFAULT: '#D479A9', muted: '#E8B5D2' },
        },
        // Ink (text)
        ink: { DEFAULT: '#2A1F18', soft: '#5C4F44', faint: '#A89B8E' },
      },
      fontFamily: {
        display: ['"Bricolage Grotesque"', 'serif'],
        sans: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
        mono: ['"DM Mono"', 'monospace'],
      },
      boxShadow: {
        'warm': '0 2px 8px rgba(232, 113, 74, 0.08)',
        'warm-lg': '0 4px 16px rgba(232, 113, 74, 0.12)',
      },
    },
  },
};
```

### Font Loading

In `index.html` add Google Fonts:

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:wght@400;500;600;700&family=DM+Mono:wght@400;500&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
```

### Component Naming Conventions

When implementing new components, follow these naming patterns:

- Modals: `[Type]Modal.tsx` — `EventModal`, `ResolutionModal`, `ProfileModal`
- Cards: `[Type]Card.tsx` — `PersonCard`, `EventCard`, `AssetCard`
- Bars/Meters: `[Type]Meter.tsx` — `BondMeter`, `StatBar`, `FriendshipMeter`
- Pages/Tabs: `[Name]Tab.tsx` — `CareerTab`, `AssetsTab`, `PeopleTab`
- Icons: `[Name]Icon.tsx` — `HeartIcon`, `BodyIcon`, `MoneyIcon`

### File Organization

```
src/ui/
├── components/
│   ├── BottomNav.tsx
│   ├── modals/
│   ├── cards/
│   ├── meters/
│   └── tabs/
├── icons/
│   ├── stats/
│   ├── activities/
│   └── ui/
└── styles/
    └── tokens.ts (optional: design tokens as JS constants)
```

---

## Avoiding Common Pitfalls

Based on Claude Design iterations, here are visual approaches to **avoid**:

❌ **Emoji anywhere in UI** — use custom icons only
❌ **Pure white backgrounds** — always use Cream
❌ **Generic system fonts** — always use the three specified fonts
❌ **Sharp corners** — always rounded (16px+ for cards, 12px for buttons)
❌ **High contrast borders** — borders are subtle (Cream Dark on Cream Light)
❌ **Saturated bright colors** — palette is warm and slightly muted
❌ **Stiff geometric icons** — hand-drawn imperfection is the signature
❌ **Excessive shadows** — subtle warm shadows only

---

## Versioning

This document is V1 of the design system. Updates should:
1. Be discussed in chat before implementing
2. Document rationale for changes
3. Increment version (V1 → V1.1 for additions, V2 for major shifts)

**Current version:** 1.0
**Last updated:** April 27, 2026
