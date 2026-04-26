# Relationship Interactions — Scope Document

**Status:** scoped, not implemented.
**Author:** session X1, 2026-04-26.
**Builds on:** [docs/audits/relationship-depth-audit-2026-04-26.md](../audits/relationship-depth-audit-2026-04-26.md)
and [docs/audits/ui-issues-audit-2026-04-26.md](../audits/ui-issues-audit-2026-04-26.md).

This document defines what we're building and how it slots into the existing
engine. Implementation is split across two sessions (X2, X3). Quick UI fixes
land in a separate session before X2.

---

## A. Conceptual design

Today the player can only act on a relationship through:

- **Random events** that gate on `has '<type>'` — fired by ageUp.
- **Generic activities** like `family_time` and `call_friend` that target
  the *type*, not a specific person. The audit measured 0 events that
  target a specific instance.

This system adds **direct interactions**: the player taps a name in
SidePanel and sees a profile with status-aware actions.

### UI flow

1. Player opens SidePanel → Relationships tab.
2. Each row in Active / Family / Friends / Exes is **clickable**.
3. Tapping a row opens `RelationshipProfileModal` (centered, like EventModal).
4. Modal shows:
   - Person header: name, age, type, alive status.
   - Bond/closeness bar (visual `relationshipLevel`).
   - Meta line (e.g. "5 years together", "engaged 2y", "casual ex, fades 2027").
   - Action list — each action is a `<button>` with label, cost preview, and an
     enabled/disabled state based on conditions.
5. Tapping an action either (a) applies effects & shows ResolutionModal, or
   (b) opens InsufficientFundsModal when the player can't afford it.

### Status-aware actions

Each `RelationshipType` has a fixed set of actions. The action list for a
specific person is filtered at render time based on:

- relationship slot status (e.g. propose only when this is the partner)
- person.alive (most actions disabled if deceased)
- player constraints (age, money, action-budget)
- per-person/per-year limits (light actions are once per year per person)

---

## B. Cost model (hybrid)

Actions split into **big** (costs action-points) and **light** (free, but
once per year per person).

| Tier | Cost | Examples | Why |
|---|---|---|---|
| Big | 1 action point + maybe money | propose, suggest vacation, divorce, throw a party for | Real choices, mutually exclusive within a year |
| Light | free, once per person per year | compliment, chitchat, give gift (money still costs), argue, ask about their day | Player should be able to maintain *all* their relationships in a year |

This solves a tension the audit surfaced: the player has 2-5 action points
total per year, but 5+ relationships they want to maintain. If every
interaction costs an action point, the player is forced to neglect 80% of
their network. The light tier lets the player sprinkle attention across the
list without the budget collapsing.

### Per-person yearly cap

For light actions, store last-used year per (personId, actionId) on the
person. New shape:

```ts
interface Person {
  // existing fields…
  lastInteractionYears?: Record<string, number>; // actionId → year
}
```

`isActionAvailable(action, person, currentYear)`:
- if action.tier === 'big': require actionsRemainingThisYear ≥ action.actionCost
- if action.tier === 'light': require lastInteractionYears[action.id] !== currentYear

State growth: ~10 entries per person × ~12 persons per life × 4 bytes ≈ 500 B
per save. Trivial.

### Big-action budget interaction

Big actions use `useAction(state)` from `actionBudget.ts`. The action-budget
engine doesn't change. The Activities menu and the new RelationshipProfileModal
both draw from the same `actionsRemainingThisYear` pool. Player can choose to
spend a year's actions on activities or on relationship interactions; the
tradeoff is real.

---

## C. Actions per relationship type

Targets per type. Bracket = action tier (B = big, L = light). All targeted
actions can fail or have probabilistic outcomes where it makes sense.

