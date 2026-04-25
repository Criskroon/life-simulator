# Real Life Sim

A sandbox life simulator in the style of BitLife. This codebase is the
**foundation** for an event-driven, mobile-port-ready life simulator. It is
intentionally small, but every module is shaped so we can pile hundreds of
events and additional systems on top without restructuring.

## Quick start

```bash
npm install
npm run dev      # → http://localhost:5173
npm test         # 24 tests across the engine
npm run build    # production build → dist/
```

## Architecture at a glance

```
src/
  game/                     # all rules live here, zero React imports
    engine/                 # pure functions: ageUp, applyEffects, etc.
    data/                   # JSON-shaped TS modules: events, careers, names
    types/                  # PlayerState, GameEvent, Effect, Condition
    state/                  # Zustand store + persistence wrapper
  ui/                       # React components (thin layer, no rules)
    components/             # StatBar, EventCard, SidePanel, …
    screens/                # NewLifeScreen, GameScreen, DeathScreen
    layout/                 # AppShell
tests/engine/               # vitest unit + integration tests
```

Five rules the codebase follows everywhere — keep them in mind when extending it:

1. **Data-driven design.** Every event, career, country, and name lives in a
   data file. UI and engine never hardcode game content.
2. **Pure functions for game logic.** `ageUp`, `resolveEvent`, `applyEffects`,
   `endYear`, etc. take `(state, …) → newState`. No mutation, no side effects.
3. **UI is a thin layer.** Components only render state and dispatch actions.
4. **Effects are declarative.** Outcomes are described as
   `{ path: "stats.happiness", op: "+", value: 5 }`, parsed by a single
   applier. No event ever calls `state.happiness += 5`.
5. **Persistence is a single module.** All save/load goes through
   `src/game/state/persistence.ts`, which wraps `localStorage` behind an
   async `StorageAdapter`. Swapping in Capacitor Preferences later is one file.

## How to add a new event

Pick the right category file in [`src/game/data/events/`](src/game/data/events)
and append to its array. Example:

```ts
// src/game/data/events/random.ts
{
  id: 'random_unexpected_inheritance',
  category: 'random',
  weight: 0.05,             // selection bias, ~5% of `random_lottery_win`'s
  minAge: 25,
  maxAge: 70,
  oncePerLife: true,
  conditions: [             // ALL must be true to be eligible
    { path: 'stats.smarts', op: '>=', value: 50 },
    { path: 'relationships', op: 'has', value: 'father' },
  ],
  title: 'Distant Relative',
  description: 'A lawyer called. A great-aunt you never met left you something.',
  choices: [
    {
      label: 'Accept the cheque',
      effects: [
        { path: 'money', op: '+', value: 25000 },
        { path: 'stats.happiness', op: '+', value: 8 },
      ],
    },
    {
      label: 'Donate it all',
      effects: [
        { path: 'stats.happiness', op: '+', value: 12 },
      ],
    },
  ],
},
```

Available pieces:

- **Paths** — any dotted path into [`PlayerState`](src/game/types/gameState.ts):
  `stats.health`, `stats.happiness`, `stats.smarts`, `stats.looks`, `money`,
  `job.salary`, `job.performance`, `age`, etc.
- **Effect ops** — `+ - * / =` (arithmetic on numeric paths).
- **Special effects** — declared via `special: '...'` and `payload: {...}`:
  `addRelationship`, `removeRelationship`, `addAsset`, `addCrime`,
  `addEducation`, `completeEducation`, `setJob`, `leaveJob`, `die`. Add new
  ones via `registerSpecialEffect()` in
  [`effectsApplier.ts`](src/game/engine/effectsApplier.ts).
- **Condition ops** — `== != > < >= <= has lacks`. `has` / `lacks` work on
  arrays (membership by `id`, `type`, or `careerId`) and strings (substring).
- **Description tokens** — `{firstName}`, `{lastName}`, `{age}`, `{country}`,
  `{currentYear}`, `{gender}`, `{jobTitle}`. Unknown tokens render literally so
  authoring mistakes are visible.

A non-programmer can ship an event by editing one file. Templates and
conditions cover the common cases without code changes.

## How to add a new career

Append to [`CAREERS`](src/game/data/careers.ts):

```ts
{
  id: 'finance',
  name: 'Investment Banker',
  minAge: 22,
  requiresEducation: 'university',
  levels: [
    { title: 'Analyst',         baseSalary: 85000,  yearsForPromotion: 3, minSmarts: 70 },
    { title: 'Associate',       baseSalary: 140000, yearsForPromotion: 4, minSmarts: 75 },
    { title: 'Vice President',  baseSalary: 220000, yearsForPromotion: 5, minSmarts: 80 },
    { title: 'Managing Director', baseSalary: 400000, yearsForPromotion: 6, minSmarts: 85 },
  ],
},
```

Then write a career event in `src/game/data/events/career.ts` whose
`special: 'setJob'` payload references this `careerId`. Promotions are just
events that mutate `job.level` and `job.salary` — see
`career_promotion_offer` for the pattern.

## Mobile-port readiness

The codebase is shaped to wrap with [Capacitor](https://capacitorjs.com) when
the time comes:

- **No web-only APIs in the engine or store.** The engine touches no DOM, no
  `window`, no `fetch`. Everything is pure data.
- **Persistence is async-by-default.** `saveGame`, `loadGame`, `deleteSave`
  all return Promises even though `localStorage` is sync — this matches the
  Capacitor Preferences API. Swapping the adapter is one call to
  `setStorageAdapter()`.
- **Mobile-first layout.** `max-w-phone` (480px) is the canvas; the desktop
  view is just that canvas centered. Tap targets are large; the bottom action
  bar accounts for safe-area space.
- **Game state is pure JSON.** No Maps, Sets, Dates, or class instances —
  every save round-trips cleanly through `JSON.stringify`/`parse`.

## Testing

```bash
npm test         # one-shot
npm run test:watch
```

There are four test files under `tests/engine/`:

- `conditionEvaluator.test.ts` — operators, missing paths, array membership
- `effectsApplier.test.ts` — arithmetic, clamping, immutability, special handlers
- `eventSelector.test.ts` — eligibility, oncePerLife, deterministic selection
- `integration.test.ts` — runs an entire life with a fixed seed and asserts
  state stays internally consistent through to death

The RNG (`src/game/engine/rng.ts`) is a seedable Mulberry32 wrapper so any
test that needs random behavior can pin a seed and get the same result every
run.

## Roadmap

This is a foundation, not a finished game. The next logical layers:

1. **More content.** Triple the event count per category. Add cultural
   variation per country (Dutch coffee shops, US student loans).
2. **Career depth.** Promotion offers tied to `Career.levels`; firing tied
   to performance; salary negotiations.
3. **Relationship system.** Dating events that reference real relationship
   records (current implementation uses templated names — the next step is
   randomly generated NPCs with persistent state).
4. **Activities menu.** Voluntary actions between years — go to the gym, study
   a language, see a doctor — each as a single dispatched effect bundle.
5. **Crime + jail mechanics.** `addCrime` is wired up; the next step is a
   `caught` roll, a court event chain, and a `jailYears` time-skip.
6. **Assets.** Cars and houses with depreciation and maintenance.
7. **Capacitor wrap.** Add `@capacitor/core`, swap the storage adapter, ship
   to TestFlight / Play internal testing.
8. **Saved-life browser.** Replace the single save slot with a list of
   completed lives so players can compare runs.

Anything beyond that — multiplayer, online leaderboards, AI-generated events
— would mean adding a backend, which is explicitly out of scope for this
foundation.
