# UI Issues Audit — 2026-04-26

Player-reported issues from A1 testing (commit 0fa2152). Diagnoses + fixes,
plus a deferral plan that hands off to the interactions-system rebuild
([docs/architecture/relationship-interactions.md](../architecture/relationship-interactions.md)).

**Scope:** audit + scope only. No implementation. Two of the four issues are
small UI fixes that land before X2; two are subsumed by the interactions
system.

## TL;DR

| # | Issue | Verdict | Where to fix |
|---|---|---|---|
| 1 | Active partner appears under "Exes" | UI label bug, not state corruption | [SidePanel.tsx:228](../../src/ui/components/SidePanel.tsx) — quick fix |
| 2 | No way to initiate marriage outside random events | True; partly addressed by A1 events, fully by X2 | X2: `partner.propose` action |
| 3 | Empty ResolutionModal | 3 events with `effects: []` + 119 deterministic choices show no narrative | [ResolutionModal.tsx:81](../../src/ui/components/ResolutionModal.tsx) — quick fix |
| 4 | Activities-menu has `family_time`, conceptually per-person | Confirmed; moves to per-person action | X3 migration |

---

## Issue 1 — Active partner under "Exes"

### Diagnosis

The state is **correct**. Engine state never has a person in both an active
slot and an ex list. Verified by tracing partner → fiance → spouse promotion
in `testing/scratch/diag-issue1.ts`:

```
STAGE 4 (after addSpouse): {
  spouse: { baseId: 'rel-activity-partner' },
  fiance: null, partner: null,
  significantExes: [],
  casualExes: [ { baseId: 'rel-blind-date', formerSlot: 'partner' } ]
}
```

The casualEx in the list is a *previous* partner, displaced when
`find_date` fired again. That's by design.

The bug is in the **UI label**:

```tsx
// src/ui/components/SidePanel.tsx:226-230
<div className="font-medium capitalize">
  {ex.type === 'casualEx' ? 'Casual ex' : 'Significant ex'}
  {ex.formerSlot && (
    <span className="ml-2 text-xs text-slate-400">({ex.formerSlot})</span>
  )}
</div>
```

A casualEx whose `formerSlot` is `'partner'` renders as **"Casual ex (partner)"**.
A glance reads "(partner)" as a current-status tag. The empty `firstName`
(no event provides one) compounds the confusion: the row reads
`Casual ex (partner)\n  — age 32`, which a player parses as "an unnamed
person currently labeled partner".

### Recommended fix

Change the suffix to read as *historical*, not current:

```tsx
// src/ui/components/SidePanel.tsx:227-229
{ex.formerSlot && (
  <span className="ml-2 text-xs text-slate-400">
    (former {ex.formerSlot})
  </span>
)}
```

Renders as `Casual ex (former partner)`. Unambiguous.

**Effort:** 5 minutes (one Edit).

The empty-firstName issue is real but separate — see "Followups" below.

---

## Issue 2 — No way to initiate marriage outside random events

### Diagnosis

Correct as stated. After A1 (commit 0fa2152) added
`rel_partner_proposal_pressure`, the player can now opt-in to propose when
that event fires (3+ years together), but the trigger is still random.
There's no "I want to propose now" affordance.

### Recommended fix

Build the interactions-system. The X2 milestone explicitly delivers a
`propose` action on the partner profile; player taps the partner row,
sees "Propose" (1 AP, -4500), and the outcome flows through `addFiance`
identically to the event path.

See `relationship-interactions.md` § G.X2.

**Effort:** part of X2 (90-120 minutes total).

---

## Issue 3 — Empty ResolutionModal

### Diagnosis

Two distinct cases:

**Bug — 3 events with truly empty modal output:**

| Event | Choice | Effects |
|---|---|---|
| `random_lottery_win` | "Save your money" | `effects: []` |
| `random_gym_membership` | "Skip it" | `effects: []` |
| `random_meditation_phase` | "Roll your eyes" | `effects: []` |

These choices have an empty effects array. After resolution:
- `narrative` is `null` (deterministic choice)
- `deltas` is `[]`
- `specials` is `[]`

[ResolutionModal.tsx:80](../../src/ui/components/ResolutionModal.tsx) renders
the card frame with neither the "What happened" header nor the deltas list.
The user sees a blank card with only "Continue".

**By design — 119 deterministic choices with no narrative but real effects:**