### Partner (6 actions)
| Action | Tier | Cost | Notes |
|---|---|---|---|
| Spend time | L | free | +relationshipLevel, +happiness |
| Compliment | L | free | small +relationshipLevel |
| Give gift | L | -50..-500 money | +relationshipLevel, scales with cost |
| Argue | L | free | -relationshipLevel, -happiness, probabilistic breakup |
| Suggest vacation | B | 1 AP, -1500 | +relationshipLevel, +happiness, prob. breakup if level low |
| Propose | B | 1 AP, -4500 | requires yearsTogether ≥ 1; outcomes mirror `rel_partner_proposal_pressure` |
| Break up | B | 1 AP | clean exit; partner→casualEx |

### Fiance (5 actions)
| Action | Tier | Cost | Notes |
|---|---|---|---|
| Spend time | L | free | +relationshipLevel |
| Compliment | L | free | small +relationshipLevel |
| Give gift | L | -100..-1000 | +relationshipLevel |
| Plan the wedding | B | 1 AP, varies | promotes fiance→spouse via `addSpouse`; outcomes mirror `rel_fiance_planning_wedding` |
| Cancel engagement | B | 1 AP | fiance→significantEx via `endEngagement` |

### Spouse (8 actions)
| Action | Tier | Cost | Notes |
|---|---|---|---|
| Spend time | L | free | +relationshipLevel |
| Compliment | L | free | small +relationshipLevel |
| Give gift | L | -50..-500 | +relationshipLevel |
| Argue | L | free | -relationshipLevel, prob. cooldown |
| Suggest vacation | B | 1 AP, -2000 | +relationshipLevel |
| Try for a child | B | 1 AP, -3000 | adds `child` to family list |
| Throw an anniversary | B | 1 AP, varies | mirrors `rel_anniversary` choices |
| Divorce | B | 1 AP, -10000 | spouse→significantEx via `divorceSpouse` |

### Family — parent (5 actions per parent)
| Action | Tier | Cost | Notes |
|---|---|---|---|
| Spend time | L | free | +relationshipLevel, +happiness |
| Call | L | free | small +relationshipLevel |
| Argue | L | free | -relationshipLevel; prob. extended estrangement |
| Ask for advice | L | free | +smarts, +relationshipLevel; rare prob. -relationshipLevel |
| Give gift | L | -50..-500 | +relationshipLevel |

### Family — sibling (4 actions)
Similar to parent minus "ask for advice".

### Family — child (5 actions, age-dependent)
| Action | Tier | Cost | Notes |
|---|---|---|---|
| Spend time | L | free | +relationshipLevel, +happiness |
| Pay for school | B | 1 AP, varies by child age | +relationshipLevel; child age 5+ |
| Discipline | L | free | -relationshipLevel short-term, +long-term |
| Give gift | L | varies | +relationshipLevel |
| Help them move out | B | 1 AP | child age 18+ |

Action availability is gated on child.age — `Pay for school` only renders
when child is 5..21; `Help them move out` only when child ≥ 18.

### Friend (5 actions)
| Action | Tier | Cost | Notes |
|---|---|---|---|
| Hang out | L | free | +relationshipLevel; resets `yearsSinceContact` |
| Call | L | free | resets `yearsSinceContact`; smaller bond bump |
| Argue | L | free | -relationshipLevel, prob. drift to nothing |
| Throw a party for them | B | 1 AP, -200 | +relationshipLevel; promotes to best friend if ≥ 80 |
| Cut them off | B | 1 AP | calls `loseFriend` |

### Best friend (1 extra action; inherits friend list)
| Action | Tier | Cost | Notes |
|---|---|---|---|
| Tell them everything | L | free | +relationshipLevel; +happiness; rare prob. -relationshipLevel ("they tell someone") |

### Significant ex (3 actions)
| Action | Tier | Cost | Notes |
|---|---|---|---|
| Reach out | L | free | +happiness; rare prob. they enter partner slot (becomes partner again) |
| Send a gift | L | -50..-200 | +happiness; rare prob. partner re-entry |
| Sleep with | L | free | +happiness; if married, prob. cheating discovery (drops level on spouse) |

