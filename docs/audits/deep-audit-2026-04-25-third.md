# Deep Audit (Third) — 2026-04-25

Triggered by Cristoffer's report that "Sam Park" still appears too often in
his lives despite the dedup fix in commit `fbedbed`. This audit verifies
the prior fix, traces the real cause of the name repetition, and surfaces
two new issues the previous audits missed.

**Scope:** audit only — no fixes shipped.

## TL;DR

1. The fbedbed fix works at the **ID** level (0 duplicate ids in 1000 with-AI
   lives), but the player-facing problem isn't ID collision — it's that
   activity and event payloads **hardcode** the names. "Sam Park" lands in
   **73 of 100 lives** (mean 2.5 records per affected life); "Alex Rivera"
   lands in even more.
2. **New critical bug introduced by fbedbed:** `removeRelationship` still
   filters by the *base* id (`rel-date-partner`), but `addRelationship`
   now stores `rel-date-partner-y2026-n3`. **Remove silently no-ops for
   anything created via addRelationship.** Average life ends with 5
   simultaneous partner records in state; max 12.
3. All 131 tests still green; deep-audit numbers are otherwise identical to
   the followup report.

---

## Section A — Sam Park investigation

### A1. Does the ID-level fix still hold?

Yes.

- `npm test` → **131/131 green**.
- Deep audit (1000 with-AI lives, seed 7) → **0 duplicate-id occurrences**
  (was 1,934 pre-fix).
- Synthetic 5×duplicate save → loadGame migration → **5 unique ids**
  (`rel-gym-friend`, `rel-gym-friend-migrated-1` … `-migrated-4`).

The migration in `src/game/state/persistence.ts:84` correctly uniquifies
duplicate ids on load. New saves never produce duplicates because the
addRelationship handler now mints unique ids at write time.

### A2. The real cause of name repetition

**Names are hardcoded in activity outcomes and event payloads.** Every gym
session has a 20% chance to add `firstName: 'Sam', lastName: 'Park'`
literally — there is no name-pool draw.

Cataloged:

| Source | File | Hardcoded name | Probability per trigger |
|---|---|---|---:|
| Activity `gym` outcome 2 | [activities.ts:55](src/game/data/activities.ts:55) | Sam Park (friend, 26) | 20% |
| Activity `library` outcome 3 | [activities.ts:111](src/game/data/activities.ts:111) | Robin Hayes (friend, 31) | 10% |
| Activity `vacation` outcome 2 | [activities.ts:179](src/game/data/activities.ts:179) | Casey Moreno (partner, 30) | 15% |
| Activity `find_date` outcome 2 | [activities.ts:232](src/game/data/activities.ts:232) | Alex Rivera (partner, 27) | 30% |
| Activity `find_date` outcome 4 | [activities.ts:260](src/game/data/activities.ts:260) | Morgan Bell (partner, 28) | 5% |
| Event `child_park_friend` | [childhood.ts:234](src/game/data/events/childhood.ts:234) | Alex Park (friend, 8) | 100% on choose-talk |
| Event `career_workplace_romance` | [career.ts:170](src/game/data/events/career.ts:170) | Riley Chen (partner, 28) | 100% on choose |
| Event `rel_first_date` | [relationships.ts:23](src/game/data/events/relationships.ts:23) | Jordan Reyes (partner, 24) | 100% on weight-50 outcome |
| Event `rel_propose` | [relationships.ts:114](src/game/data/events/relationships.ts:114), [134](src/game/data/events/relationships.ts:134) | Jordan Reyes (spouse, 28) | 100% on accept |
| Event `rel_received_proposal` | [relationships.ts:381](src/game/data/events/relationships.ts:381), [401](src/game/data/events/relationships.ts:401) | Jordan Reyes (spouse, 28) | 100% on accept |
| Event `rel_have_a_kid` | [relationships.ts:184](src/game/data/events/relationships.ts:184) | Sam (child, no last name) | 100% on accept |
| Event `rel_blind_date` | [relationships.ts:341](src/game/data/events/relationships.ts:341) | Avery Stone (partner, 32) | 100% on accept |