The validator only requires that *probabilistic* outcomes have a non-empty
narrative ([eventValidator.test.ts](../../tests/engine/eventValidator.test.ts)).
Deterministic choices return `narrative: null` from `outcomeResolver.ts`.
ResolutionModal hides the "What happened" section in that case but still
shows stat deltas. This is the BitLife shape — when the player picks
"Decline", they don't need a narrative; the -2 happiness chip is the answer.

### Recommended fix

**Skip the ResolutionModal entirely when there's nothing to show.**

```tsx
// src/ui/components/ResolutionModal.tsx — guard inside, OR check at render-site
if (!hasNarrative && !hasDeltas) return null;
```

Cleaner approach: do the check at the render site
([GameScreen.tsx:118](../../src/ui/screens/GameScreen.tsx)) so the
modal-stacking logic short-circuits and immediately advances. The store
should clear `lastResolution` automatically when no narrative + no deltas.

Practically, this means the three "no-op" choices resolve silently — the
player picks, the modal never appears, the next event (or age button)
becomes available immediately. That matches BitLife behavior.

**Effort:** 10-15 minutes including a unit test for the no-op-resolution
case.

---

## Issue 4 — Activities-menu has `family_time`

### Diagnosis

The Activities button is **visible enough** — it sits in the bottom bar
alongside "Age +1", takes 1/3 width, has a contrasting border, and a badge
showing remaining actions. A new player will find it within a session; the
issue isn't discovery.

The user's complaint is conceptual: `family_time` is a generic
"spend time with family" lump that doesn't target a specific person. It
gives `+4..+5 happiness` and `+0..+2 smarts` but does NOT touch
`relationshipLevel` on any family member. The activity is misleadingly named.

Activities that conceptually belong as per-person interactions:

- `family_time` → split into per-family-member "Spend time"
- `call_friend` → per-friend "Call" (currently resets *all* friends, which
  the audit flagged as homogenization)

`find_date` stays — it creates a new partner, doesn't deepen an existing
one. Same logic for `vacation`, `gym`, `library`, `volunteer`, etc.: they're
self-care/career activities; the rare bonus chance to meet someone is a
side effect, not the purpose.

### Recommended fix

Per-person actions live in the new RelationshipProfileModal (X2 + X3).
`family_time` and `call_friend` get hidden from the menu in X2 and removed
in X3. See `relationship-interactions.md` § F (Migration).

**Effort:** part of X2 + X3.

---

## Followups noticed during the audit

These are **not** from the player report but surfaced while diagnosing:

1. **Empty `firstName` on every event-created relationship.** No event or
   activity payload sets `firstName`/`lastName`. Compounds Issue 1's
   readability problem and would also make the new RelationshipProfileModal
   look bad. **Fix idea:** seed names from the player's namepool inside
   `payloadToPerson` when the payload doesn't supply them, or have each
   event author it. Schedule for the X2 work or as a small standalone fix.

2. **`relationshipLevel` set on add, never updated.** Already flagged in the
   depth audit as F.2.2. The interactions-system's `adjustRelationshipLevel`
   special closes this gap.

3. **CasualEx row in SidePanel hides the bond meter.** Active/Family/Friends
   show closeness; the ExRow doesn't. If we want exes to feel "alive enough
   to flirt back with", showing their level helps. Defer to interactions UI
   pass.

---

## Recommended session order

Quick fixes session (~45-60 min):

1. **Issue 1**: change "(partner)" to "(former partner)" in SidePanel
   ExRow. 5 min.
2. **Issue 3**: skip ResolutionModal when narrative is null AND
   deltas/specials are empty. 10-15 min including test.
3. **Optional bonus**: address followup #1 (empty `firstName`) by minting
   default first/lastNames in `payloadToPerson`. ~30 min.
4. Run `npm test` + `npm run build` to confirm green. 5 min.

X2 (~90-120 min): foundation + two actions (`partner.spend_time`,
`partner.propose`). See scope doc § G.

X3 (~90-120 min): full action set per type, family_time/call_friend
migration. See scope doc § G.

---

## References

- [docs/architecture/relationship-interactions.md](../architecture/relationship-interactions.md) — full scope
- [docs/audits/relationship-depth-audit-2026-04-26.md](relationship-depth-audit-2026-04-26.md) — what's silent
- Diagnostic methodology: ad-hoc tsx scripts in `testing/scratch/` (gitignored)
  walked the partner→fiance→spouse promotion to verify slot integrity, and
  scanned `ALL_EVENTS`/`ALL_ACTIVITIES` for outcomes-without-narrative and
  choices-with-empty-effects.