### Casual ex (2 actions)
| Action | Tier | Cost | Notes |
|---|---|---|---|
| Reach out | L | free | +happiness; rare prob. they enter partner slot |
| Sleep with | L | free | +happiness; if married, prob. cheating discovery |

---

## D. Engine architecture

### New types

```ts
// src/game/types/interactions.ts
export type ActionTier = 'big' | 'light';

export interface RelationshipAction {
  id: string;
  label: string;
  description?: string;
  tier: ActionTier;
  actionCost?: number; // big actions only; default 1
  cost?: number;       // money cost (negative = spend); country-adjusted at apply
  /**
   * Conditions evaluated against (player, target). `target.*` paths read off
   * the targeted Person; other paths read off PlayerState.
   */
  conditions?: Condition[];
  /** Deterministic OR probabilistic — same shape as Choice. */
  effects?: Effect[];
  outcomes?: Outcome[];
}
```

### Condition evaluator

Existing `conditionEvaluator.ts` evaluates against PlayerState. We add a
target-aware variant:

```ts
export function evaluateActionConditions(
  player: PlayerState,
  target: Person,
  conditions: Condition[],
): boolean
```

Paths starting with `target.` resolve against the targeted Person; everything
else falls through to the existing evaluator.

### Effects + targeting

Effects need a way to reference the target. We add a payload convention:
when an effect's special is one of the relationship-mutators, it can include
`targetId` in the payload to identify which Person to mutate. The handlers
(`addRelationship`, `removeRelationship`, `breakUpPartner`, etc.) extend to
accept `targetId` where it makes sense.

We also need a new special: `adjustRelationshipLevel`:

```ts
{
  special: 'adjustRelationshipLevel',
  payload: { targetId: 'rel-mother', delta: 5 },
}
```

This is the single biggest engine extension and unlocks most of the
interaction content. It also makes the existing `relationshipLevel` field
(set on add, never updated) actually do something.

### Action registry

```ts
// src/game/data/actions/index.ts
export const ACTIONS_BY_TYPE: Record<RelationshipType, RelationshipAction[]>;
```

Authoring lives in `src/game/data/actions/`, one file per type
(`partner.ts`, `fiance.ts`, …). The validator runs `validateActions()` at
test time to enforce the same effects/outcomes shape rules as events.

### Helpers

```ts
// src/game/engine/interactions.ts
export function getActionsFor(target: Person, player: PlayerState): RelationshipAction[];
export function executeAction(
  state: PlayerState,
  target: Person,
  action: RelationshipAction,
  rng: Rng,
): { state: PlayerState; resolution: ResolvedChoice };
```

`executeAction` reuses `outcomeResolver.resolveChoice` and
`applyEffectsWithFeedback` so the resolution flows through the existing
ResolutionModal pipeline unchanged.

### Reuse summary

| Existing | Reused for | Notes |
|---|---|---|
| `outcomeResolver.resolveChoice` | action outcome picking | Action shape is Choice-compatible |
| `applyEffectsWithFeedback` | applying effects | unchanged |
| `ResolutionModal` | showing action result | unchanged |
| `InsufficientFundsModal` | money gate | unchanged |
| `useAction()` | big-tier action point spend | unchanged |
| `clampIfBounded` (effectsApplier) | clamping new `relationshipLevel` after `adjustRelationshipLevel` | extend STAT_PATHS |

---

## E. UI components

### New

- `RelationshipProfileModal.tsx` — opens on row tap. Shows person info, bond
  bar, meta, action list. Receives a Person and player state.
- `ActionList.tsx` — renders an array of `RelationshipAction` with status-aware
  enabling. Uses `getChoicePreview` for cost previews, same as ActivitiesMenu.

### Changed

- `SidePanel.tsx` — the four panels (Active, Family, Friends, Exes) get an
  `onSelect: (target: Person) => void` callback so rows are clickable. Keep
  the visual style the same; just wrap rows in `<button>`.