Note that `Jordan Reyes` is hardcoded across **four** different code paths
into `rel-spouse`, so any way you propose/get-proposed-to, the spouse is
named Jordan Reyes.

### A3. Frequency data (100 lives, activities-AI on, seed 42)

Top 10 full names across all relationship records (excluding parents):

| Rank | Full name | Records | % of total |
|---:|---|---:|---:|
| 1 | Alex Rivera | 285 | 32.0% |
| 2 | Sam Park | 180 | 20.2% |
| 3 | Robin Hayes | 134 | 15.0% |
| 4 | Casey Moreno | 72 | 8.1% |
| 5 | Jordan Reyes | 66 | 7.4% |
| 6 | Morgan Bell | 49 | 5.5% |
| 7 | Riley Chen | 23 | 2.6% |
| 8 | Alex Park | 13 | 1.5% |
| 9 | Avery Stone | 12 | 1.3% |
| 10 | Sam (no last name) | 4 | 0.4% |

Combined: **the top 10 hardcoded names account for 94% of all relationship
records**. The remaining 6% are pool-drawn names (parents and siblings via
`createNewLife`, plus 4 records with empty `lastName`).

#### "Sam Park" specifically

- Lives that had at least one Sam Park: **73 / 100 (73%)**
- Total Sam Park records across the run: **180**
- Average Sam Parks per life that had any: **2.47**
- Distribution: 27 lives with 0, 21 with 1, 22 with 2, 14 with 3, 10 with
  4, 3 with 5, 3 with 6.

Cristoffer's perception is correct: ~3 in 4 lives include at least one Sam
Park, and most affected lives have 2+. The fbedbed fix made each Sam Park's
*id* unique, but the displayed name is still always "Sam Park".

#### Intra-life name collisions

Same firstName+lastName appearing twice in the same life (different ids,
identical display):

| Full name | Total duplicate records across 100 lives |
|---|---:|
| Alex Rivera | 200 |
| Sam Park | 107 |
| Robin Hayes | 68 |
| Casey Moreno | 25 |
| Morgan Bell | 11 |
| Jordan Reyes | 11 |

So in a single life, players regularly see the same name appear several
times — UI shows two distinct relationship rows, both named "Sam Park",
both age 26.

### A4. Suggested fixes (audit only — not applied)

Three options, in increasing scope:

1. **Cheap, low-fidelity:** randomise the `firstName`/`lastName` on each
   `addRelationship` call inside `effectsApplier.ts`, drawing from the
   country's name pool, *unless* the payload provides one explicitly. This
   keeps event/activity data simple but breaks intent for events where the
   name carries meaning ("Jordan Reyes" appears in 4 different proposal
   paths — they should probably resolve to the same person, not 4 different
   randoms).
2. **Medium:** support a `firstName: '@random'` sentinel (or a missing
   firstName) that triggers a pool draw, but keep explicit names when the
   author writes them. Activities switch to `'@random'`; story-arc events
   like proposals keep "Jordan Reyes".
3. **Faithful:** keep activity-met characters anonymous in the data, give
   them a `nameSeed` based on (year, activity, choice index), and resolve
   the actual name lazily from the country pool. Same character every time
   the same year/activity/choice fires (deterministic), but different
   across lives.

Cristoffer to decide direction.

---

## Section B — Comparison with the previous followup

Numbers from `testing/agents/deepAudit.ts --lives=1000 --seed=7`. The
followup ran the same configuration; numbers are basically identical
because no balance changes were shipped between then and now.

| Metric | Followup (prior) | Now |
|---|---:|---:|
| Tests passing | 131/131 | 131/131 |
| Duplicate relationship IDs | 0 | 0 |
| Mean lifespan (no-AI / with-AI) | 70.5 / 73.3 | 70.5 / 73.3 |
| Mean money (no-AI / with-AI) | 1,311,868 / 1,670,214 | 1,311,868 / 1,670,214 |
| HS graduation (no-AI / with-AI) | 461 / 444 | 461 / 444 |
| Uni graduation (no-AI / with-AI) | 39 / 46 | 39 / 46 |
| Grad school (no-AI / with-AI) | 2 / 1 | 2 / 1 |
| `career_burnout` (no-AI / with-AI) | 8.7% / 0.2% | 8.7% / 0.2% |
| `career_fired` (no-AI / with-AI) | 8.7% / 0.5% | 8.7% / 0.5% |
| `rel_breakup` (no-AI / with-AI) | 64.1% / 81.2% | 64.1% / 81.2% |
| Stat-bounds violations | 0 | 0 |
| Events triggered ≥1× (of 75) | 75 | 75 |
| Activities picked ≥1× | 12/12 | 12/12 |

