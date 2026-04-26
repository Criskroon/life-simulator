# CLAUDE.md

Guidance for working in this repo. Read README.md for the user-facing overview;
this file is for the AI assistant.

## What this is

A BitLife-style sandbox life simulator built as a foundation for a
content-heavy game. Engine is finished, ~70 events ship as starter content,
the UI plays from birth to death. The intent is to keep adding events,
careers, and systems on top without restructuring.

## Stack

- React 18 + TypeScript (strict mode), Vite, Tailwind CSS, Zustand
- Vitest for tests
- No backend, no router (single-page state machine via Zustand `screen` field)
- Persistence is async-wrapped `localStorage` so it can swap to Capacitor
  Preferences for the eventual mobile port

## Commands

```bash
npm run dev          # → http://localhost:5180  (5173 is reserved by another project on this machine)
npm test             # 203 tests across the engine — must stay green
npm run build        # tsc -b && vite build
```

The dev server port is pinned to 5180 in `vite.config.ts` (`strictPort: true`)
and in `.claude/launch.json`. **Do not change to 5173** — another project on
this machine occupies that port.

## Architecture rules (do not break these)

These are the invariants the codebase is built on. Breaking any of them is a
real cost: it forces the next refactor.

1. **Engine has no React, no DOM, no `window`.** Everything in
   `src/game/engine/` and `src/game/data/` must be pure. The only async code
   in `src/game/` is `state/persistence.ts`.
2. **All game logic is `(state, …) → newState`.** No mutation. Use spreads or
   `structuredClone`. The engine relies on this for tests and for the future
   mobile port.
3. **UI is a thin layer.** Components only render and dispatch. Zero rules
   inside React components. If you find yourself writing `if (player.age > 18)`
   in a component, that branch belongs in the engine or in event data.
4. **Effects are declarative.** `{ path, op, value }` or `{ special, payload }`.
   Never `state.stats.happiness += 5` in an event. Add a new `special` handler
   via `registerSpecialEffect` in `effectsApplier.ts` if you need a new shape.
5. **Persistence goes through one module.** Nothing else touches `localStorage`.
   When the Capacitor port comes, only `state/persistence.ts` changes.

## Where things live

```
src/game/engine/      # pure functions: ageUp, applyEffects, eventSelector, rng
src/game/data/        # all content: events/, careers, names, countries
src/game/types/       # PlayerState, GameEvent, Effect, Condition
src/game/state/       # Zustand store + persistence
src/ui/components/    # StatBar, TopBar, EventModal, SidePanel, …
src/ui/screens/       # NewLifeScreen, GameScreen, DeathScreen
src/ui/layout/        # AppShell
tests/engine/         # vitest unit + integration tests
```

## Adding content

**New event** — append to the right file in `src/game/data/events/`. Pattern:

```ts
{
  id: 'unique_snake_case_id',
  category: 'childhood' | 'education' | 'career' | 'relationships' | 'random' | 'health',
  weight: 0.5,                  // selection bias
  minAge: 5, maxAge: 12,        // optional age gate
  oncePerLife: true,            // optional
  conditions: [                 // optional, ALL must match
    { path: 'stats.smarts', op: '>=', value: 60 },
    { path: 'relationships', op: 'has', value: 'father' },
  ],
  title: '…',
  description: 'Use {firstName}, {age}, {country}, {jobTitle}, {currentYear}',
  choices: [
    { label: '…', effects: [{ path: 'stats.happiness', op: '+', value: 5 }] },
  ],
}
```

A choice has EITHER `effects` (deterministic) OR `outcomes` (probabilistic) —
never both. Probabilistic shape:

```ts
{
  label: 'Fight back',
  outcomes: [
    {
      weight: 50,
      narrative: 'You throw the first punch. He goes down. You have a reputation now.',
      effects: [{ path: 'stats.happiness', op: '+', value: 8 }],
    },
    {
      weight: 35,
      narrative: 'You don\'t stand a chance. Black eye, bruised pride.',
      effects: [{ path: 'stats.health', op: '-', value: 8 }],
    },
    // ≥2 outcomes; weights are relative; sum must be > 0
  ],
}
```

`tests/engine/eventValidator.test.ts` re-runs `validateEvents(ALL_EVENTS)` on
every CI run, so a malformed choice (both/neither, single-outcome list, empty
narrative, zero weights) fails the build immediately.

Effect ops: `+ - * / =` for arithmetic. Specials available: `addRelationship`,
`removeRelationship`, `addAsset`, `addCrime`, `addEducation`,
`completeEducation`, `setJob`, `leaveJob`, `die`. Add a new one in
`effectsApplier.ts` — and if it's something the player should see in the
StatFeedback toast, also extend `summarizeSpecial()` in the same file with
a UI-ready label.

**New career** — append to `CAREERS` in `src/game/data/careers.ts`, then write
a `setJob` event referencing its `careerId` somewhere in
`src/game/data/events/career.ts`.

**New country** — append to `COUNTRIES` in `src/game/data/countries.ts`. If
the name pool needs to be different (e.g. German), add a new pool to
`names.ts` and reference it via `namePool`.

## Things that have already burned me

- **Don't auto-create files via `npm create vite@latest`.** Interactive prompts
  inside the Bash tool get cancelled. Scaffold by writing files directly.
- **Don't put `EventCard` back as a free-floating inline component.** The
  user wanted events as a centered modal, not an inline card requiring a
  scroll. `EventModal.tsx` is the only event surface.
- **Stat clamping is centralized.** `clampIfBounded()` in `effectsApplier.ts`
  knows which paths cap at 0..100. If you add a new stat, register its path
  in `STAT_PATHS`.
- **`null` job is the unemployed state.** Conditions for "has a job" are
  `{ path: 'job', op: '!=', value: null }` (the `null as unknown as string`
  cast in event files is intentional — `Condition.value` doesn't include
  `null` as a type but the evaluator handles it correctly via `!==`).
- **Test fixtures need both `minAge` and `maxAge` if you want age-200 to be
  out of range.** A `minAge` alone leaves the upper bound open.

## Testing

```bash
npm test             # one-shot, all 203 tests
npm run test:watch
```

The integration test (`tests/engine/integration.test.ts`) runs an entire life
with a fixed seed and asserts state stays internally consistent. If you add
state fields, extend its invariants.

The seedable RNG (`src/game/engine/rng.ts`) is a Mulberry32 wrapper. Any test
or call that needs reproducibility takes an `Rng` argument; pin a seed via
`createRng(N)`.

## Verification before declaring "done"

For UI changes, **don't** stop at type-check + tests. Use the Claude Preview
MCP to actually open the page and click through the flow. The tests cover the
engine, not the UI.

```text
mcp__Claude_Preview__preview_start (name: "dev")
→ screenshot
→ preview_eval to click through
→ check console_logs for runtime errors
```

`.claude/launch.json` is already configured to start the dev server on port
5180.