- `ActivitiesMenu.tsx` — remove `family_time` from the rendered list. The
  activity itself stays in the data file as a deprecated entry until X3
  cleanup.
- `ResolutionModal.tsx` — when narrative is null AND deltas/specials are
  empty, **skip the modal entirely** (Issue 3 fix from the UI audit). This
  is independent of interactions but lands first.

### State store extension

`gameStore.ts` gets:

```ts
profileTarget: Person | null; // open profile
openProfile(target: Person): void;
closeProfile(): void;
executeAction(actionId: string): void;
```

`executeAction` runs the action through `executeAction()` engine helper, then
sets `lastResolution` so ResolutionModal mounts as today.

Modal stacking priority (existing rule extended):
1. ResolutionModal
2. InsufficientFundsModal
3. EventModal
4. **RelationshipProfileModal** ← new, between EventModal and ActivitiesMenu
5. ActivitiesMenu

A pending event always preempts a profile, mirroring the existing rule for
ActivitiesMenu.

---

## F. Migration

### family_time

- X2: `family_time` is hidden from `getAvailableActivities` via a feature flag,
  not deleted. The data stays so existing tests keep parsing.
- X3: `family_time` deleted from `activities.ts`; `activityEngine.test.ts`
  updated; the per-person "Spend time" action takes over the role.

`call_friend` follows the same pattern but lands in X3 — friend-targeting
actions need the `targetId` path through effects, which X2 sets up.

### Existing events

Events with `has 'mother'` etc. continue to work — they're the random-event
half of the system, not the directed-action half. No migration needed.

### Save migration

No state-shape changes for `relationshipState`. The new
`Person.lastInteractionYears` field is optional, so old saves keep loading.

---

## G. Implementation order

### X2 (90-120 minutes) — foundation

1. **Issue 3 fix in ResolutionModal**: skip modal when nothing to show
   (already needed; gates everything else).
2. New types: `RelationshipAction`, `ActionTier`.
3. `interactions.ts` engine: `getActionsFor`, `executeAction`.
4. `adjustRelationshipLevel` special in `effectsApplier.ts`.
5. `RelationshipProfileModal.tsx` + `ActionList.tsx`.
6. SidePanel rows become clickable.
7. **Two actions** authored end-to-end:
   - `partner.spend_time` (light, free, +bond +happiness) — shows the light
     pattern works.
   - `partner.propose` (big, 1 AP + money) — shows the big pattern works
     and proves promotion via `addFiance` flows through `executeAction`.
8. Tests: action validator + one integration test that exercises both.

Acceptance: player can click partner, see profile, propose successfully,
see the partner promoted to fiance.

### X3 (90-120 minutes) — fill out

1. `lastInteractionYears` on Person + per-year cap helper.
2. Author the full action set per type from section C.
3. Targeting: `targetId` propagation through relationship-mutator specials.
4. Per-person `adjustRelationshipLevel` everywhere it makes sense.
5. Remove `family_time` and `call_friend` from activity menu;
   delete from `activities.ts`.
6. SidePanel polish: bond bar in profile modal, meta lines per type.
7. Tests: per-type action coverage, status-restriction tests, the
   married-while-single-action gating tests.

Acceptance: every relationship type has its full action set; family_time
and call_friend are gone; activity menu shows only the four self/career
activities (gym, library, vacation, find_date, work_harder, ask_raise,
visit_doctor, lottery_ticket, meditate, volunteer).

---

## H. Estimated effort

- Quick UI fixes (Issue 1 + Issue 3 + cleanup): **45-60 minutes**
- X2 (foundation + 2 actions): **90-120 minutes**
- X3 (full action set + migration): **90-120 minutes**

**Total: ~3.5 to 5 hours over three sessions.**

This excludes the depth-audit follow-on content (spouse-touch event batch,
father events, etc. from F.1 of the depth audit). Those events compound the
interaction system but are pure content additions and can land in later
sessions without engine changes.