**Nothing has regressed in the headline numbers.** The interesting deltas
are qualitative — see Section C.

---

## Section C — New findings

### C1. ⚠ CRITICAL — `removeRelationship` silently no-ops for anything created via `addRelationship`

Introduced by the fbedbed fix. `addRelationship` now stores
`rel-date-partner-y2026-n3` (unique id), but `removeRelationship` still
filters by the literal base id `rel-date-partner`. So:

- `rel_breakup` "End it" choice → does **not** remove the partner.
- `rel_received_proposal` accept-and-merge logic → does **not** clean up
  prior dating relationships.
- `rel_propose` accept paths → keep the dating partner around alongside
  the new spouse.
- The "blind-date never happened" branch (line 419-421 in relationships.ts)
  → no-ops.

Reproduced via [`testing/agents/removeRelCheck.ts`](testing/agents/removeRelCheck.ts):

```
After add — relationships: [ 'rel-date-partner-y2026-n0 (Alex Rivera)' ]
After remove({id: 'rel-date-partner'}) — relationships:
              [ 'rel-date-partner-y2026-n0 (Alex Rivera)' ]
⚠ Remove DID NOT WORK.
```

Player-visible impact, measured over 200 simulated lives:

| Metric | Result |
|---|---:|
| Total partner records still alive at death (200 lives) | 1,001 |
| Total spouse records still alive at death | 94 |
| Average partners-per-life | **5.0** |
| Lives with >1 simultaneous partner | **177 / 200 (88.5%)** |
| Max partners in one life | 12 |

A typical life ends carrying 5 unrelated "current partners" in the
relationships array. The condition `relationships has 'partner'` keeps
firing `rel_breakup` (81% of with-AI lives) but the partner never
actually leaves, so the event keeps re-firing — it doesn't drive the
trigger rate down because nothing gets removed.

This is the most player-impactful bug found in this audit. The previous
followup's design observation (line 157 in `deep-audit-2026-04-25.md`)
hinted at the duplicate-id corner case but did not foresee that the
chosen fix shape — uniquifying ids on add — would break removes.

**Note on parents:** `rel-mother`, `rel-father`, `rel-sibling` are seeded
*directly* in `createNewLife` ([newLife.ts:35](src/game/state/newLife.ts:35),
[newLife.ts:46](src/game/state/newLife.ts:46), [newLife.ts:60](src/game/state/newLife.ts:60))
without going through `addRelationship`, so their ids are NOT suffixed and
removeRelationship still works for them (`rel_parent_dies` removes
`rel-mother` correctly). The bug only affects relationships added later
via the special handler.

### C2. ⚠ Hardcoded names — 12 sites across 6 files

See Section A2 for the full table. Adjacent finding: `rel_have_a_kid`
adds a child named **`firstName: 'Sam', lastName: ''`** (empty surname).
The empty string shows up in the UI as just "Sam" with no last name.
Affects 10–13% of lives (rel_have_a_kid trigger rate).

### C3. Stat saturation persists

Already flagged in the prior audit (C2/D4) — confirming it's still here:

| Stat | No-AI mean | With-AI mean |
|---|---:|---:|
| Health | 61.2 | 88.1 |
| Happiness | 65.0 | 97.8 |
| Smarts | 71.2 | 98.3 |
| Looks | 65.7 | 77.5 |

With activities engaged the AI parks at the 0..100 ceiling for three of
four stats. Not new, not regressed — listed for completeness.

### C4. `edu_uni_party_phase` still starves

1.3% / 0.3% trigger rate (no-AI / with-AI). Acknowledged-deferred in the
followup; mentioning it because it's the only event in the catalog that
is structurally reachable but practically never fires.

### C5. No new content-unreachability

All 75 events trigger ≥1× across 1000 + 1000 lives. All 12 activities are
picked ≥1× by the AI. **No regression on coverage.**

### C6. (FYI) `random.ts` over-triggering unchanged

22 events still over-trigger (>70% of lives). Top offenders unchanged from
the followup: `random_found_money` 94.5%/94.6%, `random_weird_dream`
94.1%/94.2%, `rel_meet_old_friend` 92.2%/92.2%. No new regressions in
this dimension.

---

## Section D — Recommendations

### Top 3 to fix first

1. **C1 — `removeRelationship` silently no-ops.** Fix `removeRelationship`
   to match by *prefix* of the base id (`r.id === id || r.id.startsWith(${id}-y)`)
   or, cleaner, store the original `baseId` on the Relationship type and
   match on that. Either approach restores rel_breakup / rel_received_proposal
   behaviour. Add a regression test.
2. **A — Hardcoded names.** Pick a direction (cheap / medium / faithful per
   A4) and apply it consistently across the 12 sites. The medium option
   (sentinel-based opt-in) is probably the right tradeoff — it doesn't
   force a refactor of story-arc events that lean on named characters.
3. **C2 — `rel_have_a_kid` empty `lastName`.** Either drop the lastName
   field in the payload (UI shows just first name) or have `addRelationship`
   default lastName to the player's lastName when missing. Same fix shape
   regardless of how A is resolved.

### Top 3 to defer

1. **C3 stat saturation.** Already deferred; nothing new to add. Needs a
   balance pass on activity yields, not a bug fix.
2. **C4 edu_uni_party_phase starvation.** Single content gap; can ride
   alongside the next education-events expansion.
3. **C6 random.ts over-triggering.** Tuning, not a bug. Can wait for the
   next content batch when weights get a deliberate review.

### Design questions for human decision

1. **Activity-met characters: persistent or ephemeral?** The current model
   ("Sam Park appears once and stays in your relationships forever") may
   not be the intent — most BitLife-style sims treat one-night stands as
   ephemeral and only persistent if the player explicitly keeps them.
   Decision affects A4 direction and may also let removeRelationship sidestep
   the fix in C1 entirely (if activity relationships time-out automatically).
2. **Spouse identity continuity.** Across 4 different proposal paths the
   spouse is always "Jordan Reyes". Intentional canon character or a
   placeholder? Affects whether the fix-A direction should pool-randomise
   spouses or keep them named.
3. **Should the `Relationship` schema add a `metAt` / `source` field?** It
   would solve A4 (regenerate displayed name from a seed + source) and
   give events something to reference ("your gym friend" vs "your library
   friend"). Bigger change, only worth doing if the team thinks future
   content will want it.

---

## Appendix — Reproducing this audit

`testing/reports/` is gitignored, so the raw outputs are local artifacts —
regenerate with the scripts below. All scripts live under `testing/agents/`
and are checked in.

```bash
# 1) Standard deep-audit numbers (1000 × 2 passes, seed 7)
npx tsx testing/agents/deepAudit.ts

# 2) Name-frequency drill-down (100 lives, seed 42)
npx tsx testing/agents/nameFrequency.ts

# 3) Synthetic 5×duplicate-id save → migration check
npx tsx testing/agents/migrationCheck.ts

# 4) Verify removeRelationship still silently no-ops post-fix
npx tsx testing/agents/removeRelCheck.ts

# 5) Measure partner-record accumulation per life (200 lives)
npx tsx testing/agents/partnerAccumCheck.ts
```

Source files:

- [testing/agents/nameFrequency.ts](testing/agents/nameFrequency.ts)
- [testing/agents/migrationCheck.ts](testing/agents/migrationCheck.ts)
- [testing/agents/removeRelCheck.ts](testing/agents/removeRelCheck.ts)
- [testing/agents/partnerAccumCheck.ts](testing/agents/partnerAccumCheck.ts)
